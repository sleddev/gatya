#!/usr/bin/env node
// Builds everything the app needs from /content:
//   src/content/generated/mdx/<tantargy>/<tema>.ts   compiled MDX components
//   src/content/generated/manifest.ts                 subjects, topics, headings (navigation)
//   src/content/generated/registry.ts                 topic id -> component
//   src/content/generated/search.ts                   search index (one entry per section)
//
// Usage: node scripts/build-content.mjs [--watch]
// Authoring guide: docs/TARTALOM.md

import { existsSync, watch } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from '@mdx-js/mdx';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import rehypeKatex from 'rehype-katex';
import { toString as hastToString } from 'hast-util-to-string';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const WIDGETS = path.join(ROOT, 'src', 'widgets');
const OUT = path.join(ROOT, 'src', 'content', 'generated');

// Shortcuts available in $...$ math: \N \Z \Q \R \C for the number sets.
const KATEX_MACROS = { '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}', '\\R': '\\mathbb{R}', '\\C': '\\mathbb{C}' };
const STATUSES = ['kimaradt', 'ismetles', 'talan', 'kovetkezo', 'lecke'];
const SUBJECT_FILE = '_tantargy.yml';
const FILE_RE = /^(\d+)-([a-z0-9-]+)\.mdx$/;

const rel = (p) => path.relative(ROOT, p);

/** Heading ids without accents, so links can be typed easily: "Második szakasz" -> "masodik-szakasz". */
const plain = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const makeSlugger = () => {
  const g = new GithubSlugger();
  return (text) => g.slug(plain(text));
};

// Chrome's MathML Core ignores mathvariant, so \mathbb{N} would show a plain N.
// Map those letters to the real Unicode math characters (ℕ, 𝒫, 𝐯, …) instead.
const LETTER_EXCEPTIONS = {
  'double-struck': { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' },
  script: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
  fraktur: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
  bold: {},
};
const LETTER_BASE = {
  'double-struck': [0x1d538, 0x1d552, 0x1d7d8],
  script: [0x1d49c, 0x1d4b6, null],
  fraktur: [0x1d504, 0x1d51e, null],
  bold: [0x1d400, 0x1d41a, 0x1d7ce],
};
function styleChar(ch, variant) {
  const ex = LETTER_EXCEPTIONS[variant]?.[ch];
  if (ex) return ex;
  const [upper, lower, digit] = LETTER_BASE[variant];
  const c = ch.codePointAt(0);
  if (c >= 65 && c <= 90) return String.fromCodePoint(upper + c - 65);
  if (c >= 97 && c <= 122) return String.fromCodePoint(lower + c - 97);
  if (digit && c >= 48 && c <= 57) return String.fromCodePoint(digit + c - 48);
  return ch;
}
function rehypeMathVariants() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      const p = node.properties ?? {};
      const key = 'mathVariant' in p ? 'mathVariant' : 'mathvariant' in p ? 'mathvariant' : null;
      const variant = key && p[key];
      if (!variant || !LETTER_BASE[variant]) return;
      for (const child of node.children) if (child.type === 'text') child.value = [...child.value].map((ch) => styleChar(ch, variant)).join('');
      p[key] = 'normal';
    });
  };
}

/** rehype plugin: give every heading the same id the manifest uses. */
function rehypeHeadingIds() {
  return (tree) => {
    const slug = makeSlugger();
    visit(tree, 'element', (node) => {
      if (/^h[1-6]$/.test(node.tagName) && !node.properties?.id)
        node.properties = { ...node.properties, id: slug(hastToString(node).trim()) };
    });
  };
}

class ContentError extends Error {}

function splitFrontmatter(src, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) throw new ContentError(`${rel(file)}: missing frontmatter (--- ... --- at the top of the file)`);
  let data;
  try {
    data = YAML.parse(m[1]) ?? {};
  } catch (e) {
    throw new ContentError(`${rel(file)}: invalid YAML in frontmatter: ${e.message}`);
  }
  return data;
}

async function allowedComponents(errors) {
  const files = existsSync(WIDGETS) ? await readdir(WIDGETS) : [];
  const names = files.filter((f) => /^[A-Z]\w*\.tsx$/.test(f)).map((f) => f.replace(/\.tsx$/, ''));
  const index = await readFile(path.join(WIDGETS, 'index.ts'), 'utf8').catch(() => '');
  for (const n of names)
    if (!new RegExp(`^\\s*${n},\\s*$`, 'm').test(index))
      errors.push(`src/widgets/${n}.tsx is not listed in mdxComponents in src/widgets/index.ts`);
  return new Set(names);
}

const parser = unified().use(remarkParse).use(remarkFrontmatter).use(remarkMdx).use(remarkGfm).use(remarkMath);

// Readable plain text for search snippets: "a \\equiv b \\pmod m" -> "a ≡ b (mod m)".
const TEX_SYMBOLS = {
  equiv: '≡', mid: '|', nmid: '∤', cdot: '·', times: '×', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
  in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', setminus: '∖', triangle: '△', emptyset: '∅',
  forall: '∀', exists: '∃', nexists: '∄', neg: '¬', wedge: '∧', land: '∧', vee: '∨', lor: '∨', supset: '⊃', models: '⊨',
  iff: '⇔', Leftrightarrow: '⇔', implies: '⇒', Rightarrow: '⇒', to: '→', mapsto: '↦', infty: '∞', pm: '±', dots: '…',
  ldots: '…', cdots: '⋯', varphi: 'φ', phi: 'φ', pi: 'π', alpha: 'α', beta: 'β', varepsilon: 'ε', varrho: 'ϱ', Gamma: 'Γ',
  Delta: 'Δ', langle: '⟨', rangle: '⟩', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', R: 'ℝ', C: 'ℂ', lvert: '|', rvert: '|', prod: '∏', sum: '∑',
};
function texToText(tex) {
  let s = tex;
  for (let i = 0; i < 4; i++) s = s.replace(/\\(?:d|t)?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  s = s
    .replace(/\\pmod\{([^{}]*)\}/g, ' (mod $1)')
    .replace(/\\pmod\s*(\w+)/g, ' (mod $1)')
    .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
    .replace(/\\(?:text|mathrm|operatorname|mathbf|mathcal|mathbb)\{([^{}]*)\}/g, '$1')
    .replace(/\\([A-Za-z]+)/g, (m, name) => TEX_SYMBOLS[name] ?? '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ');
  return s.trim();
}

/** Plain text of a markdown node, with math made readable and JSX attributes ignored. */
function plainText(node) {
  if (node.type === 'inlineMath' || node.type === 'math') return texToText(node.value);
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (node.children) return node.children.map(plainText).join(node.type === 'paragraph' || node.type === 'tableCell' ? '' : ' ');
  return '';
}

/** Headings (with the same ids rehype-slug will generate), search sections, links and JSX names. */
function analyse(tree) {
  const slug = makeSlugger();
  const headings = [];
  const byNode = new Map();
  const problems = [];
  visit(tree, 'heading', (node) => {
    const text = toString(node).trim();
    const id = slug(text);
    let hasMath = false;
    visit(node, 'inlineMath', () => {
      hasMath = true;
    });
    if (hasMath) problems.push({ node, msg: 'avoid $math$ in headings (it breaks anchors and search)' });
    byNode.set(node, { id, text });
    if (node.depth === 2 || node.depth === 3) headings.push({ id, text, depth: node.depth });
  });

  // Search sections: everything before the first ## and then one per ##.
  const sections = [{ heading: '', anchor: '', parts: [] }];
  for (const node of tree.children) {
    if (node.type === 'yaml' || node.type === 'mdxjsEsm') continue;
    if (node.type === 'heading' && node.depth === 2) {
      const h = byNode.get(node);
      sections.push({ heading: h.text, anchor: h.id, parts: [] });
      continue;
    }
    sections.at(-1).parts.push(plainText(node));
  }

  const links = [];
  visit(tree, 'link', (node) => {
    if (node.url.startsWith('/')) links.push({ node, url: node.url });
  });
  const jsx = [];
  visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
    if (node.name && /^[A-Z]/.test(node.name)) jsx.push({ node, name: node.name });
  });
  return {
    headings,
    problems,
    links,
    jsx,
    sections: sections
      .map((s) => ({ ...s, text: s.parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 1800) }))
      .filter((s) => s.heading || s.text),
  };
}

const loc = (file, node) =>
  `${rel(file)}${node?.position ? `:${node.position.start.line}:${node.position.start.column}` : ''}`;

async function compileMdx(source, file) {
  const out = await compile(
    { value: source, path: file },
    {
      outputFormat: 'program',
      jsx: false,
      jsxImportSource: 'react',
      development: false,
      remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath],
      rehypePlugins: [rehypeHeadingIds, [rehypeKatex, { output: 'mathml', strict: false, macros: KATEX_MACROS }], rehypeMathVariants],
    }
  );
  const fmt = (m) => `${rel(file)}:${m.line ?? '?'}:${m.column ?? '?'} ${m.reason}`;
  const isMath = (m) => String(m.source ?? '').includes('katex') || String(m.ruleId ?? '').includes('katex');
  return {
    code: String(out),
    warnings: out.messages.filter((m) => !isMath(m)).map(fmt),
    errors: out.messages.filter(isMath).map((m) => `${fmt(m)} (LaTeX)`),
  };
}

async function writeIfChanged(file, text, written) {
  written.add(file);
  if (existsSync(file) && (await readFile(file, 'utf8')) === text) return;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

async function listFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p)));
    else out.push(p);
  }
  return out;
}

async function build() {
  const t0 = Date.now();
  const errors = [];
  const warnings = [];
  const allowed = await allowedComponents(errors);
  const subjects = [];
  const search = [];
  const registry = [];
  const written = new Set();
  const pendingLinks = [];

  const dirs = (await readdir(CONTENT, { withFileTypes: true })).filter((d) => d.isDirectory());
  for (const dir of dirs) {
    const sdir = path.join(CONTENT, dir.name);
    const metaFile = path.join(sdir, SUBJECT_FILE);
    if (!existsSync(metaFile)) {
      warnings.push(`${rel(sdir)}: no ${SUBJECT_FILE}, folder skipped`);
      continue;
    }
    let meta;
    try {
      meta = YAML.parse(await readFile(metaFile, 'utf8')) ?? {};
    } catch (e) {
      errors.push(`${rel(metaFile)}: invalid YAML: ${e.message}`);
      continue;
    }
    for (const k of ['cim', 'rovid', 'szin']) if (!meta[k]) errors.push(`${rel(metaFile)}: missing "${k}"`);
    const subject = {
      slug: dir.name,
      title: meta.cim ?? dir.name,
      short: meta.rovid ?? dir.name,
      color: meta.szin ?? '#5D9040',
      colorDark: meta.szin_sotet ?? meta.szin ?? '#8BC46A',
      lecturer: meta.oktato ?? '',
      intro: meta.leiras ?? '',
      order: Number(meta.sorrend ?? 99),
      topics: [],
    };

    const files = (await readdir(sdir)).filter((f) => f.endsWith('.mdx')).sort();
    for (const f of files) {
      const file = path.join(sdir, f);
      const m = FILE_RE.exec(f);
      if (!m) {
        errors.push(`${rel(file)}: file names must look like "03-teljes-indukcio.mdx" (number, dash, lowercase slug)`);
        continue;
      }
      const source = await readFile(file, 'utf8');
      let fm;
      try {
        fm = splitFrontmatter(source, file);
      } catch (e) {
        errors.push(e.message);
        continue;
      }
      if (!fm.cim) errors.push(`${rel(file)}: frontmatter needs "cim"`);
      const status = fm.allapot ?? 'kimaradt';
      if (!STATUSES.includes(status))
        errors.push(`${rel(file)}: "allapot" must be one of ${STATUSES.join(', ')} (got "${status}")`);

      let tree;
      try {
        tree = parser.parse(source);
      } catch (e) {
        errors.push(`${rel(file)}:${e.line ?? '?'}:${e.column ?? '?'} ${e.reason ?? e.message}`);
        continue;
      }
      const a = analyse(tree);
      for (const p of a.problems) warnings.push(`${loc(file, p.node)} ${p.msg}`);
      for (const j of a.jsx)
        if (!allowed.has(j.name))
          errors.push(
            `${loc(file, j.node)} unknown component <${j.name}>. Available: ${[...allowed].sort().join(', ')}`
          );
      for (const l of a.links) pendingLinks.push({ file, ...l });

      const slug = m[2];
      const id = `${subject.slug}/${slug}`;
      const topic = {
        id,
        subject: subject.slug,
        slug,
        order: Number(m[1]),
        title: fm.cim ?? slug,
        summary: fm.osszefoglalo ?? '',
        status,
        keywords: Array.isArray(fm.kulcsszavak) ? fm.kulcsszavak.map(String) : [],
        source: fm.forras ?? '',
        headings: a.headings,
      };
      subject.topics.push(topic);
      for (const s of a.sections)
        search.push({
          id: `${id}#${s.anchor}`,
          topic: id,
          subject: subject.slug,
          title: topic.title,
          heading: s.heading,
          anchor: s.anchor,
          keywords: topic.keywords.join(' '),
          text: s.text,
        });

      try {
        const { code, warnings: w, errors: e } = await compileMdx(source, file);
        warnings.push(...w);
        errors.push(...e);
        const outFile = path.join(OUT, 'mdx', subject.slug, `${slug}.ts`);
        await writeIfChanged(
          outFile,
          `// @ts-nocheck\n// Generated from ${rel(file)} by scripts/build-content.mjs. Do not edit.\n${code}\n`,
          written
        );
        registry.push({ id, importPath: `./mdx/${subject.slug}/${slug}` });
      } catch (e) {
        const place = e.place?.start ?? e.place ?? {};
        errors.push(`${rel(file)}:${place.line ?? e.line ?? '?'}:${place.column ?? e.column ?? '?'} ${e.reason ?? e.message}`);
      }
    }
    subject.topics.sort((x, y) => x.order - y.order);
    subjects.push(subject);
  }
  subjects.sort((x, y) => x.order - y.order);

  // Internal links: /tantargy/tema or /tantargy/tema#cimsor
  const topicById = new Map(subjects.flatMap((s) => s.topics.map((t) => [t.id, t])));
  for (const l of pendingLinks) {
    const [p, hash] = l.url.split('#');
    const parts = p.split('/').filter(Boolean);
    if (parts.length === 0 || p === '/kereses') continue;
    if (parts.length === 1) {
      if (!subjects.some((s) => s.slug === parts[0])) errors.push(`${loc(l.file, l.node)} broken link ${l.url}`);
      continue;
    }
    const t = topicById.get(parts.slice(0, 2).join('/'));
    if (!t) errors.push(`${loc(l.file, l.node)} broken link ${l.url} (no such topic)`);
    else if (hash && !t.headings.some((h) => h.id === decodeURIComponent(hash)))
      errors.push(
        `${loc(l.file, l.node)} broken link ${l.url}: no heading "#${hash}" in ${t.id}. Headings: ${t.headings
          .map((h) => h.id)
          .join(', ')}`
      );
  }

  const header = '// Generated by scripts/build-content.mjs. Do not edit.\n';
  await writeIfChanged(
    path.join(OUT, 'manifest.ts'),
    `${header}import type { Subject } from '../types';\n\nexport const subjects: Subject[] = ${JSON.stringify(subjects, null, 2)};\n`,
    written
  );
  await writeIfChanged(
    path.join(OUT, 'registry.ts'),
    `${header}import type { ComponentType } from 'react';\n${registry
      .map((r, i) => `import C${i} from '${r.importPath}';`)
      .join('\n')}\n\nexport const registry: Record<string, ComponentType<any>> = {\n${registry
      .map((r, i) => `  '${r.id}': C${i},`)
      .join('\n')}\n};\n`,
    written
  );
  await writeIfChanged(
    path.join(OUT, 'search.ts'),
    `${header}import type { SearchEntry } from '../types';\n\nexport const searchEntries: SearchEntry[] = ${JSON.stringify(search)};\n`,
    written
  );

  // Remove generated files for deleted/renamed topics.
  if (existsSync(OUT)) for (const f of await listFiles(OUT)) if (!written.has(f)) await rm(f);

  const n = subjects.reduce((s, x) => s + x.topics.length, 0);
  for (const w of warnings) console.warn(`  warning  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`  error    ${e}`);
    console.error(`\n✗ content: ${errors.length} error(s)`);
    return false;
  }
  console.log(`✓ content: ${subjects.length} subjects, ${n} topics, ${search.length} search entries (${Date.now() - t0} ms)`);
  return true;
}

const ok = await build().catch((e) => {
  console.error(e);
  return false;
});

if (process.argv.includes('--watch')) {
  let timer;
  let running = false;
  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (running) return trigger();
      running = true;
      await build().catch((e) => console.error(e));
      running = false;
    }, 120);
  };
  watch(CONTENT, { recursive: true }, trigger);
  watch(WIDGETS, trigger);
  console.log('watching content/ for changes…');
} else if (!ok) {
  process.exit(1);
}
