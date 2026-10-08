import { useState } from 'react';

import { bezout, diophantine, MINUS, par, sgn } from '@/lib/numbers';

import { Bench, Chip, Kv, NumField } from './ui';

/** Euclidean algorithm step by step, with Bézout coefficients and an optional Diophantine equation. */
export function EuklideszAlgoritmus({ a: a0 = 1227, b: b0 = 216, c: c0 }: { a?: number; b?: number; c?: number }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [useC, setUseC] = useState(c0 !== undefined);
  const [c, setC] = useState(c0 ?? 3);
  const A = Math.trunc(a),
    B = Math.trunc(b),
    C = Math.trunc(c);
  const tooBig = Math.abs(A) > 1e12 || Math.abs(B) > 1e12;
  const empty = A === 0 && B === 0;
  const bz = !tooBig && !empty ? bezout(A, B) : null;
  const d = bz && useC ? diophantine(A, B, C) : null;

  const nonNeg: string[] = [];
  if (d?.solvable && A > 0 && B > 0 && C > 0 && d.dx !== 0) {
    for (let t = 0; nonNeg.length < 12; t++) {
      const x = d.x + d.dx * t,
        y = d.y - d.dy * t;
      if (y < 0) break;
      nonNeg.push(`(${x}, ${y})`);
    }
  }

  return (
    <Bench
      title="Euklideszi algoritmus"
      hint="Írd át a számokat. Ha bekapcsolod a c-t, az ax + by = c diofantikus egyenletet is megoldja.">
      <div className="row">
        <NumField label="a" value={a} onChange={setA} />
        <NumField label="b" value={b} onChange={setB} />
        <label className="f">
          <span>
            <input type="checkbox" checked={useC} onChange={(e) => setUseC(e.target.checked)} /> c (egyenlethez)
          </span>
          <input type="number" value={c} disabled={!useC} onChange={(e) => setC(Number(e.target.value) || 0)} />
        </label>
      </div>
      {empty ? <p className="err">Legalább az egyik szám ne legyen 0.</p> : null}
      {tooBig ? <p className="err">10¹²-nél kisebb számokkal pontos a számolás.</p> : null}
      {bz ? (
        <div className="cols">
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>lépés</th>
                  <th>maradékos osztás</th>
                </tr>
              </thead>
              <tbody>
                {bz.steps.map((s, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontFamily: 'var(--math)' }}>
                      {s.a} = {s.b} · {s.q} + <b>{s.r}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="out">
            <Kv
              rows={[
                ['(a, b)', <>{bz.g} <span className="note">(az utolsó nem nulla maradék)</span></>],
                ['[a, b]', bz.g ? (Math.abs(A * B) / bz.g).toLocaleString('hu-HU') : '0'],
                ['Bézout', `${sgn(A)}·${par(bz.x)} + ${sgn(B)}·${par(bz.y)} = ${bz.g}`],
              ]}
            />
            {d ? (
              d.solvable ? (
                <>
                  <p>
                    <Chip kind="ok">megoldható</Chip> mert {d.g} | {sgn(C)}. A Bézout-azonosságot szorozzuk {sgn(C)}/{d.g} ={' '}
                    {sgn(C / d.g)}-mal:
                  </p>
                  <div className="line">
                    x₀ = {sgn(d.x0)}, y₀ = {sgn(d.y0)}
                  </div>
                  <p>
                    A legkisebb nemnegatív x-szel:{' '}
                    <span className="line">
                      x = {sgn(d.x)}, y = {sgn(d.y)}
                    </span>{' '}
                    <span className="note">
                      (próba: {sgn(A)}·{par(d.x)} + {sgn(B)}·{par(d.y)} = {sgn(A * d.x + B * d.y)})
                    </span>
                  </p>
                  <p>Az összes megoldás:</p>
                  <div className="line">
                    x = {sgn(d.x)} {d.dx < 0 ? MINUS : '+'} {Math.abs(d.dx)}t, &nbsp; y = {sgn(d.y)} {d.dy < 0 ? '+' : MINUS}{' '}
                    {Math.abs(d.dy)}t, &nbsp; t ∈ ℤ
                  </div>
                  {nonNeg.length ? <p className="note">Nemnegatív megoldások (szöveges feladatokhoz): {nonNeg.join(', ')}</p> : null}
                </>
              ) : (
                <p>
                  <Chip kind="no">nincs egész megoldás</Chip> mert ({sgn(A)}, {sgn(B)}) = {d.g} nem osztója {sgn(C)}-nek.
                </p>
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </Bench>
  );
}
