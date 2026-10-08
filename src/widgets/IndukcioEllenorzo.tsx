import { useState } from 'react';

import { Bench, NumField } from './ui';

const fact = (n: number) => {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};
const sum = (n: number, f: (k: number) => number) => {
  let s = 0;
  for (let k = 1; k <= n; k++) s += f(k);
  return s;
};

type Claim = { label: string; lhs: (n: number) => number; rhs?: (n: number) => number; div?: number };

const CLAIMS: Record<string, Claim> = {
  osszeg: { label: '2.1  1 + 2 + ⋯ + n = n(n+1)/2', lhs: (n) => sum(n, (k) => k), rhs: (n) => (n * (n + 1)) / 2 },
  negyzetek: { label: '2.2  1² + ⋯ + n² = n(n+1)(2n+1)/6', lhs: (n) => sum(n, (k) => k * k), rhs: (n) => (n * (n + 1) * (2 * n + 1)) / 6 },
  kobok: { label: '2.3  1³ + ⋯ + n³ = (n(n+1)/2)²', lhs: (n) => sum(n, (k) => k ** 3), rhs: (n) => ((n * (n + 1)) / 2) ** 2 },
  paratlan: { label: '2.4  1 + 3 + ⋯ + (2n−1) = n²', lhs: (n) => sum(n, (k) => 2 * k - 1), rhs: (n) => n * n },
  szorzatok: { label: '2.6  1·2 + ⋯ + n(n+1) = n(n+1)(n+2)/3', lhs: (n) => sum(n, (k) => k * (k + 1)), rhs: (n) => (n * (n + 1) * (n + 2)) / 3 },
  faktorialis: { label: '2.10  1·1! + ⋯ + n·n! = (n+1)! − 1', lhs: (n) => sum(n, (k) => k * fact(k)), rhs: (n) => fact(n + 1) - 1 },
  'oszt-6a': { label: '2.11  6 | n³ − n', lhs: (n) => n ** 3 - n, div: 6 },
  'oszt-6b': { label: '2.12  6 | n³ + 5n', lhs: (n) => n ** 3 + 5 * n, div: 6 },
  'oszt-5': { label: '2.13  5 | 2^(4n+1) + 3', lhs: (n) => 2 ** (4 * n + 1) + 3, div: 5 },
  'oszt-4': { label: '2.16  4 | 7ⁿ + 10n − 5', lhs: (n) => 7 ** n + 10 * n - 5, div: 4 },
};

/** Check an induction claim numerically for small n before proving it. */
export function IndukcioEllenorzo({ allitas = 'paratlan' }: { allitas?: string }) {
  const [key, setKey] = useState(CLAIMS[allitas] ? allitas : 'paratlan');
  const [N, setN] = useState(8);
  const c = CLAIMS[key];
  const n = Math.max(1, Math.min(20, Math.trunc(N) || 1));
  const ns = Array.from({ length: n }, (_, i) => i + 1);
  const num = (v: number) => (Number.isSafeInteger(v) ? v.toLocaleString('hu-HU') : 'túl nagy');
  return (
    <Bench
      title="Ellenőrizd számokkal, mielőtt bizonyítasz"
      hint="A számolás nem bizonyítás, de ha egy sor nem stimmel, elírtál valamit a képletben.">
      <div className="row">
        <label className="f">
          Állítás
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {Object.entries(CLAIMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <NumField label="n-ig" value={N} onChange={setN} min={1} max={20} />
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            {c.rhs ? (
              <tr>
                <th>n</th>
                <th>bal oldal</th>
                <th>jobb oldal</th>
                <th />
              </tr>
            ) : (
              <tr>
                <th>n</th>
                <th>érték</th>
                <th>÷ {c.div}</th>
                <th />
              </tr>
            )}
          </thead>
          <tbody>
            {ns.map((k) => {
              const L = c.lhs(k);
              if (c.rhs) {
                const R = c.rhs(k);
                return (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{num(L)}</td>
                    <td>{num(R)}</td>
                    <td>{L === R ? <span className="chip ok">=</span> : <span className="chip no">≠</span>}</td>
                  </tr>
                );
              }
              const ok = Number.isSafeInteger(L) ? L % c.div! === 0 : null;
              return (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{num(L)}</td>
                  <td>{ok ? num(L / c.div!) : '–'}</td>
                  <td>{ok === null ? '' : ok ? <span className="chip ok">osztható</span> : <span className="chip no">nem</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Bench>
  );
}
