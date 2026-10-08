import { useState } from 'react';

import { euclid } from '@/lib/numbers';

import { Bench, NumField } from './ui';

const COLORS = ['var(--q1)', 'var(--q2)', 'var(--q3)', 'var(--q4)', 'var(--q5)'];

type Sq = { x: number; y: number; s: number; step: number };

/**
 * The Euclidean algorithm as cutting squares off an a × b rectangle: each step a = b·q + r cuts q squares
 * of side b and leaves a b × r rectangle. The last square size is gcd(a, b).
 */
export function EuklideszTeglalap({ a: a0 = 168, b: b0 = 64 }: { a?: number; b?: number }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [shown, setShown] = useState(0);
  const A = Math.abs(Math.trunc(a));
  const B = Math.abs(Math.trunc(b));
  const ok = A > 0 && B > 0 && A <= 100000 && B <= 100000;
  const big = Math.max(A, B);
  const small = Math.min(A, B);
  const e = ok ? euclid(big, small) : null;
  const steps = e?.steps ?? [];
  const n = Math.min(shown, steps.length);

  // Lay the squares out: the remaining rectangle is (x, y, w, h); cut along its longer side.
  const squares: Sq[] = [];
  const restAfter: { x: number; y: number; w: number; h: number }[] = [];
  let x = 0,
    y = 0,
    w = big,
    h = small;
  steps.forEach((st, i) => {
    for (let k = 0; k < st.q; k++) {
      if (w >= h) {
        squares.push({ x, y, s: h, step: i });
        x += h;
        w -= h;
      } else {
        squares.push({ x, y, s: w, step: i });
        y += w;
        h -= w;
      }
    }
    restAfter.push({ x, y, w, h });
  });
  const visible = squares.filter((s) => s.step < n);
  const rest = n > 0 ? restAfter[n - 1] : { x: 0, y: 0, w: big, h: small };

  const W = 340;
  const scale = (W - 4) / big;
  const H = Math.max(small * scale, 2) + 4;
  const tooSmall = steps.length > 0 && squares.some((s) => s.s * scale < 1.5);

  return (
    <Bench
      title="Euklideszi algoritmus téglalappal"
      hint="Egy a × b-s téglalapról levágjuk a lehető legnagyobb négyzeteket. A maradék csíkkal ugyanezt csináljuk. Az utolsó, mindent pontosan kitöltő négyzet oldala az lnko.">
      <div className="row">
        <NumField
          label="a"
          value={a}
          onChange={(v) => {
            setA(v);
            setShown(0);
          }}
          min={1}
        />
        <NumField
          label="b"
          value={b}
          onChange={(v) => {
            setB(v);
            setShown(0);
          }}
          min={1}
        />
      </div>
      {!ok || !e ? (
        <p className="err">Pozitív egészeket adj meg (legfeljebb 100 000).</p>
      ) : (
        <>
          <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${big} × ${small} téglalap négyzetekre vágva`}>
            <rect x={2} y={2} width={big * scale} height={small * scale} fill="var(--sunk)" stroke="var(--ink)" strokeWidth={1.5} />
            {visible.map((s, i) => (
              <rect
                key={i}
                x={2 + s.x * scale}
                y={2 + s.y * scale}
                width={s.s * scale}
                height={s.s * scale}
                fill={COLORS[s.step % COLORS.length]}
                fillOpacity={0.28}
                stroke={COLORS[s.step % COLORS.length]}
                strokeWidth={1.2}
              />
            ))}
            {n < steps.length ? (
              <rect
                x={2 + rest.x * scale}
                y={2 + rest.y * scale}
                width={rest.w * scale}
                height={rest.h * scale}
                fill="none"
                stroke="var(--bad)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ) : null}
            {visible.map((s, i) =>
              s.s * scale >= 26 ? (
                <text key={`t${i}`} x={2 + (s.x + s.s / 2) * scale} y={2 + (s.y + s.s / 2) * scale + 5} textAnchor="middle" className="small">
                  {s.s}
                </text>
              ) : null
            )}
          </svg>
          <div className="row">
            <button type="button" className="btn" disabled={n >= steps.length} onClick={() => setShown(n + 1)}>
              Következő lépés
            </button>
            <button type="button" className="btn" disabled={n >= steps.length} onClick={() => setShown(steps.length)}>
              Mind
            </button>
            <button type="button" className="btn" disabled={n === 0} onClick={() => setShown(0)}>
              Elölről
            </button>
          </div>
          <div className="out">
            {n === 0 ? (
              <p>
                A téglalap mérete {big} × {small}. Nyomd meg a „Következő lépés” gombot.
              </p>
            ) : null}
            {steps.slice(0, n).map((st, i) => (
              <p key={i} className="line" style={{ fontWeight: i === n - 1 ? 700 : 400 }}>
                <span style={{ color: COLORS[i % COLORS.length] }}>■</span> {st.a} = {st.b} · {st.q} + {st.r}
                <span className="note" style={{ fontFamily: 'var(--font)' }}>
                  {'  '}
                  {st.q} db {st.b} oldalú négyzet, {st.r ? `marad egy ${st.b} × ${st.r} méretű csík` : 'nem marad semmi'}
                </span>
              </p>
            ))}
            {n === steps.length && n > 0 ? (
              <p>
                Az utolsó négyzetek oldala <b>{e.g}</b>, ezek pontosan kitöltik a téglalapot. Tehát ({big}, {small}) = {e.g}: a {e.g} oldalú négyzet a legnagyobb,
                amellyel az egész téglalap hézag nélkül lefedhető.
              </p>
            ) : null}
            {tooSmall ? <p className="note">Némelyik négyzet túl kicsi ahhoz, hogy látszódjon; kisebb számokkal szebb a rajz.</p> : null}
          </div>
        </>
      )}
    </Bench>
  );
}
