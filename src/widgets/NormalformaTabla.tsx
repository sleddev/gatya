// Truth table → DNF and KNF. Click the last column to make any truth function; every 1-row gives an
// elementary conjunction of the DNF, every 0-row an elementary disjunction of the KNF.
import { useMemo, useState } from 'react';

import { evaluate, parse, valuations, type Valuation } from '@/lib/logic';

import { Bench } from './ui';

const LETTERS = ['p', 'q', 'r'];

const conj = (v: Valuation, names: string[]) => names.map((n) => (v[n] ? n : `¬${n}`)).join(' ∧ ');
const disj = (v: Valuation, names: string[]) => names.map((n) => (v[n] ? `¬${n}` : n)).join(' ∨ ');

export function NormalformaTabla({ formula = 'p ≡ q' }: { formula?: string }) {
  const start = useMemo(() => parse(formula).ast, [formula]);
  const startNames = useMemo(() => valuations(new Set(formula.match(/[pqr]/g) ?? ['p', 'q'])).names, [formula]);
  const [n, setN] = useState(Math.max(2, startNames.length));
  const names = LETTERS.slice(0, n);
  const rows = valuations(names).rows;
  const [out, setOut] = useState<boolean[]>(() => valuations(LETTERS.slice(0, Math.max(2, startNames.length))).rows.map((r) => evaluate(start, r)));
  const [mode, setMode] = useState<'dnf' | 'knf'>('dnf');

  const resize = (k: number) => {
    setN(k);
    setOut(valuations(LETTERS.slice(0, k)).rows.map(() => false));
  };
  const ones = rows.filter((_, i) => out[i]);
  const zeros = rows.filter((_, i) => !out[i]);
  const paren = (s: string, many: boolean) => (many && s.includes(' ') ? `(${s})` : s);
  const dnf = ones.map((r) => paren(conj(r, names), ones.length > 1)).join(' ∨ ');
  const knf = zeros.map((r) => paren(disj(r, names), zeros.length > 1)).join(' ∧ ');

  return (
    <Bench
      title="Igazságtáblából normálforma"
      hint="Kattints az utolsó oszlop celláira, és találj ki bármilyen igazságtáblát. Mellette látod, melyik sorból milyen tag lesz.">
      <div className="row">
        <span className="note">Betűk:</span>
        {[2, 3].map((k) => (
          <button key={k} type="button" className={`btn${n === k ? ' on' : ''}`} onClick={() => resize(k)}>
            {LETTERS.slice(0, k).join(', ')}
          </button>
        ))}
        <span className="note" style={{ marginLeft: 8 }}>
          Mutasd:
        </span>
        <button type="button" className={`btn${mode === 'dnf' ? ' on' : ''}`} onClick={() => setMode('dnf')}>
          DNF (1-es sorok)
        </button>
        <button type="button" className={`btn${mode === 'knf' ? ' on' : ''}`} onClick={() => setMode('knf')}>
          KNF (0-s sorok)
        </button>
      </div>
      <div className="tablewrap">
        <table className="tt">
          <thead>
            <tr>
              {names.map((x) => (
                <th key={x}>{x}</th>
              ))}
              <th className="sep main">A</th>
              <th className="sep">{mode === 'dnf' ? 'elemi konjunkció' : 'elemi diszjunkció'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const used = mode === 'dnf' ? out[i] : !out[i];
              return (
                <tr key={i} className={used ? 'model' : ''}>
                  {names.map((x) => (
                    <td key={x}>{r[x] ? 1 : 0}</td>
                  ))}
                  <td className="sep main">
                    <button type="button" className="cell" onClick={() => setOut(out.map((v, j) => (j === i ? !v : v)))} aria-label={`${i + 1}. sor értéke`}>
                      {out[i] ? 1 : 0}
                    </button>
                  </td>
                  <td className="sep" style={{ textAlign: 'left', color: used ? undefined : 'var(--axis)' }}>
                    {used ? (mode === 'dnf' ? conj(r, names) : disj(r, names)) : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="out">
        {mode === 'dnf' ? (
          <p>
            <b>DNF:</b>{' '}
            {ones.length ? (
              <span className="line">{dnf}</span>
            ) : (
              <span>nincs 1-es sor: a formula ellentmondás, DNF-je például {`${names[0]} ∧ ¬${names[0]}`}.</span>
            )}
          </p>
        ) : (
          <p>
            <b>KNF:</b>{' '}
            {zeros.length ? (
              <span className="line">{knf}</span>
            ) : (
              <span>nincs 0-s sor: a formula logikai törvény, KNF-je például {`${names[0]} ∨ ¬${names[0]}`}.</span>
            )}
          </p>
        )}
        <p className="note">
          {mode === 'dnf'
            ? 'Minden 1-es sor egy elemi konjunkció, ami pontosan abban a sorban igaz: az 1-es betű simán, a 0-s tagadva. Ezek vagyolása pontosan az 1-es sorokban igaz.'
            : 'Minden 0-s sor egy elemi diszjunkció, ami pontosan abban a sorban hamis: a 0-s betű simán, az 1-es tagadva. Ezek és-elése pontosan a 0-s sorokban hamis.'}
        </p>
      </div>
    </Bench>
  );
}
