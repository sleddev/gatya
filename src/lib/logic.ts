// Parser and evaluator for the formulas used in "Az informatika logikai alapjai".
//
// Precedence (strongest first), as in lecture 3:  ∀ ∃  >  ¬  >  ∧  >  ∨  >  ⊃  >  ≡
// ⊃ associates to the right (p ⊃ q ⊃ r = p ⊃ (q ⊃ r)); ∧, ∨, ≡ to the left.
//
// First-order conventions: x, y, z, v, w (optionally followed by digits) are variables,
// other lowercase identifiers are names (constants), lowercase followed by "(" is a
// function symbol, and in formula position an identifier is a predicate
// (P(x), Özvegy(peter)) or a propositional symbol (p, havazik).

export type BinOp = '∧' | '∨' | '⊃' | '≡';
export type Quant = '∀' | '∃';

export type Term = { t: 'v'; n: string; tok: number } | { t: 'c'; n: string } | { t: 'f'; n: string; args: Term[] };

/** `s`: first and last token of the formula in the parsed text (without enclosing brackets). */
export type Formula = (
  | { t: 'var'; n: string }
  | { t: 'atom'; n: string; args: Term[] }
  | { t: 'not'; a: Formula; otok?: number }
  | { t: 'bin'; op: BinOp; a: Formula; b: Formula; otok?: number }
  | { t: 'q'; q: Quant; x: string; id: number; qtok: number; vtok: number; a: Formula }
) & { s?: [number, number] };

export interface Token {
  k: 'op' | 'id';
  v: string;
  i: number;
  len: number;
}

export class ParseError extends Error {
  pos: number;
  constructor(message: string, pos: number) {
    super(message);
    this.pos = pos;
  }
}

export const isVariable = (s: string) => /^[xyzvw][0-9]*$/.test(s);

const SYMBOLS: Record<string, string> = {
  '¬': '¬',
  '~': '¬',
  '!': '¬',
  '∧': '∧',
  '&': '∧',
  '^': '∧',
  '∨': '∨',
  '|': '∨',
  '⊃': '⊃',
  '→': '⊃',
  '≡': '≡',
  '↔': '≡',
  '=': '≡',
  '∀': '∀',
  '∃': '∃',
  '(': '(',
  ')': ')',
  ',': ',',
};

export function lex(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const three = src.slice(i, i + 3);
    const two = src.slice(i, i + 2);
    if (three === '<->' || three === '<=>') {
      out.push({ k: 'op', v: '≡', i, len: 3 });
      i += 3;
      continue;
    }
    if (two === '->' || two === '=>') {
      out.push({ k: 'op', v: '⊃', i, len: 2 });
      i += 2;
      continue;
    }
    if (two === '&&' || two === '||') {
      out.push({ k: 'op', v: two === '&&' ? '∧' : '∨', i, len: 2 });
      i += 2;
      continue;
    }
    if (SYMBOLS[ch]) {
      out.push({ k: 'op', v: SYMBOLS[ch], i, len: 1 });
      i++;
      continue;
    }
    const m = /^[\p{L}_][\p{L}\p{N}_']*/u.exec(src.slice(i));
    if (m) {
      let w = m[0];
      // "∀xP(x)" as in the textbook: after a quantifier only the variable belongs to it
      const prev = out[out.length - 1];
      const v = /^[xyzvw][0-9]*/.exec(w);
      if (prev && (prev.v === '∀' || prev.v === '∃') && v && v[0].length < w.length) w = v[0];
      if (w === 'forall' || w === 'exists') out.push({ k: 'op', v: w === 'forall' ? '∀' : '∃', i, len: w.length });
      else out.push({ k: 'id', v: w, i, len: w.length });
      i += w.length;
      continue;
    }
    throw new ParseError(`Ismeretlen jel: „${ch}”`, i);
  }
  return out;
}

/** Parse a formula. `firstOrder` enables quantifiers, predicates and terms. */
export function parse(src: string, firstOrder = false): { ast: Formula; tokens: Token[] } {
  const T = lex(src);
  let p = 0;
  let qid = 0;
  const peek = () => T[p];
  const fail = (msg: string, tok?: Token): never => {
    throw new ParseError(msg, tok ? tok.i : src.length);
  };
  if (!T.length) fail('Írj be egy formulát.');

  const equiv = (): Formula => {
    let a = impl();
    while (peek()?.v === '≡') {
      const otok = p++;
      a = span({ t: 'bin', op: '≡', a, b: impl(), otok });
    }
    return a;
  };
  const impl = (): Formula => {
    const a = or();
    if (peek()?.v === '⊃') {
      const otok = p++;
      return span({ t: 'bin', op: '⊃', a, b: impl(), otok });
    }
    return a;
  };
  const or = (): Formula => {
    let a = and();
    while (peek()?.v === '∨') {
      const otok = p++;
      a = span({ t: 'bin', op: '∨', a, b: and(), otok });
    }
    return a;
  };
  const and = (): Formula => {
    let a = unary();
    while (peek()?.v === '∧') {
      const otok = p++;
      a = span({ t: 'bin', op: '∧', a, b: unary(), otok });
    }
    return a;
  };
  const args = (): Term[] => {
    p++; // (
    const list = [term()];
    while (peek()?.v === ',') {
      p++;
      list.push(term());
    }
    if (peek()?.v !== ')') fail('Hiányzik a „)” az argumentumok után.', peek());
    p++;
    return list;
  };
  const term = (): Term => {
    const k = peek();
    if (!k || k.k !== 'id') return fail('Itt egy term kellene (változó, név vagy függvény).', k);
    p++;
    if (peek()?.v === '(') return { t: 'f', n: k.v, args: args() };
    return isVariable(k.v) ? { t: 'v', n: k.v, tok: p - 1 } : { t: 'c', n: k.v };
  };
  const span = (f: Extract<Formula, { t: 'bin' }>): Formula => {
    f.s = [f.a.s![0], f.b.s![1]];
    return f;
  };
  const unary = (): Formula => {
    const start = p;
    const f = unaryInner();
    if (!f.s) f.s = [start, p - 1];
    return f;
  };
  const unaryInner = (): Formula => {
    const k = peek();
    if (!k) return fail('A formula túl korán véget ér: hiányzik valami az utolsó művelet után.');
    if (k.v === '¬') {
      const otok = p++;
      return { t: 'not', a: unary(), otok };
    }
    if (k.v === '∀' || k.v === '∃') {
      if (!firstOrder) fail('Kvantor csak elsőrendű formulában lehet. Ez az eszköz ítéletlogikai.', k);
      p++;
      const vt = peek();
      if (!vt || vt.k !== 'id' || !isVariable(vt.v)) fail('A kvantor után változó kell (x, y, z, v, w).', vt);
      p++;
      return { t: 'q', q: k.v as Quant, x: vt!.v, id: qid++, qtok: p - 2, vtok: p - 1, a: unary() };
    }
    if (k.v === '(') {
      p++;
      const f = equiv();
      if (peek()?.v !== ')') fail('Hiányzik egy záró „)”.', peek());
      p++;
      return f;
    }
    if (k.k === 'id') {
      p++;
      if (!firstOrder) return { t: 'var', n: k.v };
      if (isVariable(k.v)) fail(`„${k.v}” változó, önmagában nem formula. Tedd predikátumba, pl. P(${k.v}).`, k);
      if (peek()?.v === '(') return { t: 'atom', n: k.v, args: args() };
      return { t: 'atom', n: k.v, args: [] };
    }
    return fail(`Itt nem állhat „${k.v}”.`, k);
  };

  const ast = equiv();
  if (p < T.length) fail(`Fölösleges „${T[p].v}”. Hiányzik egy művelet vagy zárójel?`, T[p]);
  return { ast, tokens: T };
}

export const termString = (t: Term): string => (t.t === 'f' ? `${t.n}(${t.args.map(termString).join(', ')})` : t.n);

/** Fully bracketed string, exactly the official syntax. */
export function show(f: Formula): string {
  switch (f.t) {
    case 'var':
      return f.n;
    case 'atom':
      return f.n + (f.args.length ? `(${f.args.map(termString).join(', ')})` : '');
    case 'not':
      return '¬' + show(f.a);
    case 'q':
      return `${f.q}${f.x} ${show(f.a)}`;
    case 'bin':
      return `(${show(f.a)} ${f.op} ${show(f.b)})`;
  }
}

export const children = (f: Formula): Formula[] =>
  f.t === 'not' || f.t === 'q' ? [f.a] : f.t === 'bin' ? [f.a, f.b] : [];

export const nodeLabel = (f: Formula) =>
  f.t === 'bin' ? f.op : f.t === 'not' ? '¬' : f.t === 'q' ? f.q + f.x : show(f);

/** Összetettség: number of logical symbols (¬ ∧ ∨ ⊃ ≡ ∀ ∃). */
export const degree = (f: Formula): number =>
  (f.t === 'bin' || f.t === 'not' || f.t === 'q' ? 1 : 0) + children(f).reduce((s, c) => s + degree(c), 0);

export function propVars(f: Formula, set = new Set<string>()): Set<string> {
  if (f.t === 'var') set.add(f.n);
  children(f).forEach((c) => propVars(c, set));
  return set;
}

export type Valuation = Record<string, boolean>;

export function evaluate(f: Formula, v: Valuation): boolean {
  switch (f.t) {
    case 'var':
      return !!v[f.n];
    case 'not':
      return !evaluate(f.a, v);
    case 'bin': {
      const a = evaluate(f.a, v);
      const b = evaluate(f.b, v);
      if (f.op === '∧') return a && b;
      if (f.op === '∨') return a || b;
      if (f.op === '⊃') return !a || b;
      return a === b;
    }
    default:
      throw new Error('Az ítéletlogikai kiértékelés nem kezel kvantort vagy predikátumot.');
  }
}

/** Non-atomic subformulas, innermost first, without duplicates. */
export function subformulas(f: Formula, out: Formula[] = [], seen = new Set<string>()): Formula[] {
  children(f).forEach((c) => subformulas(c, out, seen));
  if (f.t !== 'var') {
    const k = show(f);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(f);
    }
  }
  return out;
}

/** All valuations of the given letters, in lecture order (000, 001, …). */
export function valuations(vars: Iterable<string>): { names: string[]; rows: Valuation[] } {
  const names = [...vars].sort();
  const rows: Valuation[] = [];
  for (let m = 0; m < 1 << names.length; m++) {
    const v: Valuation = {};
    names.forEach((n, i) => (v[n] = !!((m >> (names.length - 1 - i)) & 1)));
    rows.push(v);
  }
  return { names, rows };
}

export type Classification = 'valid' | 'contingent' | 'unsatisfiable';

export function classify(f: Formula): { kind: Classification; trueRows: number; rows: number } {
  const { rows } = valuations(propVars(f));
  const t = rows.filter((r) => evaluate(f, r)).length;
  return { kind: t === rows.length ? 'valid' : t === 0 ? 'unsatisfiable' : 'contingent', trueRows: t, rows: rows.length };
}

/** Γ ⊨ A by truth table: returns the countermodels (rows where Γ is true and A false). */
export function consequence(premises: Formula[], conclusion: Formula) {
  const vars = new Set<string>();
  premises.forEach((p) => propVars(p, vars));
  propVars(conclusion, vars);
  const { names, rows } = valuations(vars);
  const table = rows.map((r) => {
    const pv = premises.map((p) => evaluate(p, r));
    const all = pv.every(Boolean);
    const c = evaluate(conclusion, r);
    return { v: r, premises: pv, model: all, conclusion: c, counter: all && !c };
  });
  return { names, table, holds: !table.some((r) => r.counter), models: table.filter((r) => r.model).length };
}

export interface VarOccurrence {
  token: number;
  name: string;
  /** id of the binding quantifier, or null if free */
  boundBy: number | null;
}

/** Free/bound analysis of a first-order formula (lecture 2–3). */
export function analyseFirstOrder(f: Formula) {
  const occurrences: VarOccurrence[] = [];
  const quantifiers: Extract<Formula, { t: 'q' }>[] = [];
  const walkTerm = (t: Term, env: Record<string, number>) => {
    if (t.t === 'v') occurrences.push({ token: t.tok, name: t.n, boundBy: env[t.n] ?? null });
    if (t.t === 'f') t.args.forEach((a) => walkTerm(a, env));
  };
  const walk = (g: Formula, env: Record<string, number>) => {
    if (g.t === 'q') {
      quantifiers.push(g);
      walk(g.a, { ...env, [g.x]: g.id });
    } else if (g.t === 'atom') g.args.forEach((a) => walkTerm(a, env));
    else children(g).forEach((c) => walk(c, env));
  };
  walk(f, {});
  const free = [...new Set(occurrences.filter((o) => o.boundBy === null).map((o) => o.name))];
  const bound = [...new Set(occurrences.filter((o) => o.boundBy !== null).map((o) => o.name))];
  const qVars = quantifiers.map((q) => q.x);
  const doubleBound = [...new Set(qVars.filter((v, i) => qVars.indexOf(v) !== i))];
  const freeAndBound = free.filter((v) => bound.includes(v) || qVars.includes(v));
  return {
    occurrences,
    quantifiers,
    free,
    bound,
    closed: free.length === 0,
    clean: doubleBound.length === 0 && freeAndBound.length === 0,
    doubleBound,
    freeAndBound,
  };
}
