// Term or formula? Types every node of a first-order expression against a signature
// (which symbols are names, function symbols and predicates), as in lecture 2. Pure, no DOM.
import { isVariable, parse, type Formula, type Term } from './logic.ts';

export interface Signature {
  /** names (0-ary function symbols) */
  nevek: string[];
  /** function symbol → number of arguments */
  fuggvenyek: Record<string, number>;
  /** predicate → number of arguments (0 = propositional symbol, állításjel) */
  predikatumok: Record<string, number>;
}

export type Kind = 'formula' | 'term' | 'hiba';

export interface TypedNode {
  label: string;
  kind: Kind;
  role: string;
  msg?: string;
  children: TypedNode[];
}

type Sym = { k: 'nev' } | { k: 'fv'; n: number } | { k: 'pred'; n: number } | { k: 'valtozo' } | { k: '?' };

function lookup(sig: Signature, s: string): Sym {
  if (isVariable(s)) return { k: 'valtozo' };
  if (sig.nevek.includes(s)) return { k: 'nev' };
  if (s in sig.fuggvenyek) return { k: 'fv', n: sig.fuggvenyek[s] };
  if (s in sig.predikatumok) return { k: 'pred', n: sig.predikatumok[s] };
  return { k: '?' };
}

const arityMsg = (s: string, want: number, got: number, what: string) =>
  want === got ? undefined : `${s} ${want} argumentumú ${what}, itt ${got} argumentuma van.`;

/** A term position: function applications, names, variables. */
function termNode(sig: Signature, t: Term): TypedNode {
  const sym = lookup(sig, t.n);
  const kids = t.t === 'f' ? t.args.map((a) => termNode(sig, a)) : [];
  const n = kids.length;
  if (sym.k === 'pred') {
    const what = sym.n === 0 ? 'állításjel' : 'predikátum';
    return {
      label: t.n,
      kind: 'hiba',
      role: what,
      msg: `${t.n} ${what}, tehát ${n ? `${t.n}(…)` : t.n} formula (állít valamit). Argumentumba csak term (megnevezés) kerülhet.`,
      children: kids,
    };
  }
  if (t.t === 'v') return { label: t.n, kind: 'term', role: 'változó', children: [] };
  if (sym.k === 'fv') {
    const msg = arityMsg(t.n, sym.n, n, 'függvényjel');
    return { label: t.n, kind: msg ? 'hiba' : 'term', role: n ? 'függvényjel' : 'függvényjel argumentum nélkül', msg, children: kids };
  }
  if (sym.k === 'nev') {
    const msg = n ? `${t.n} név, nem lehetnek argumentumai.` : undefined;
    return { label: t.n, kind: msg ? 'hiba' : 'term', role: 'név', msg, children: kids };
  }
  return { label: t.n, kind: 'term', role: n ? 'függvényjel?' : 'név?', children: kids };
}

/** A formula position. `root` lets a lone term stand on its own (then the whole input is a term). */
function formulaNode(sig: Signature, f: Formula, root: boolean): TypedNode {
  switch (f.t) {
    case 'bin':
      return { label: f.op, kind: 'formula', role: 'kötőszó', children: [formulaNode(sig, f.a, false), formulaNode(sig, f.b, false)] };
    case 'not':
      return { label: '¬', kind: 'formula', role: 'tagadás', children: [formulaNode(sig, f.a, false)] };
    case 'q':
      return { label: f.q + f.x, kind: 'formula', role: 'kvantor', children: [formulaNode(sig, f.a, false)] };
    case 'var':
      return { label: f.n, kind: 'formula', role: 'állításjel', children: [] };
    case 'atom': {
      const sym = lookup(sig, f.n);
      if (sym.k === 'fv' || sym.k === 'nev') {
        const t = termNode(sig, f.args.length ? { t: 'f', n: f.n, args: f.args } : { t: 'c', n: f.n });
        if (root) return t;
        return {
          ...t,
          kind: 'hiba',
          msg:
            t.msg ??
            `${f.args.length ? `${f.n}(…)` : f.n} term: megnevez valamit, nem állít semmit. Logikai jel mellé és kvantor után formula kell.`,
        };
      }
      const kids = f.args.map((a) => termNode(sig, a));
      if (sym.k === 'pred') {
        const what = sym.n === 0 ? 'állításjel' : 'predikátum';
        const msg = arityMsg(f.n, sym.n, kids.length, what);
        return { label: f.n, kind: msg ? 'hiba' : 'formula', role: what, msg, children: kids };
      }
      return { label: f.n, kind: 'formula', role: kids.length ? 'predikátum?' : 'állításjel?', children: kids };
    }
  }
}

export type TypeResult = { ok: true; tree: TypedNode; kind: Kind; errors: string[] } | { ok: false; error: unknown };

export function typeExpression(src: string, sig: Signature): TypeResult {
  const v = src.trim();
  if (isVariable(v)) return { ok: true, tree: { label: v, kind: 'term', role: 'változó', children: [] }, kind: 'term', errors: [] };
  try {
    const { ast } = parse(src, true);
    const tree = formulaNode(sig, ast, true);
    const errors: string[] = [];
    const walk = (n: TypedNode) => {
      if (n.msg) errors.push(n.msg);
      n.children.forEach(walk);
    };
    walk(tree);
    return { ok: true, tree, kind: errors.length ? 'hiba' : tree.kind, errors };
  } catch (error) {
    return { ok: false, error };
  }
}
