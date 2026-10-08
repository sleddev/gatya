import { useState } from 'react';

import { divRem, sgn } from '@/lib/numbers';

import { Bench, NumField } from './ui';

/** a = b·q + r on a number line: q jumps of length |b| from 0, then the remainder r ≥ 0. */
export function MaradekosOsztas({ a: a0 = 17, b: b0 = 5 }: { a?: number; b?: number }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const A = Math.trunc(a);
  const B = Math.trunc(b);
  const ok = B !== 0 && Math.abs(A) <= 1e6 && Math.abs(B) <= 1e6;
  const { q, r } = ok ? divRem(A, B) : { q: 0, r: 0 };
  const jumps = Math.abs(q);
  const step = Math.abs(B);
  const qb = B * q;
  // the tempting but wrong split with a negative remainder
  const alt = q + (B > 0 ? 1 : -1);

  // Number line from min(0, qb) to max(0, a), with a little margin.
  const lo = Math.min(0, qb, A);
  const hi = Math.max(0, qb, A);
  const span = Math.max(hi - lo, step, 1);
  const W = 340;
  const pad = 22;
  const X = (v: number) => pad + ((v - lo) / span) * (W - 2 * pad);
  const axisY = 92;
  const drawJumps = jumps <= 40;
  const dir = qb >= 0 ? 1 : -1;
  const ticks = drawJumps ? Array.from({ length: jumps + 1 }, (_, i) => dir * i * step) : [0, qb];

  return (
    <Bench title="Maradékos osztás a számegyenesen" hint="0-ból |b| hosszú ugrásokkal közelítjük meg a-t úgy, hogy ne lépjük át; ami marad, az a maradék. Próbálj negatív a-t is!">
      <div className="row">
        <NumField label="a (osztandó)" value={a} onChange={setA} />
        <NumField label="b (osztó)" value={b} onChange={setB} />
      </div>
      {!ok ? (
        <p className="err">{B === 0 ? 'Nullával nem lehet osztani.' : 'Legfeljebb milliós számokkal.'}</p>
      ) : (
        <>
          <svg className="diagram" viewBox={`0 0 ${W} 130`} role="img" aria-label={`${A} = ${B} · ${q} + ${r}`}>
            <line x1={6} y1={axisY} x2={W - 6} y2={axisY} stroke="var(--axis)" strokeWidth={1.5} />
            {drawJumps ? (
              ticks.slice(1).map((t, i) => {
                const x1 = X(ticks[i]);
                const x2 = X(t);
                const h = Math.min(34, Math.abs(x2 - x1) * 0.7 + 6);
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${axisY} Q ${(x1 + x2) / 2} ${axisY - h * 2} ${x2} ${axisY}`}
                    fill="none"
                    stroke={i % 2 ? 'var(--q1)' : 'var(--q3)'}
                    strokeWidth={2}
                  />
                );
              })
            ) : (
              <path d={`M ${X(0)} ${axisY} Q ${(X(0) + X(qb)) / 2} ${axisY - 70} ${X(qb)} ${axisY}`} fill="none" stroke="var(--q1)" strokeWidth={2} strokeDasharray="5 4" />
            )}
            {!drawJumps ? (
              <text x={(X(0) + X(qb)) / 2} y={axisY - 40} textAnchor="middle" className="small">
                {jumps} ugrás
              </text>
            ) : null}
            {r > 0 ? <line x1={X(qb)} y1={axisY} x2={X(A)} y2={axisY} stroke="var(--good)" strokeWidth={6} strokeLinecap="round" /> : null}
            {ticks.map((t, i) => (
              <line key={i} x1={X(t)} y1={axisY - 5} x2={X(t)} y2={axisY + 5} stroke="var(--muted)" strokeWidth={1.2} />
            ))}
            <circle cx={X(0)} cy={axisY} r={4} fill="var(--ink)" />
            <text x={X(0)} y={axisY + 22} textAnchor="middle" className="small">
              0
            </text>
            {qb !== 0 && qb !== A ? (
              <text x={X(qb)} y={axisY + 22} textAnchor="middle" className="small">
                {sgn(qb)}
              </text>
            ) : null}
            <circle cx={X(A)} cy={axisY} r={5.5} fill="var(--bad)" />
            <text x={X(A)} y={axisY + (qb !== A && Math.abs(X(A) - X(qb)) < 26 ? 38 : 22)} textAnchor="middle" style={{ fill: 'var(--bad)' }}>
              a = {sgn(A)}
            </text>
          </svg>
          <div className="out">
            <p className="line">
              {sgn(A)} = {sgn(B)} · {q < 0 ? `(${sgn(q)})` : q} + {r}
            </p>
            <p>
              {jumps} darab {step} hosszú ugrás {q === 0 ? '(egy sem)' : dir > 0 ? 'jobbra' : 'balra'} visz {sgn(qb)}-ig, onnan{' '}
              <b style={{ color: 'var(--good)' }}>{r}</b> lépés van még a-ig, mindig <b>jobbra</b>. Ezért a maradék {r}, és 0 ≤ {r} &lt; {step}.
            </p>
            {A < 0 && r > 0 ? (
              <p className="note">
                Negatív a-nál a-n <b>túl</b> kell ugrani balra ({sgn(qb)}-ig), hogy a maradék pozitív legyen. A {sgn(A)} = {sgn(B)} ·{' '}
                {alt < 0 ? `(${sgn(alt)})` : alt} − {step - r}{' '}
                felírás azért nem jó, mert ott a „maradék” negatív.
              </p>
            ) : null}
          </div>
        </>
      )}
    </Bench>
  );
}
