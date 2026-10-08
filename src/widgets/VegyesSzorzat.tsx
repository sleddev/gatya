import { useState } from 'react';

import { absText } from '@/lib/complex';
import { par, sgn } from '@/lib/numbers';

import { Bench, Chip } from './ui';

type V3 = [number, number, number];

/** Cross product b × c and scalar triple product a · (b × c) of three 3D vectors. */
export function VegyesSzorzat({
  a: a0 = [1, 2, 3],
  b: b0 = [4, 5, 6],
  c: c0 = [7, 8, 9],
}: {
  a?: V3;
  b?: V3;
  c?: V3;
}) {
  const [vs, setVs] = useState<Record<'a' | 'b' | 'c', V3>>({ a: a0, b: b0, c: c0 });
  const { a, b, c } = vs;
  const x: V3 = [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]];
  const t = a[0] * x[0] + a[1] * x[1] + a[2] * x[2];
  const set = (k: 'a' | 'b' | 'c', i: number, v: number) => setVs({ ...vs, [k]: vs[k].map((y, j) => (j === i ? v : y)) as V3 });
  return (
    <Bench title="Vektoriális és vegyes szorzat" hint="GeoGebrában: u = Cross(b, c), majd d = a * u.">
      <div className="row">
        {(['a', 'b', 'c'] as const).map((k) => (
          <label key={k} className="f">
            <span style={{ fontFamily: 'var(--math)', fontSize: '1rem' }}>{k} = (x, y, z)</span>
            <span className="row" style={{ gap: 4 }}>
              {vs[k].map((v, i) => (
                <input
                  key={i}
                  type="number"
                  value={v}
                  aria-label={`${k} ${'xyz'[i]}`}
                  style={{ width: '4.6em' }}
                  onChange={(e) => set(k, i, Number(e.target.value) || 0)}
                />
              ))}
            </span>
          </label>
        ))}
      </div>
      <div className="out">
        <p>
          <b>b × c</b>:
        </p>
        <div className="line">
          ({par(b[1])}·{par(c[2])} − {par(b[2])}·{par(c[1])}, {par(b[2])}·{par(c[0])} − {par(b[0])}·{par(c[2])}, {par(b[0])}·{par(c[1])} −{' '}
          {par(b[1])}·{par(c[0])}) = ({x.map(sgn).join(', ')})
        </div>
        <p className="note">
          Merőleges-e mindkettőre? (b×c)·b = {sgn(x[0] * b[0] + x[1] * b[1] + x[2] * b[2])}, (b×c)·c = {sgn(x[0] * c[0] + x[1] * c[1] + x[2] * c[2])}.
          A kifeszített paralelogramma területe ‖b×c‖ = {absText(Math.hypot(x[0], x[1]), x[2])}.
        </p>
        <p>
          <b>a · (b × c)</b>:
        </p>
        <div className="line">
          {par(a[0])}·{par(x[0])} + {par(a[1])}·{par(x[1])} + {par(a[2])}·{par(x[2])} = <b>{sgn(t)}</b>
        </div>
        <p>
          {t === 0 ? (
            <>
              <Chip kind="ok">0 → a, b, c egy síkban vannak</Chip> (a paralelepipedon lapos, térfogata 0)
            </>
          ) : (
            <>
              <Chip kind="mid">paralelepipedon térfogata = |{sgn(t)}| = {Math.abs(t)}</Chip> {t > 0 ? '(jobbsodrású rendszer)' : '(balsodrású rendszer)'}
            </>
          )}
        </p>
      </div>
    </Bench>
  );
}
