import { useState, type KeyboardEvent } from 'react';

import { Bench, Chip } from './ui';

const NAMES = ['a', 'b', 'c'];

type Row = { left: string; lv: boolean; law: '⇔' | '⊨'; right: string; rv: boolean };

function LawTable({ rows }: { rows: Row[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>bal oldal</th>
            <th />
            <th>jobb oldal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const broken = r.lv && !r.rv;
            const reverse = !r.lv && r.rv;
            return (
              <tr key={r.left + r.right}>
                <td style={{ fontFamily: 'var(--math)' }}>
                  {r.left} = <b>{r.lv ? 1 : 0}</b>
                </td>
                <td style={{ fontFamily: 'var(--math)', textAlign: 'center' }}>{r.law}</td>
                <td style={{ fontFamily: 'var(--math)' }}>
                  {r.right} = <b>{r.rv ? 1 : 0}</b>
                </td>
                <td>
                  {broken ? (
                    <Chip kind="no">lehetetlen?!</Chip>
                  ) : reverse ? (
                    <Chip kind="mid">itt a fordított irány nem teljesül</Chip>
                  ) : (
                    <Chip kind="ok">rendben</Chip>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function cellKeys(e: KeyboardEvent, toggle: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggle();
  }
}

/** Build small interpretations by clicking, and watch which quantifier laws hold in which direction. */
export function KvantorJatszoter({ resz = 'mindketto' }: { resz?: 'ketvaltozos' | 'egyvaltozos' | 'mindketto' }) {
  const [n, setN] = useState(2);
  const [A, setA] = useState<number[][]>([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
  const [P, setP] = useState([1, 0, 0]);
  const [Q, setQ] = useState([0, 1, 0]);
  const U = Array.from({ length: n }, (_, i) => i);
  const all = (f: (i: number) => boolean) => U.every(f);
  const ex = (f: (i: number) => boolean) => U.some(f);
  const a = (x: number, y: number) => !!A[x][y];
  const p = (i: number) => !!P[i];
  const q = (i: number) => !!Q[i];

  const toggleA = (x: number, y: number) => setA(A.map((row, i) => row.map((v, j) => (i === x && j === y ? 1 - v : v))));
  const toggle = (arr: number[], set: (v: number[]) => void, j: number) => set(arr.map((v, i) => (i === j ? 1 - v : v)));

  const two: Row[] = [
    { left: '∃x∀y A(x,y)', lv: ex((x) => all((y) => a(x, y))), law: '⊨', right: '∀y∃x A(x,y)', rv: all((y) => ex((x) => a(x, y))) },
    { left: '∀x∀y A(x,y)', lv: all((x) => all((y) => a(x, y))), law: '⇔', right: '∀y∀x A(x,y)', rv: all((y) => all((x) => a(x, y))) },
    { left: '∃x∃y A(x,y)', lv: ex((x) => ex((y) => a(x, y))), law: '⇔', right: '∃y∃x A(x,y)', rv: ex((y) => ex((x) => a(x, y))) },
    { left: '∃y∀x A(x,y)', lv: ex((y) => all((x) => a(x, y))), law: '⊨', right: '∀x∃y A(x,y)', rv: all((x) => ex((y) => a(x, y))) },
  ];
  const one: Row[] = [
    { left: '∀xA(x) ∨ ∀xB(x)', lv: all(p) || all(q), law: '⊨', right: '∀x(A(x) ∨ B(x))', rv: all((i) => p(i) || q(i)) },
    { left: '∃x(A(x) ∧ B(x))', lv: ex((i) => p(i) && q(i)), law: '⊨', right: '∃xA(x) ∧ ∃xB(x)', rv: ex(p) && ex(q) },
    { left: '∃x(A(x) ∨ B(x))', lv: ex((i) => p(i) || q(i)), law: '⇔', right: '∃xA(x) ∨ ∃xB(x)', rv: ex(p) || ex(q) },
    { left: '∀x(A(x) ∧ B(x))', lv: all((i) => p(i) && q(i)), law: '⇔', right: '∀xA(x) ∧ ∀xB(x)', rv: all(p) && all(q) },
    { left: '¬∃x A(x)', lv: !ex(p), law: '⇔', right: '∀x ¬A(x)', rv: all((i) => !p(i)) },
  ];

  return (
    <Bench
      title="Interpretáció kis univerzumon"
      hint="Kattints a cellákra, hogy hol legyenek igazak a predikátumok. Keress olyan beállítást, ahol egy ⊨ sor bal oldala 1, a jobb 0: a helyes irányban ilyet nem fogsz találni.">
      <div className="row">
        <span className="note">Univerzum:</span>
        {[2, 3].map((k) => (
          <button key={k} type="button" className={`btn${n === k ? ' on' : ''}`} onClick={() => setN(k)}>
            U = {'{'}
            {NAMES.slice(0, k).join(', ')}
            {'}'}
          </button>
        ))}
      </div>
      <div className="stack" style={{ gap: 24 }}>
        {resz !== 'egyvaltozos' ? (
          <div className="stack">
            <b>Kétváltozós predikátum A(x, y)</b>
            <div className="tablewrap">
              <table className="rgrid">
                <tbody>
                  <tr>
                    <th>x \ y</th>
                    {U.map((j) => (
                      <th key={j}>{NAMES[j]}</th>
                    ))}
                  </tr>
                  {U.map((i) => (
                    <tr key={i}>
                      <th>{NAMES[i]}</th>
                      {U.map((j) => (
                        <td
                          key={j}
                          className={`click${A[i][j] ? ' in' : ''}`}
                          tabIndex={0}
                          role="button"
                          aria-label={`A(${NAMES[i]}, ${NAMES[j]}) = ${A[i][j]}`}
                          onClick={() => toggleA(i, j)}
                          onKeyDown={(e) => cellKeys(e, () => toggleA(i, j))}>
                          {A[i][j]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setN(2);
                  setA([
                    [0, 1, 0],
                    [1, 0, 0],
                    [0, 0, 0],
                  ]);
                }}>
                Az előadás ellenpéldája
              </button>
            </div>
            <LawTable rows={two} />
          </div>
        ) : null}
        {resz !== 'ketvaltozos' ? (
          <div className="stack">
            <b>Egyváltozós predikátumok A(x), B(x)</b>
            <div className="tablewrap">
              <table className="rgrid">
                <tbody>
                  <tr>
                    <th />
                    {U.map((j) => (
                      <th key={j}>{NAMES[j]}</th>
                    ))}
                  </tr>
                  {(
                    [
                      ['A(x)', P, setP],
                      ['B(x)', Q, setQ],
                    ] as const
                  ).map(([label, arr, set]) => (
                    <tr key={label}>
                      <th>{label}</th>
                      {U.map((j) => (
                        <td
                          key={j}
                          className={`click${arr[j] ? ' in' : ''}`}
                          tabIndex={0}
                          role="button"
                          aria-label={`${label.replace('x', NAMES[j])} = ${arr[j]}`}
                          onClick={() => toggle(arr, set, j)}
                          onKeyDown={(e) => cellKeys(e, () => toggle(arr, set, j))}>
                          {arr[j]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setN(2);
                  setP([1, 0, 0]);
                  setQ([0, 1, 0]);
                }}>
                Az előadás ellenpéldája
              </button>
            </div>
            <LawTable rows={one} />
          </div>
        ) : null}
      </div>
    </Bench>
  );
}
