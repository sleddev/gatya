import { useState } from 'react';

import { linearCongruence, mod, sgn } from '@/lib/numbers';

import { Bench, Chip, NumField } from './ui';

/** Solve a·x ≡ b (mod m) with the lecture's "divide by (a, m)" method. */
export function LinearisKongruencia({ a: a0 = 12, b: b0 = 8, m: m0 = 16 }: { a?: number; b?: number; m?: number }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [m, setM] = useState(m0);
  const A = Math.trunc(a),
    B = Math.trunc(b),
    M = Math.trunc(m);
  const valid = M >= 1 && M <= 1e9;
  const r = valid ? linearCongruence(A, B, M) : null;
  return (
    <Bench title="Lineáris kongruencia" hint="ax ≡ b (mod m) megoldása lépésenként.">
      <div className="row">
        <NumField label="a" value={a} onChange={setA} />
        <NumField label="b" value={b} onChange={setB} />
        <NumField label="m" value={m} onChange={setM} min={1} />
      </div>
      {!valid ? <p className="err">A modulus 1 és 10⁹ között legyen.</p> : null}
      {r ? (
        <div className="out">
          <p>
            <b>1.</b> d = (a, m) = ({sgn(A)}, {M}) = {r.d}.
          </p>
          {!r.solvable ? (
            <p>
              <Chip kind="no">nincs megoldás</Chip> mert {r.d} ∤ {sgn(B)}.
            </p>
          ) : (
            <>
              <p>
                <Chip kind="ok">megoldható</Chip> mert {r.d} | {sgn(B)}. <b>2.</b> Osszunk {r.d}-vel:{' '}
                <span className="line">
                  {sgn(r.a1)}x ≡ {sgn(r.b1)} (mod {r.m1})
                </span>
                , és most ({sgn(r.a1)}, {r.m1}) = 1.
              </p>
              {r.m1 === 1 ? (
                <p>Minden egész szám megoldás.</p>
              ) : (
                <>
                  <p>
                    <b>3.</b> {mod(r.a1, r.m1)} inverze mod {r.m1}: {r.inv}, mert {mod(r.a1, r.m1)}·{r.inv} ≡ 1. Szorozzunk vele:
                  </p>
                  <div className="line">
                    x ≡ {r.inv}·{mod(r.b1, r.m1)} ≡ {r.x0} (mod {r.m1})
                  </div>
                  <p>
                    Az eredeti modulus szerint {r.d === 1 ? '1 megoldás van' : `${r.d} megoldás van`}:{' '}
                    <span className="line">
                      x ≡ {r.all.join(', ')}
                      {r.d > 20 ? ', …' : ''} (mod {M})
                    </span>
                  </p>
                  <p className="note">
                    Minden egész megoldás: x = {r.x0} + {r.m1}t, például {[-2, -1, 0, 1, 2].map((t) => sgn(r.x0 + r.m1 * t)).join(', ')}.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      ) : null}
    </Bench>
  );
}
