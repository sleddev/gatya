import { useState } from 'react';

import { eulerPhi, factor, gcd, modPow, mod } from '@/lib/numbers';

import { Bench, NumField } from './ui';

/** a^k mod m, explained with the Euler–Fermat theorem when it applies. */
export function ModularisHatvany({ a: a0 = 2, k: k0 = 2026, m: m0 = 15 }: { a?: number; k?: number; m?: number }) {
  const [a, setA] = useState(a0);
  const [k, setK] = useState(k0);
  const [m, setM] = useState(m0);
  const A = Math.trunc(a),
    K = Math.trunc(k),
    M = Math.trunc(m);
  const valid = M >= 2 && M <= 1e9 && K >= 0 && Number.isSafeInteger(K);
  let body = <p className="err">m ≥ 2 (legfeljebb 10⁹) és k ≥ 0 legyen.</p>;
  if (valid) {
    const f = factor(M);
    const phi = eulerPhi(f);
    const g = gcd(mod(A, M), M);
    const res = modPow(BigInt(A), BigInt(K), BigInt(M)).toString();
    const q = Math.floor(K / phi),
      r = K % phi;
    body = (
      <div className="out">
        <p>
          φ({M}) = {M}·{f.map(([p]) => `(1 − 1/${p})`).join('·')} = {phi}, és ({A}, {M}) = {g}.
        </p>
        {g === 1 ? (
          <>
            <p>
              Relatív prímek, ezért az Euler–Fermat-tétel szerint {A}
              <sup>{phi}</sup> ≡ 1 (mod {M}). Írjuk fel: {K} = {phi}·{q} + {r}, tehát
            </p>
            <div className="line">
              {A}
              <sup>{K}</sup> = ({A}
              <sup>{phi}</sup>)<sup>{q}</sup> · {A}
              <sup>{r}</sup> ≡ 1 · {A}
              <sup>{r}</sup> ≡ <b>{res}</b> (mod {M})
            </div>
          </>
        ) : (
          <>
            <p>(a, m) ≠ 1, így az Euler–Fermat-tétel közvetlenül nem használható. Ilyenkor a hatványok ismétlődését érdemes keresni. Ismételt négyzetre emeléssel:</p>
            <div className="line">
              {A}
              <sup>{K}</sup> ≡ <b>{res}</b> (mod {M})
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <Bench title="Nagy hatványok maradéka" hint="aᵏ mod m kiszámítása az Euler–Fermat-tétellel.">
      <div className="row">
        <NumField label="alap a" value={a} onChange={setA} />
        <NumField label="kitevő k" value={k} onChange={setK} min={0} />
        <NumField label="modulus m" value={m} onChange={setM} min={2} />
      </div>
      {body}
    </Bench>
  );
}
