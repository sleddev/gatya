import { useState } from 'react';

import { mod, parseList, sgn, showSet } from '@/lib/numbers';

import { Bench, Chip, Kv, NumField } from './ui';

type Cond = { label: string; f: (a: number, b: number, k: number) => boolean; k?: boolean };

const CONDS: Record<string, Cond> = {
  nagyobb: { label: 'a > b', f: (a, b) => a > b },
  kisebb: { label: 'a < b', f: (a, b) => a < b },
  egyenlo: { label: 'a = b', f: (a, b) => a === b },
  nagyobbegyenlo: { label: 'a ≥ b', f: (a, b) => a >= b },
  oszto: { label: 'a | b (a osztója b-nek)', f: (a, b) => a !== 0 && b % a === 0 },
  paros: { label: 'a + b páros', f: (a, b) => mod(a + b, 2) === 0 },
  'a-k': { label: 'a = k', f: (a, _b, k) => a === k, k: true },
  'b-k': { label: 'b = k', f: (_a, b, k) => b === k, k: true },
  'osszeg-k': { label: 'a + b = k', f: (a, b, k) => a + b === k, k: true },
};

/** A × B as a grid with the pairs of a relation shaded; domain, range and inverse alongside. */
export function RelacioFelfedezo({
  A = '1,4,5',
  B = '1,2,6',
  feltetel = 'nagyobb',
  k: k0 = 4,
}: {
  A?: string;
  B?: string;
  feltetel?: string;
  k?: number;
}) {
  const [sa, setSa] = useState(A);
  const [sb, setSb] = useState(B);
  const [c, setC] = useState(CONDS[feltetel] ? feltetel : 'nagyobb');
  const [k, setK] = useState(k0);
  const as = parseList(sa).map(Number).sort((x, y) => x - y);
  const bs = parseList(sb).map(Number).sort((x, y) => x - y);
  const bad = as.some(Number.isNaN) || bs.some(Number.isNaN);
  const cond = CONDS[c];
  const R: [number, number][] = [];
  if (!bad) as.forEach((a) => bs.forEach((b) => cond.f(a, b, k) && R.push([a, b])));
  const pairs = (r: [number, number][]) => (r.length ? `{${r.map(([x, y]) => `(${sgn(x)}, ${sgn(y)})`).join(', ')}}` : '∅');
  const isFunction = as.every((a) => R.filter((p) => p[0] === a).length === 1);
  return (
    <Bench title="Relációk A × B-ben" hint="A rács A × B összes párja; a színezett cellák vannak benne R-ben.">
      <div className="row">
        <label className="f">
          A
          <input type="text" value={sa} onChange={(e) => setSa(e.target.value)} />
        </label>
        <label className="f">
          B
          <input type="text" value={sb} onChange={(e) => setSb(e.target.value)} />
        </label>
        <label className="f">
          Feltétel
          <select value={c} onChange={(e) => setC(e.target.value)}>
            {Object.entries(CONDS).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        {cond.k ? <NumField label="k" value={k} onChange={setK} /> : null}
      </div>
      {bad ? (
        <p className="err">Ehhez az eszközhöz számokat adj meg A-ban és B-ben.</p>
      ) : (
        <div className="cols">
          <div className="tablewrap">
            <table className="rgrid">
              <tbody>
                <tr>
                  <th>a \ b</th>
                  {bs.map((b) => (
                    <th key={b}>{sgn(b)}</th>
                  ))}
                </tr>
                {as.map((a) => (
                  <tr key={a}>
                    <th>{sgn(a)}</th>
                    {bs.map((b) => {
                      const on = cond.f(a, b, k);
                      return (
                        <td key={b} className={on ? 'in' : ''}>
                          {on ? '●' : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Kv
            rows={[
              ['|A × B|', `${as.length} · ${bs.length} = ${as.length * bs.length}`],
              ['R', pairs(R)],
              ['|R|', String(R.length)],
              ['értelmezési tartomány', showSet([...new Set(R.map((p) => String(p[0])))])],
              ['értékkészlet', showSet([...new Set(R.map((p) => String(p[1])))])],
              ['inverz R⁻¹', pairs(R.map(([x, y]) => [y, x]))],
              [
                'függvény A → B?',
                isFunction ? (
                  <Chip kind="ok">igen</Chip>
                ) : (
                  <>
                    <Chip kind="no">nem</Chip> <span className="note">van olyan a, amelynek 0 vagy több párja van</span>
                  </>
                ),
              ],
            ]}
          />
        </div>
      )}
    </Bench>
  );
}
