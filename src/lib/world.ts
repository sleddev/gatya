// Evaluating first-order formulas in a small finite interpretation ⟨U, ϱ⟩, step by step:
// first the terms (which element do they name?), then the predicates, then the connectives.
// Pure, no DOM.
import { show, termString, type Formula, type Term } from './logic.ts';

export interface World {
  /** the universe, by display name */
  U: string[];
  /** ϱ(name) = index into U */
  names: Record<string, number>;
  /** one-argument function symbols: ϱ(f)(i) = funcs[f][i] */
  funcs: Record<string, number[]>;
  /** predicates: arity and which tuples are in ϱ(P); `say` explains one tuple in Hungarian */
  preds: Record<string, { arity: number; holds: (args: number[]) => boolean; say?: (args: number[], yes: boolean) => string }>;
  /** propositional symbols (P⁽⁰⁾) */
  props: Record<string, boolean>;
}

export interface EvalStep {
  expr: string;
  value: string;
  why?: string;
}

export class EvalError extends Error {}

const b = (x: boolean) => (x ? '1' : '0');

export function evaluateIn(f: Formula, w: World): { value: boolean; steps: EvalStep[] } {
  const steps: EvalStep[] = [];
  const known = () =>
    [...Object.keys(w.names), ...Object.keys(w.funcs).map((f) => `${f}(·)`), ...Object.keys(w.preds).map((p) => `${p}(…)`), ...Object.keys(w.props)].join(', ');

  const term = (t: Term, env: Record<string, number>, rec: boolean): number => {
    if (t.t === 'v') {
      if (!(t.n in env))
        throw new EvalError(`„${t.n}” szabad változó: a formula nyitott, ezért nincs igazságértéke, amíg ${t.n}-nek nem adunk értéket.`);
      return env[t.n];
    }
    if (t.t === 'c') {
      if (!(t.n in w.names)) throw new EvalError(`Ismeretlen név: „${t.n}”. Ismert jelek: ${known()}.`);
      return w.names[t.n];
    }
    const fn = w.funcs[t.n];
    if (!fn) throw new EvalError(`Ismeretlen függvényjel: „${t.n}”. Ismert jelek: ${known()}.`);
    if (t.args.length !== 1) throw new EvalError(`${t.n} egyargumentumú függvényjel.`);
    const a = term(t.args[0], env, rec);
    const v = fn[a];
    if (rec) steps.push({ expr: termString(t), value: w.U[v], why: `ϱ(${t.n}): ${w.U[a]} ↦ ${w.U[v]}` });
    return v;
  };

  const formula = (g: Formula, env: Record<string, number>, rec: boolean): boolean => {
    switch (g.t) {
      case 'var':
      case 'atom': {
        const args = g.t === 'atom' ? g.args : [];
        if (!args.length && g.n in w.props) {
          const v = w.props[g.n];
          if (rec) steps.push({ expr: g.n, value: b(v), why: `ϱ(${g.n}) = ${b(v)}` });
          return v;
        }
        const p = w.preds[g.n];
        if (!p) {
          if (g.n in w.names || g.n in w.funcs)
            throw new EvalError(`„${g.n}” név vagy függvényjel: valakit megnevez, nem állít semmit. Formula helyén predikátum kell.`);
          throw new EvalError(`Ismeretlen predikátum: „${g.n}”. Ismert jelek: ${known()}.`);
        }
        if (p.arity !== args.length) throw new EvalError(`${g.n} ${p.arity} argumentumú predikátum, itt ${args.length} argumentuma van.`);
        const vals = args.map((a) => term(a, env, rec));
        const v = p.holds(vals);
        if (rec) {
          const tuple = vals.length === 1 ? w.U[vals[0]] : `(${vals.map((i) => w.U[i]).join(', ')})`;
          steps.push({
            expr: show(g),
            value: b(v),
            why: p.say ? p.say(vals, v) : `${tuple} ${v ? '∈' : '∉'} ϱ(${g.n})`,
          });
        }
        return v;
      }
      case 'not': {
        const a = formula(g.a, env, rec);
        if (rec) steps.push({ expr: show(g), value: b(!a), why: `¬${b(a)} = ${b(!a)}` });
        return !a;
      }
      case 'bin': {
        const a = formula(g.a, env, rec);
        const c = formula(g.b, env, rec);
        const v = g.op === '∧' ? a && c : g.op === '∨' ? a || c : g.op === '⊃' ? !a || c : a === c;
        if (rec) steps.push({ expr: show(g), value: b(v), why: `${b(a)} ${g.op} ${b(c)} = ${b(v)}` });
        return v;
      }
      case 'q': {
        const results = w.U.map((_, u) => formula(g.a, { ...env, [g.x]: u }, false));
        const v = g.q === '∀' ? results.every(Boolean) : results.some(Boolean);
        if (rec) {
          const list = results.map((r, u) => `${g.x} = ${w.U[u]}: ${b(r)}`).join(', ');
          const witness = g.q === '∀' ? results.findIndex((r) => !r) : results.findIndex((r) => r);
          const tail =
            g.q === '∀'
              ? v
                ? 'mindegyikre igaz'
                : `nem mindegyikre igaz, például ${w.U[witness]}-ra nem`
              : v
                ? `van, amelyre igaz (például ${w.U[witness]})`
                : 'egyikre sem igaz';
          steps.push({ expr: show(g), value: b(v), why: `${list} → ${tail}` });
        }
        return v;
      }
    }
  };

  const value = formula(f, {}, true);
  return { value, steps };
}
