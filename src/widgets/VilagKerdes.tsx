// A small first-order interpretation ⟨U, ϱ⟩ drawn as a picture (binary relations as arrows), and
// closed formulas to decide: igaz or hamis? After answering, the evaluation is explained step by step.
import { useMemo, useState, type ReactNode } from 'react';

import { minimal } from '@/lib/course';
import { parse } from '@/lib/logic';
import { evaluateIn, type World } from '@/lib/world';

import { DoneNote, Feedback, useExercise } from './lesson';

type Rel = Record<string, (string | [string, string])[]>;

const PRESETS: Record<string, { U: string[]; rel: Rel; nevek?: Record<string, string> }> = {
  // feladatsor 5.P.5: U = {1,2,3,4}, R(u,v) ⇔ u osztja v-t
  oszto: {
    U: ['1', '2', '3', '4'],
    rel: {
      R: [
        ['1', '1'], ['1', '2'], ['1', '3'], ['1', '4'],
        ['2', '2'], ['2', '4'],
        ['3', '3'],
        ['4', '4'],
      ],
    },
  },
};

function buildWorld(U: string[], rel: Rel, nevek: Record<string, string>, fv: Record<string, Record<string, string>>): World {
  const ix = (s: string) => U.indexOf(s);
  const preds: World['preds'] = {};
  for (const [p, list] of Object.entries(rel)) {
    const arity = list.length && Array.isArray(list[0]) ? 2 : 1;
    const keys = new Set(list.map((e) => (Array.isArray(e) ? `${ix(e[0])},${ix(e[1])}` : String(ix(e)))));
    preds[p] = { arity, holds: (args) => keys.has(args.join(',')) };
  }
  const names = Object.fromEntries(Object.entries(nevek).map(([k, v]) => [k, ix(v)]));
  const funcs = Object.fromEntries(Object.entries(fv).map(([f, m]) => [f, U.map((u) => ix(m[u] ?? u))]));
  return { U, names, funcs, preds, props: {} };
}

export function VilagKerdes({
  vilag,
  U: U0,
  rel: rel0,
  nevek: nevek0,
  fv = {},
  formulak,
  children,
  magyarazat,
  abra = true,
}: {
  vilag?: keyof typeof PRESETS;
  U?: string[];
  /** unary predicate: list of elements; binary: list of [from, to] pairs */
  rel?: Rel;
  nevek?: Record<string, string>;
  fv?: Record<string, Record<string, string>>;
  formulak: string[];
  children?: ReactNode;
  magyarazat?: ReactNode;
  abra?: boolean;
}) {
  const preset = vilag ? PRESETS[vilag] : undefined;
  const U = U0 ?? preset?.U ?? [];
  const rel = rel0 ?? preset?.rel ?? {};
  const nevek = nevek0 ?? preset?.nevek ?? {};
  const world = useMemo(() => buildWorld(U, rel, nevek, fv), [U, rel, nevek, fv]);
  const items = useMemo(
    () =>
      formulak.map((src) => {
        const f = parse(src, true).ast;
        return { f, ...evaluateIn(f, world) };
      }),
    [formulak, world]
  );
  const ex = useExercise();
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => formulak.map(() => null));
  const [open, setOpen] = useState<number | null>(null);

  const answer = (i: number, v: boolean) => {
    if (ex.done || answers[i] === items[i].value) return;
    const next = answers.map((a, j) => (j === i ? v : a));
    setAnswers(next);
    if (v !== items[i].value) {
      ex.miss();
      setOpen(i);
    } else if (next.every((a, j) => a === items[j].value)) ex.solve();
  };

  const binary = Object.entries(rel).filter(([, l]) => l.length && Array.isArray(l[0]));
  const unary = Object.entries(rel).filter(([, l]) => !l.length || !Array.isArray(l[0]));

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <div className="world">
        <div className="world-legend">
          <div>
            <b>U</b> = {'{'}
            {U.join(', ')}
            {'}'}
          </div>
          {Object.entries(nevek).map(([k, v]) => (
            <div key={k}>
              ϱ({k}) = {v}
            </div>
          ))}
          {unary.map(([p, l]) => (
            <div key={p}>
              ϱ({p}) = {'{'}
              {(l as string[]).join(', ')}
              {'}'}
            </div>
          ))}
          {Object.entries(fv).map(([f, m]) => (
            <div key={f}>
              ϱ({f}): {Object.entries(m).map(([a, b]) => `${a}↦${b}`).join(', ')}
            </div>
          ))}
          {binary.map(([p]) => (
            <div key={p}>
              {p}(u, v): nyíl u-ból v-be
            </div>
          ))}
        </div>
        {abra && binary.length ? <RelationGraph U={U} pairs={binary[0][1] as [string, string][]} unary={unary[0]?.[1] as string[] | undefined} /> : null}
      </div>
      <ol className="wq">
        {items.map((it, i) => {
          const a = answers[i];
          const right = a === it.value;
          return (
            <li key={i}>
              <div className="wq-row">
                <span className="line">{minimal(it.f)}</span>
                <span className="row">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      className={`btn small${(ex.shown ? it.value : a) === v ? (ex.shown || right ? ' right' : ' wrong') : ''}`}
                      onClick={() => answer(i, v)}>
                      {v ? 'igaz' : 'hamis'}
                    </button>
                  ))}
                  {a !== null || ex.shown ? (
                    <button type="button" className="btn ghost small" onClick={() => setOpen(open === i ? null : i)}>
                      {open === i ? 'elrejt' : 'miért?'}
                    </button>
                  ) : null}
                </span>
              </div>
              {a !== null && !right && !ex.shown ? <Feedback kind="no">Nem. Nézd meg a lépéseket, aztán válassz újra.</Feedback> : null}
              {open === i ? (
                <ol className="eval-steps">
                  {it.steps.map((s, k) => (
                    <li key={k}>
                      <span className="line">{s.expr}</span> = <b>{s.value}</b>
                      {s.why ? <span className="note"> · {s.why}</span> : null}
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
      {!ex.done && ex.wrong > 0 ? (
        <div className="row">
          <button type="button" className="btn ghost" onClick={ex.reveal}>
            Megmutatom a megoldást
          </button>
        </div>
      ) : null}
      <DoneNote ex={ex}>{magyarazat}</DoneNote>
    </div>
  );
}

/** Elements on a circle, a binary relation as arrows; members of a unary predicate are filled. */
function RelationGraph({ U, pairs, unary }: { U: string[]; pairs: [string, string][]; unary?: string[] }) {
  const n = U.length;
  const R = n <= 2 ? 50 : 70;
  const C = 105;
  const pos = U.map((_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [C + R * Math.cos(a), C + R * Math.sin(a)] as const;
  });
  const r = 15;
  return (
    <svg className="rel" viewBox="0 0 210 210" width="210" height="210" role="img" aria-label="A reláció nyíldiagramja">
      <defs>
        <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
        </marker>
      </defs>
      {pairs.map(([a, b], k) => {
        const i = U.indexOf(a);
        const j = U.indexOf(b);
        const [x1, y1] = pos[i];
        if (i === j) {
          // self-loop, pointing away from the centre
          const ang = Math.atan2(y1 - C, x1 - C);
          const cx = x1 + Math.cos(ang) * (r + 9);
          const cy = y1 + Math.sin(ang) * (r + 9);
          return <circle key={k} cx={cx} cy={cy} r={10} className="loop" />;
        }
        const [x2, y2] = pos[j];
        const d = Math.hypot(x2 - x1, y2 - y1);
        const ux = (x2 - x1) / d;
        const uy = (y2 - y1) / d;
        // bend a little so that u→v and v→u don't overlap
        const mx = (x1 + x2) / 2 - uy * 10;
        const my = (y1 + y2) / 2 + ux * 10;
        return (
          <path
            key={k}
            d={`M${x1 + ux * r},${y1 + uy * r} Q${mx},${my} ${x2 - ux * (r + 2)},${y2 - uy * (r + 2)}`}
            className="edge"
            markerEnd="url(#arw)"
          />
        );
      })}
      {U.map((u, i) => (
        <g key={u}>
          <circle cx={pos[i][0]} cy={pos[i][1]} r={r} className={`node${unary?.includes(u) ? ' in' : ''}`} />
          <text x={pos[i][0]} y={pos[i][1] + 4} textAnchor="middle">
            {u}
          </text>
        </g>
      ))}
    </svg>
  );
}
