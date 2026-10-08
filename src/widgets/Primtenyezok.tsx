import { useState, type ReactNode } from 'react';

import { canon, divisibilityRules, divisorCount, eulerPhi, factor } from '@/lib/numbers';

import { Bench, Chip, Kv, NumField } from './ui';

/** Canonical form, number of divisors, φ, divisibility rules, and gcd/lcm via prime powers. */
export function Primtenyezok({ n: n0 = 1455300, m: m0 }: { n?: number; m?: number }) {
  const [n, setN] = useState(n0);
  const [useM, setUseM] = useState(m0 !== undefined);
  const [m, setM] = useState(m0 ?? 185130);
  const N = Math.trunc(n),
    M = Math.trunc(m);
  const ok = N >= 2 && N <= 1e12;
  const f = ok ? factor(N) : [];
  const rows: [string, ReactNode][] = ok
    ? [
        ['kanonikus alak', `${N.toLocaleString('hu-HU')} = ${canon(f)}`],
        ['prím?', f.length === 1 && f[0][1] === 1 ? <Chip kind="ok">prím</Chip> : <Chip kind="mid">összetett</Chip>],
        ['d(n)', `${f.map(([, e]) => `(${e}+1)`).join('')} = ${divisorCount(f)}`],
        ['φ(n)', `${N} · ${f.map(([p]) => `(1 − 1/${p})`).join(' · ')} = ${eulerPhi(f)}`],
      ]
    : [];
  if (ok && useM && M >= 2 && M <= 1e12) {
    const g = factor(M);
    const ps = [...new Set([...f.map((x) => x[0]), ...g.map((x) => x[0])])].sort((x, y) => x - y);
    const ex = (F: [number, number][], p: number) => F.find((x) => x[0] === p)?.[1] ?? 0;
    const G = ps.map((p) => [p, Math.min(ex(f, p), ex(g, p))] as [number, number]).filter((x) => x[1]);
    const L = ps.map((p) => [p, Math.max(ex(f, p), ex(g, p))] as [number, number]);
    const val = (F: [number, number][]) => F.reduce((a, [p, e]) => a * p ** e, 1);
    rows.push(
      ['második szám', `${M.toLocaleString('hu-HU')} = ${canon(g)}`],
      ['(n, m): kisebb kitevők', `${G.length ? canon(G) : '1'} = ${val(G).toLocaleString('hu-HU')}`],
      ['[n, m]: nagyobb kitevők', `${canon(L)} = ${val(L).toLocaleString('hu-HU')}`]
    );
  }
  return (
    <Bench title="Prímtényezős felbontás" hint="Kanonikus alak, osztók száma, Euler-φ és az oszthatósági szabályok egyszerre.">
      <div className="row">
        <NumField label="n" value={n} onChange={setN} min={2} width="9em" />
        <label className="f">
          <span>
            <input type="checkbox" checked={useM} onChange={(e) => setUseM(e.target.checked)} /> második szám (lnko/lkkt)
          </span>
          <input type="number" value={m} disabled={!useM} style={{ width: '9em' }} onChange={(e) => setM(Number(e.target.value) || 0)} />
        </label>
      </div>
      {!ok ? <p className="err">Adj meg egy egész számot 2 és 10¹² között.</p> : null}
      {ok ? (
        <div className="cols">
          <Kv rows={rows} />
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>÷</th>
                  <th>a szabály ezt nézi</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {divisibilityRules(N).map((r) => (
                  <tr key={r.by}>
                    <td>{r.by}</td>
                    <td>{r.looksAt}</td>
                    <td>{r.ok ? <Chip kind="ok">igen</Chip> : <Chip kind="no">nem</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Bench>
  );
}
