// Typed math answers: a small evaluator for what students write ("7/3", "2√2", "3−2i", "9x − 15",
// "(k+1)(k+2)/2", "{2, 6, 10}") and the comparison used by the lesson exercises. Values are complex
// numbers throughout, so real answers are simply the ones with no imaginary part. Pure, no DOM.

export interface C {
  re: number;
  im: number;
}

const c = (re: number, im = 0): C => ({ re, im });
const add = (a: C, b: C) => c(a.re + b.re, a.im + b.im);
const sub = (a: C, b: C) => c(a.re - b.re, a.im - b.im);
const mul = (a: C, b: C) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
function div(a: C, b: C): C {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new ExprError('Nullával nem lehet osztani.');
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
}
const abs = (a: C) => Math.hypot(a.re, a.im);
function pow(a: C, b: C): C {
  if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 4096) {
    // repeated squaring keeps i² = −1 exact
    let n = Math.abs(b.re);
    let base = a;
    let r = c(1);
    while (n > 0) {
      if (n & 1) r = mul(r, base);
      base = mul(base, base);
      n >>= 1;
    }
    return b.re < 0 ? div(c(1), r) : r;
  }
  if (a.im === 0 && a.re > 0 && b.im === 0) return c(a.re ** b.re);
  if (abs(a) === 0) return c(0);
  const lr = Math.log(abs(a));
  const th = Math.atan2(a.im, a.re);
  const m = Math.exp(b.re * lr - b.im * th);
  const ang = b.im * lr + b.re * th;
  return c(m * Math.cos(ang), m * Math.sin(ang));
}
function sqrt(a: C): C {
  if (a.im === 0) return a.re >= 0 ? c(Math.sqrt(a.re)) : c(0, Math.sqrt(-a.re));
  return pow(a, c(0.5));
}
const real = (f: (x: number) => number) => (a: C) => {
  if (Math.abs(a.im) > 1e-12) throw new ExprError('Ez a függvény itt csak valós számra működik.');
  return c(f(a.re));
};

const FUNCS: Record<string, (a: C) => C> = {
  sqrt,
  gyok: sqrt,
  abs: (a) => c(abs(a)),
  sin: real(Math.sin),
  cos: real(Math.cos),
  tan: real(Math.tan),
  tg: real(Math.tan),
  arcsin: real(Math.asin),
  arccos: real(Math.acos),
  arctan: real(Math.atan),
  arctg: real(Math.atan),
  ln: real(Math.log),
  lg: real(Math.log10),
  log: real(Math.log10),
};

export class ExprError extends Error {}

type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string };

const SUPER: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };

/** Typographic variants → plain ASCII operators. Decimal commas only where they can't be separators. */
export function normalize(src: string, decimalComma = true): string {
  let s = src
    .replace(/[−–—]/g, '-')
    .replace(/[·⋅×∙*]/g, '*')
    .replace(/[:÷]/g, '/')
    .replace(/π/g, 'pi')
    .replace(/°/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => `^(${[...m].map((ch) => SUPER[ch]).join('')})`);
  if (decimalComma) s = s.replace(/(\d),(\d)/g, '$1.$2');
  return s;
}

function lex(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (num) {
      out.push({ k: 'num', v: Number(num[1]) });
      i += num[1].length;
      continue;
    }
    const id = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ_]+/.exec(s.slice(i));
    if (id) {
      out.push({ k: 'id', v: id[0] });
      i += id[0].length;
      continue;
    }
    if ('+-*/^()|√!'.includes(ch)) {
      out.push({ k: 'op', v: ch });
      i++;
      continue;
    }
    throw new ExprError(`Ezt a jelet nem ismerem: „${ch}”.`);
  }
  return out;
}

type Node =
  | { t: 'n'; v: C }
  | { t: 'v'; name: string }
  | { t: 'u'; op: '-'; a: Node }
  | { t: 'b'; op: string; a: Node; b: Node }
  | { t: 'f'; name: string; a: Node }
  | { t: '!'; a: Node };

/** Split identifiers like "xy", "pix", "sqrtx", "2ki" into known pieces. */
function splitIdent(word: string, vars: string[]): string[] {
  const known = [...Object.keys(FUNCS), 'pi', 'i', ...vars].sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let w = word;
  while (w) {
    const k = known.find((x) => w.startsWith(x));
    if (!k) throw new ExprError(vars.length ? `Ismeretlen betű: „${w}”. Itt ezt használhatod: ${vars.join(', ')}.` : `Ismeretlen betű: „${w}”.`);
    parts.push(k);
    w = w.slice(k.length);
  }
  return parts;
}

function parseTokens(raw: Tok[], vars: string[]): Node {
  const toks: Tok[] = [];
  for (const t of raw) {
    if (t.k === 'id') for (const p of splitIdent(t.v, vars)) toks.push({ k: 'id', v: p });
    else toks.push(t);
  }
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.k === 'op' && peek().v === v;
  const expect = (v: string) => {
    if (!isOp(v)) throw new ExprError(v === ')' ? 'Hiányzik egy záró zárójel.' : `Itt „${v}” jelet vártam.`);
    p++;
  };
  // can the next token start a factor (for implicit multiplication like 2x, 3(…), 2√2)?
  const startsFactor = () => {
    const t = peek();
    if (!t) return false;
    if (t.k === 'num' || t.k === 'id') return true;
    return t.v === '(' || t.v === '√';
  };

  function expr(): Node {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = (toks[p++] as { v: string }).v;
      a = { t: 'b', op, a, b: term() };
    }
    return a;
  }
  function term(): Node {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = (toks[p++] as { v: string }).v;
        a = { t: 'b', op, a, b: unary() };
      } else if (startsFactor()) {
        a = { t: 'b', op: '*', a, b: power() };
      } else return a;
    }
  }
  function unary(): Node {
    if (isOp('-')) {
      p++;
      return { t: 'u', op: '-', a: unary() };
    }
    if (isOp('+')) {
      p++;
      return unary();
    }
    return power();
  }
  function power(): Node {
    let a = postfix();
    if (isOp('^')) {
      p++;
      a = { t: 'b', op: '^', a, b: unary() };
    }
    return a;
  }
  function postfix(): Node {
    let a = primary();
    while (isOp('!')) {
      p++;
      a = { t: '!', a };
    }
    return a;
  }
  function primary(): Node {
    const t = peek();
    if (!t) throw new ExprError('A kifejezés hiányos.');
    if (t.k === 'num') {
      p++;
      return { t: 'n', v: c(t.v) };
    }
    if (t.k === 'id') {
      p++;
      if (t.v === 'pi') return { t: 'n', v: c(Math.PI) };
      if (t.v === 'i') return { t: 'n', v: c(0, 1) };
      if (FUNCS[t.v]) {
        if (isOp('(')) {
          p++;
          const a = expr();
          expect(')');
          return { t: 'f', name: t.v, a };
        }
        return { t: 'f', name: t.v, a: power() };
      }
      return { t: 'v', name: t.v };
    }
    if (t.v === '(') {
      p++;
      const a = expr();
      expect(')');
      return a;
    }
    if (t.v === '|') {
      p++;
      const a = expr();
      expect('|');
      return { t: 'f', name: 'abs', a };
    }
    if (t.v === '√') {
      p++;
      return { t: 'f', name: 'sqrt', a: postfix() };
    }
    throw new ExprError(`Nem várt jel: „${t.v}”.`);
  }

  const n = expr();
  if (p < toks.length) {
    const t = toks[p];
    throw new ExprError(t.k === 'op' && t.v === ')' ? 'Eggyel több a záró zárójel.' : 'A kifejezés vége nem értelmezhető.');
  }
  return n;
}

function factorial(a: C): C {
  if (a.im !== 0 || !Number.isInteger(a.re) || a.re < 0 || a.re > 170) throw new ExprError('Faktoriális csak kis nemnegatív egészre.');
  let r = 1;
  for (let k = 2; k <= a.re; k++) r *= k;
  return c(r);
}

function run(n: Node, env: Record<string, C>): C {
  switch (n.t) {
    case 'n':
      return n.v;
    case 'v': {
      const v = env[n.name];
      if (!v) throw new ExprError(`Ismeretlen betű: „${n.name}”.`);
      return v;
    }
    case 'u':
      return sub(c(0), run(n.a, env));
    case '!':
      return factorial(run(n.a, env));
    case 'f':
      return FUNCS[n.name](run(n.a, env));
    case 'b': {
      const a = run(n.a, env);
      const b = run(n.b, env);
      if (n.op === '+') return add(a, b);
      if (n.op === '-') return sub(a, b);
      if (n.op === '*') return mul(a, b);
      if (n.op === '/') return div(a, b);
      return pow(a, b);
    }
  }
}

export interface Compiled {
  eval: (env?: Record<string, number>) => C;
}

/** Drop a leading "y =", "f(x) =", "x₀ =" so both "9x − 15" and "y = 9x − 15" work. */
export function stripLhs(s: string): string {
  const i = s.lastIndexOf('=');
  return i >= 0 ? s.slice(i + 1) : s;
}

export function compile(src: string, vars: string[] = [], decimalComma = true): Compiled {
  const s = normalize(stripLhs(src), decimalComma);
  if (!s) throw new ExprError('Üres a válasz.');
  const ast = parseTokens(lex(s), vars);
  return {
    eval: (env = {}) => run(ast, Object.fromEntries(Object.entries(env).map(([k, v]) => [k, c(v)]))),
  };
}

export const evalExpr = (src: string) => compile(src).eval();

const SAMPLES = [0.37, -1.3, 2.1, 3.7, -2.6, 1.15];

export function close(a: C, b: C, tol = 1e-6): boolean {
  const scale = Math.max(1, abs(b));
  return abs(sub(a, b)) <= tol * scale;
}

/** Are two answers equal as numbers (or as functions of `vars`, compared at a few sample points)? */
export function sameValue(given: string, want: string, opts: { vars?: string[]; tol?: number; modulo?: number } = {}): boolean {
  const vars = opts.vars ?? [];
  const g = compile(given, vars);
  const w = compile(want, vars);
  const tol = opts.tol ?? 1e-6;
  if (!vars.length) {
    const a = g.eval();
    const b = w.eval();
    if (opts.modulo) {
      if (Math.abs(a.im) > 1e-9 || !Number.isInteger(Math.round(a.re)) || Math.abs(a.re - Math.round(a.re)) > 1e-9) return false;
      const m = opts.modulo;
      return (((Math.round(a.re) - Math.round(b.re)) % m) + m) % m === 0;
    }
    return close(a, b, tol);
  }
  return SAMPLES.every((s, i) => {
    const env = Object.fromEntries(vars.map((v, j) => [v, s + 0.71 * j * (i % 2 ? -1 : 1)]));
    return close(g.eval(env), w.eval(env), tol);
  });
}

/** Split a set/list answer at top-level commas or semicolons; strips surrounding braces. */
export function splitItems(src: string): string[] {
  let s = src.trim();
  if (/^\{.*\}$/.test(s)) s = s.slice(1, -1);
  if (/^(∅|nincs|ures|üres|-)?$/i.test(s.trim())) return [];
  const sep = s.includes(';') ? ';' : ',';
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

/** One set element as a comparable key: numbers by value, anything else (a, (1, a)) as text. */
function itemKey(item: string): string {
  // tuples like (1, a) compare as text: their comma is not a decimal comma
  if (/^\(.*,.*\)$/.test(item.trim())) return `s:${item.replace(/\s+/g, '').replace(/[−–]/g, '-').toLowerCase()}`;
  try {
    const v = compile(item).eval();
    if (Math.abs(v.im) < 1e-9) return `n:${Math.round(v.re * 1e6) / 1e6}`;
    return `c:${Math.round(v.re * 1e6) / 1e6},${Math.round(v.im * 1e6) / 1e6}`;
  } catch {
    return `s:${item.replace(/\s+/g, '').replace(/[−–]/g, '-').toLowerCase()}`;
  }
}

export interface SetDiff {
  extra: string[];
  missing: number;
  ok: boolean;
}

/** Compare two sets given as text, ignoring order and repetition. */
export function compareSets(given: string, want: string): SetDiff {
  const w = new Set(splitItems(want).map(itemKey));
  const gItems = splitItems(given);
  const g = new Map(gItems.map((x) => [itemKey(x), x]));
  const extra = [...g.entries()].filter(([k]) => !w.has(k)).map(([, x]) => x);
  const missing = [...w].filter((k) => !g.has(k)).length;
  return { extra, missing, ok: !extra.length && !missing };
}

/** Is the answer a plain number with no imaginary part? */
export function isReal(src: string): boolean {
  try {
    return Math.abs(evalExpr(src).im) < 1e-9;
  } catch {
    return false;
  }
}
