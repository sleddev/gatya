// Find the main connective by tapping it in the formula. With `fa`, keep going: every tap splits the
// highlighted part into its immediate subformulas, until the whole structure tree (szerkezeti fa) is built.
import { useMemo, useState, type ReactNode } from 'react';

import { minimal } from '@/lib/course';
import { children, nodeLabel, parse, type Formula } from '@/lib/logic';

import { DoneNote, Feedback, useExercise } from './lesson';

const opToken = (f: Formula): number[] =>
  f.t === 'bin' || f.t === 'not' ? (f.otok === undefined ? [] : [f.otok]) : f.t === 'q' ? [f.qtok, f.vtok] : [];

const complex = (f: Formula) => f.t === 'bin' || f.t === 'not' || f.t === 'q';

function preorder(f: Formula, out: Formula[] = []): Formula[] {
  out.push(f);
  children(f).forEach((c) => preorder(c, out));
  return out;
}

export function FoJel({
  formula,
  elsorendu = false,
  fa = false,
  children: prompt,
  magyarazat,
}: {
  formula: string;
  elsorendu?: boolean;
  /** build the whole structure tree, not just find the main connective */
  fa?: boolean;
  children?: ReactNode;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const { ast, tokens } = useMemo(() => parse(formula, elsorendu), [formula, elsorendu]);
  const nodes = useMemo(() => preorder(ast).filter(complex), [ast]);
  const [split, setSplit] = useState<Set<Formula>>(new Set());
  const [msg, setMsg] = useState<ReactNode>(null);

  const all = ex.shown ? new Set(nodes) : split;
  const cur = nodes.find((n) => !all.has(n)) ?? null;
  const goal = fa ? nodes.length : 1;

  const tap = (ti: number) => {
    if (!cur || ex.done) return;
    if (opToken(cur).includes(ti)) {
      const next = new Set(split).add(cur);
      setSplit(next);
      setMsg(null);
      if (next.size >= goal) ex.solve();
      return;
    }
    ex.miss();
    const [s, e] = cur.s ?? [0, tokens.length - 1];
    if (ti < s || ti > e) {
      setMsg(<Feedback kind="no">Most a kiemelt részt bontjuk. Ennek a fő jelét keresd.</Feedback>);
      return;
    }
    const owner = nodes.find((n) => opToken(n).includes(ti));
    setMsg(
      <Feedback kind="no">
        Ez a jel csak a(z) <span className="line">{owner ? minimal(owner) : ''}</span> részt fogja össze. A fő jel az, amelyik az{' '}
        <b>egész</b> kiemelt részt: ami a zárójelezés után a legkülső zárójelen belül, de minden más zárójelen kívül áll.
      </Feedback>
    );
  };

  const [s, e] = cur?.s ?? [-1, -2];
  const clickable = new Set(tokens.map((t, i) => (t.k === 'op' && t.v !== '(' && t.v !== ')' && t.v !== ',' ? i : -1)).filter((i) => i >= 0));
  // variables right after a quantifier belong to it
  tokens.forEach((t, i) => i > 0 && (tokens[i - 1].v === '∀' || tokens[i - 1].v === '∃') && clickable.add(i));

  const parts: ReactNode[] = [];
  let pos = 0;
  tokens.forEach((t, i) => {
    if (t.i > pos) parts.push(<span key={`g${i}`}>{formula.slice(pos, t.i)}</span>);
    const inCur = i >= s && i <= e;
    const text = formula.slice(t.i, t.i + t.len);
    parts.push(
      clickable.has(i) && !ex.done ? (
        <button key={i} type="button" className={`tok${inCur ? ' cur' : ''}`} onClick={() => tap(i)}>
          {text}
        </button>
      ) : (
        <span key={i} className={`tok-t${inCur && cur ? ' cur' : ''}`}>
          {text}
        </span>
      )
    );
    pos = t.i + t.len;
  });

  return (
    <div className="ex">
      {prompt ? <div className="ex-q">{prompt}</div> : null}
      <div className="tokline">{parts}</div>
      {!ex.done ? (
        <p className="note">
          {fa
            ? `Koppints a kiemelt rész fő logikai jelére. (${split.size}/${nodes.length} jel kész)`
            : 'Koppints a fő logikai jelre.'}
        </p>
      ) : null}
      {fa || ex.done ? <PartialTree f={ast} split={all} /> : null}
      {!ex.done ? msg : null}
      {!ex.done && ex.wrong > 0 ? (
        <div className="row">
          <button type="button" className="btn ghost" onClick={ex.reveal}>
            Megmutatom a megoldást
          </button>
        </div>
      ) : null}
      <DoneNote ex={ex}>
        {!fa ? (
          <>
            A fő logikai jel: <b className="line">{nodeLabel(ast)}</b>.{' '}
          </>
        ) : null}
        {magyarazat}
      </DoneNote>
    </div>
  );
}

/** Structure tree where parts not split yet are drawn as boxed leaves. */
function PartialTree({ f, split }: { f: Formula; split: Set<Formula> }) {
  let leaf = 0;
  let maxDepth = 0;
  const nodes: { x: number; d: number; label: string; leaf: boolean; open: boolean }[] = [];
  const edges: [number, number, number, number][] = [];
  const lay = (g: Formula, d: number): { x: number; d: number } => {
    maxDepth = Math.max(maxDepth, d);
    const ch = split.has(g) ? children(g) : [];
    let x: number;
    if (!ch.length) x = leaf++;
    else {
      const cs = ch.map((c) => lay(c, d + 1));
      x = (cs[0].x + cs[cs.length - 1].x) / 2;
      cs.forEach((c) => edges.push([x, d, c.x, c.d]));
    }
    const open = !ch.length && complex(g);
    nodes.push({ x, d, label: ch.length ? nodeLabel(g) : minimal(g), leaf: !ch.length, open });
    return { x, d };
  };
  lay(f, 0);
  const maxL = Math.max(2, ...nodes.filter((n) => n.leaf).map((n) => n.label.length));
  const dx = Math.max(54, Math.min(maxL, 22) * 8.2 + 18);
  const dy = 58;
  const W = Math.max(1, leaf) * dx;
  const H = (maxDepth + 1) * dy + 24;
  const X = (x: number) => x * dx + dx / 2;
  const Y = (d: number) => d * dy + 22;
  return (
    <div className="treebox">
      <svg className="tree" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Szerkezeti fa">
        {edges.map(([x1, d1, x2, d2], i) => (
          <line key={i} x1={X(x1)} y1={Y(d1)} x2={X(x2)} y2={Y(d2)} />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle className={n.leaf && !n.open ? 'leaf' : n.open ? 'open' : ''} cx={X(n.x)} cy={Y(n.d)} r={n.leaf ? 4 : 5} />
            {n.leaf ? (
              <text x={X(n.x)} y={Y(n.d) + 21} textAnchor="middle" className={n.open ? 'open' : undefined}>
                {n.label}
              </text>
            ) : (
              <text x={X(n.x) + 9} y={Y(n.d) - 6}>
                {n.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
