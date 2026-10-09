// Checking answers in the "Logika a nulláról" lessons: shapes, brackets, normal forms,
// equivalence (truth table for propositional formulas, random small models for first-order ones)
// and a random formula generator for the practice drills. Pure, no DOM.
import { children, evaluate, lex, propVars, show, termString, valuations, type BinOp, type Formula, type Term, type Valuation } from './logic.ts';

const RANK: Record<BinOp, number> = { '∧': 1, '∨': 2, '⊃': 3, '≡': 4 };

/** Members of an ∧- or ∨-chain: (a ∧ b) ∧ c and a ∧ (b ∧ c) both give [a, b, c]. */
export function chain(f: Formula, op: BinOp): Formula[] {
  return f.t === 'bin' && f.op === op ? [...chain(f.a, op), ...chain(f.b, op)] : [f];
}

/**
 * Structure as a string, with ∧ and ∨ chains flattened. Two formulas with the same shape differ at
 * most in how a chain like p ∨ q ∨ r is grouped, which the course treats as unimportant.
 */
export function shape(f: Formula): string {
  switch (f.t) {
    case 'var':
      return f.n;
    case 'atom':
      return f.n + (f.args.length ? `(${f.args.map(termString).join(',')})` : '');
    case 'not':
      return `¬${shape(f.a)}`;
    case 'q':
      return `${f.q}${f.x}[${shape(f.a)}]`;
    case 'bin':
      if (f.op === '∧' || f.op === '∨') return `${f.op}[${chain(f, f.op).map(shape).join(';')}]`;
      return `${f.op}[${shape(f.a)};${shape(f.b)}]`;
  }
}

/** Grouping brackets in the typed text (not the ones around predicate or function arguments). */
export function groupingParens(src: string): number {
  const T = lex(src);
  return T.filter((t, i) => t.v === '(' && t.k === 'op' && !(i > 0 && T[i - 1].k === 'id')).length;
}

/** Does `child` need brackets under `parent`? ∧/∨ chains don't, ⊃ groups to the right, ≡ always keeps them. */
function needs(child: Formula, parent: Formula, side: 'a' | 'b'): boolean {
  if (child.t !== 'bin') return false;
  if (parent.t === 'not' || parent.t === 'q') return true;
  if (parent.t !== 'bin') return false;
  const rc = RANK[child.op];
  const rp = RANK[parent.op];
  if (rc !== rp) return rc > rp;
  if (child.op === '∧' || child.op === '∨') return false;
  if (child.op === '⊃') return side === 'a';
  return true;
}

/** The formula with as few brackets as possible. */
export function minimal(f: Formula): string {
  const wrap = (g: Formula, side: 'a' | 'b') => (needs(g, f, side) ? `(${minimal(g)})` : minimal(g));
  switch (f.t) {
    case 'var':
    case 'atom':
      return show(f);
    case 'not':
      return `¬${wrap(f.a, 'a')}`;
    case 'q':
      return `${f.q}${f.x} ${wrap(f.a, 'a')}`;
    case 'bin':
      return `${wrap(f.a, 'a')} ${f.op} ${wrap(f.b, 'b')}`;
  }
}

export function minimalParens(f: Formula): number {
  const own = (g: Formula, side: 'a' | 'b') => (needs(g, f, side) ? 1 : 0);
  if (f.t === 'not' || f.t === 'q') return own(f.a, 'a') + minimalParens(f.a);
  if (f.t === 'bin') return own(f.a, 'a') + own(f.b, 'b') + minimalParens(f.a) + minimalParens(f.b);
  return 0;
}

/** Number of binary connectives: a fully bracketed formula has exactly this many bracket pairs. */
export const binCount = (f: Formula): number => (f.t === 'bin' ? 1 : 0) + children(f).reduce((s, c) => s + binCount(c), 0);

/** Subformulas (with repetition removed), outermost first, as fully bracketed strings. */
export function allSubformulas(f: Formula, out: string[] = []): string[] {
  const k = show(f);
  if (!out.includes(k)) out.push(k);
  children(f).forEach((c) => allSubformulas(c, out));
  return out;
}

// ---------- normal forms ----------

export const isLiteral = (f: Formula) => f.t === 'var' || f.t === 'atom' || (f.t === 'not' && (f.a.t === 'var' || f.a.t === 'atom'));

/** Conjunction of disjunctions of literals (KNF) or the other way round (DNF). */
export function isNormalForm(f: Formula, kind: 'knf' | 'dnf'): boolean {
  const [outer, inner]: BinOp[] = kind === 'knf' ? ['∧', '∨'] : ['∨', '∧'];
  return chain(f, outer).every((c) => chain(c, inner).every(isLiteral));
}

/** Why a formula is not in the requested normal form, in Hungarian (or null if it is). */
export function normalFormProblem(f: Formula, kind: 'knf' | 'dnf'): string | null {
  const [outer, inner]: BinOp[] = kind === 'knf' ? ['∧', '∨'] : ['∨', '∧'];
  for (const c of chain(f, outer))
    for (const l of chain(c, inner)) {
      if (isLiteral(l)) continue;
      if (l.t === 'bin' && (l.op === '⊃' || l.op === '≡')) return `Még van benne ${l.op}: ${minimal(l)}. Fejezd ki ¬, ∧, ∨ segítségével.`;
      if (l.t === 'not') return `A tagadás még nem atomon áll: ${minimal(l)}. Vidd be De Morgannal vagy kettős tagadással.`;
      if (l.t === 'bin') return `Itt a ${l.op} rossz szinten van: ${minimal(l)}. ${kind === 'knf' ? 'KNF-ben ∧ nem lehet ∨ alatt' : 'DNF-ben ∨ nem lehet ∧ alatt'}, használj disztributivitást.`;
    }
  return null;
}

export function isPrenex(f: Formula): boolean {
  let g = f;
  while (g.t === 'q') g = g.a;
  const quantifierFree = (h: Formula): boolean => h.t !== 'q' && children(h).every(quantifierFree);
  return quantifierFree(g);
}

/** A disjunction containing some literal and its negation: obviously valid (A ∨ ¬A ∨ …). */
export function obviouslyValid(f: Formula): boolean {
  const parts = chain(f, '∨').map(show);
  return parts.some((p) => parts.includes(`¬${p}`));
}

// ---------- propositional equivalence ----------

/** A valuation where the two formulas differ, or null if they are equivalent. */
export function propDifference(a: Formula, b: Formula): Valuation | null {
  const vars = propVars(a);
  propVars(b, vars);
  for (const row of valuations(vars).rows) if (evaluate(a, row) !== evaluate(b, row)) return row;
  return null;
}

// ---------- first-order: signatures and random models ----------

export interface Signature {
  preds: Map<string, number>;
  funcs: Map<string, number>;
  consts: Set<string>;
  free: Set<string>;
}

export function signature(f: Formula, sig: Signature = { preds: new Map(), funcs: new Map(), consts: new Set(), free: new Set() }, bound: string[] = []) {
  const term = (t: Term) => {
    if (t.t === 'v') {
      if (!bound.includes(t.n)) sig.free.add(t.n);
    } else if (t.t === 'c') sig.consts.add(t.n);
    else {
      sig.funcs.set(t.n, t.args.length);
      t.args.forEach(term);
    }
  };
  if (f.t === 'atom') {
    sig.preds.set(f.n, f.args.length);
    f.args.forEach(term);
  } else if (f.t === 'var') sig.preds.set(f.n, 0);
  else if (f.t === 'q') signature(f.a, sig, [...bound, f.x]);
  else children(f).forEach((c) => signature(c, sig, bound));
  return sig;
}

export interface Model {
  n: number;
  preds: Record<string, Set<string>>;
  funcs: Record<string, Record<string, number>>;
  consts: Record<string, number>;
  env: Record<string, number>;
}

export function holds(f: Formula, m: Model, env: Record<string, number> = m.env): boolean {
  const term = (t: Term): number => {
    if (t.t === 'v') return env[t.n] ?? 0;
    if (t.t === 'c') return m.consts[t.n] ?? 0;
    return m.funcs[t.n]?.[t.args.map(term).join(',')] ?? 0;
  };
  switch (f.t) {
    case 'var':
      return m.preds[f.n]?.has('') ?? false;
    case 'atom':
      return m.preds[f.n]?.has(f.args.map(term).join(',')) ?? false;
    case 'not':
      return !holds(f.a, m, env);
    case 'bin': {
      const a = holds(f.a, m, env);
      const b = holds(f.b, m, env);
      return f.op === '∧' ? a && b : f.op === '∨' ? a || b : f.op === '⊃' ? !a || b : a === b;
    }
    case 'q': {
      for (let u = 0; u < m.n; u++) {
        const v = holds(f.a, m, { ...env, [f.x]: u });
        if (f.q === '∀' && !v) return false;
        if (f.q === '∃' && v) return true;
      }
      return f.q === '∀';
    }
  }
}

/** Deterministic pseudo-random numbers (mulberry32), so checks give the same verdict every time. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tuples(n: number, k: number): number[][] {
  if (k === 0) return [[]];
  return tuples(n, k - 1).flatMap((t) => Array.from({ length: n }, (_, i) => [...t, i]));
}

function randomModel(sig: Signature, n: number, r: () => number): Model {
  const m: Model = { n, preds: {}, funcs: {}, consts: {}, env: {} };
  const density = 0.2 + r() * 0.6;
  for (const [p, k] of sig.preds) m.preds[p] = new Set(tuples(n, k).filter(() => r() < density).map((t) => t.join(',')));
  for (const [f, k] of sig.funcs) {
    m.funcs[f] = {};
    for (const t of tuples(n, k)) m.funcs[f][t.join(',')] = Math.floor(r() * n);
  }
  for (const c of sig.consts) m.consts[c] = Math.floor(r() * n);
  for (const x of sig.free) m.env[x] = Math.floor(r() * n);
  return m;
}

export function mergeSignatures(a: Signature, b: Signature): Signature {
  return {
    preds: new Map([...a.preds, ...b.preds]),
    funcs: new Map([...a.funcs, ...b.funcs]),
    consts: new Set([...a.consts, ...b.consts]),
    free: new Set([...a.free, ...b.free]),
  };
}

/**
 * Looks for a small interpretation where the two first-order formulas get different truth values.
 * Not a proof of equivalence, but with a few thousand models of size 1–4 the formalizations
 * students write are told apart reliably.
 */
export function foDifference(a: Formula, b: Formula, tries = 2500): Model | null {
  const sig = mergeSignatures(signature(a), signature(b));
  const r = rng(12345);
  for (let i = 0; i < tries; i++) {
    const n = 1 + (i % 4);
    const m = randomModel(sig, n, r);
    if (holds(a, m) !== holds(b, m)) return m;
  }
  return null;
}

/** A model described in a few Hungarian lines, for feedback. */
export function describeModel(m: Model, sig: Signature): string[] {
  const U = Array.from({ length: m.n }, (_, i) => String(i + 1));
  const lines = [`U = {${U.join(', ')}}`];
  for (const c of sig.consts) lines.push(`${c} = ${U[m.consts[c]]}`);
  for (const [p, k] of sig.preds) {
    const set = [...m.preds[p]];
    if (k === 0) lines.push(`${p}: ${set.length ? 'igaz' : 'hamis'}`);
    else
      lines.push(
        `${p} = {${set
          .map((t) => t.split(',').map((i) => U[Number(i)]))
          .map((t) => (t.length === 1 ? t[0] : `(${t.join(', ')})`))
          .join(', ')}}`
      );
  }
  for (const [f] of sig.funcs) lines.push(`${f}: ${Object.entries(m.funcs[f]).map(([k, v]) => `${k.split(',').map((i) => U[Number(i)]).join(',')}↦${U[v]}`).join(', ')}`);
  for (const x of sig.free) lines.push(`${x} = ${U[m.env[x]]}`);
  return lines;
}

// ---------- random formulas for the drills ----------

export function randomFormula(r: () => number, letters: string[], size: number): Formula {
  if (size <= 1) {
    const v: Formula = { t: 'var', n: letters[Math.floor(r() * letters.length)] };
    return r() < 0.25 ? { t: 'not', a: v } : v;
  }
  if (r() < 0.15) return { t: 'not', a: randomFormula(r, letters, size - 1) };
  const ops: BinOp[] = ['∧', '∨', '⊃', '⊃', '≡'];
  const op = ops[Math.floor(r() * ops.length)];
  const left = 1 + Math.floor(r() * (size - 1));
  return { t: 'bin', op, a: randomFormula(r, letters, left), b: randomFormula(r, letters, size - left) };
}

// ---------- normal form conversion, step by step ----------

const not = (a: Formula): Formula => ({ t: 'not', a });
const bin = (op: BinOp, a: Formula, b: Formula): Formula => ({ t: 'bin', op, a, b });

/** ⊃ and ≡ expressed with ¬, ∧, ∨. */
export function eliminateArrows(f: Formula): Formula {
  switch (f.t) {
    case 'not':
      return not(eliminateArrows(f.a));
    case 'q':
      return { ...f, a: eliminateArrows(f.a) };
    case 'bin': {
      const a = eliminateArrows(f.a);
      const b = eliminateArrows(f.b);
      if (f.op === '⊃') return bin('∨', not(a), b);
      if (f.op === '≡') return bin('∧', bin('∨', not(a), b), bin('∨', not(b), a));
      return bin(f.op, a, b);
    }
    default:
      return f;
  }
}

/** Negations pushed down to the atoms (De Morgan, double negation). Expects no ⊃ or ≡. */
export function pushNegations(f: Formula): Formula {
  if (f.t === 'bin') return bin(f.op, pushNegations(f.a), pushNegations(f.b));
  if (f.t !== 'not') return f;
  const a = f.a;
  if (a.t === 'not') return pushNegations(a.a);
  if (a.t === 'bin' && (a.op === '∧' || a.op === '∨')) return bin(a.op === '∧' ? '∨' : '∧', pushNegations(not(a.a)), pushNegations(not(a.b)));
  return f;
}

/** Distribute until the formula is in KNF (`outer` = ∧) or DNF (`outer` = ∨). Expects negation normal form. */
export function distribute(f: Formula, outer: '∧' | '∨'): Formula {
  const inner = outer === '∧' ? '∨' : '∧';
  if (f.t !== 'bin') return f;
  const a = distribute(f.a, outer);
  const b = distribute(f.b, outer);
  if (f.op === outer) return bin(outer, a, b);
  // f.op === inner: A inner (B outer C) → (A inner B) outer (A inner C)
  if (b.t === 'bin' && b.op === outer) return bin(outer, distribute(bin(inner, a, b.a), outer), distribute(bin(inner, a, b.b), outer));
  if (a.t === 'bin' && a.op === outer) return bin(outer, distribute(bin(inner, a.a, b), outer), distribute(bin(inner, a.b, b), outer));
  return bin(inner, a, b);
}

export function normalFormSteps(f: Formula, kind: 'knf' | 'dnf'): { law: string; f: Formula }[] {
  const steps: { law: string; f: Formula }[] = [];
  const push = (law: string, g: Formula) => {
    if (show(g) !== show(steps.length ? steps[steps.length - 1].f : f)) steps.push({ law, f: g });
  };
  const a = eliminateArrows(f);
  push('⊃ és ≡ kifejezése: A ⊃ B ⇔ ¬A ∨ B', a);
  const b = pushNegations(a);
  push('tagadások bevitele: De Morgan, kettős tagadás', b);
  const c = distribute(b, kind === 'knf' ? '∧' : '∨');
  push('disztributivitás', c);
  return steps;
}

/** Shape with ∧/∨ chain members sorted: equal up to associativity and commutativity. */
export function looseShape(f: Formula): string {
  switch (f.t) {
    case 'not':
      return `¬${looseShape(f.a)}`;
    case 'q':
      return `${f.q}${f.x}[${looseShape(f.a)}]`;
    case 'bin':
      if (f.op === '∧' || f.op === '∨') return `${f.op}[${chain(f, f.op).map(looseShape).sort().join(';')}]`;
      return `${f.op}[${looseShape(f.a)};${looseShape(f.b)}]`;
    default:
      return shape(f);
  }
}
