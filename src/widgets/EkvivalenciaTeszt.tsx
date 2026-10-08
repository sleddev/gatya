import { useState } from 'react';

import { evaluate, parse, propVars, show, valuations, type Formula } from '@/lib/logic';

import { b01, ParseErrorView } from './logic-ui';
import { Bench, Chip } from './ui';

const PRESETS: [string, string, string][] = [
  ['De Morgan 1', '¬(p ∧ q)', '¬p ∨ ¬q'],
  ['De Morgan 2', '¬(p ∨ q)', '¬p ∧ ¬q'],
  ['kontrapozíció', 'p ⊃ q', '¬q ⊃ ¬p'],
  ['⊃ definíciója', 'p ⊃ q', '¬(p ∧ ¬q)'],
  ['⊃ mint ∨', 'p ⊃ q', '¬p ∨ q'],
  ['disztributivitás', 'p ∨ (q ∧ r)', '(p ∨ q) ∧ (p ∨ r)'],
  ['elnyelés', 'p ∧ (q ∨ p)', 'p'],
  ['kettős tagadás', '¬¬p', 'p'],
  ['≡ kibontva', 'p ≡ q', '(p ⊃ q) ∧ (q ⊃ p)'],
  ['✗ megfordítás', 'p ⊃ q', 'q ⊃ p'],
  ['✗ rossz disztributivitás', 'p ∨ (q ∧ r)', '(p ∨ q) ∧ r'],
  ['✗ ⊃ nem asszociatív', '(p ⊃ q) ⊃ r', 'p ⊃ (q ⊃ r)'],
];

/** Are A and B logically equivalent? Compares their truth tables row by row. */
export function EkvivalenciaTeszt({ a = '¬(p ∧ q)', b = '¬p ∨ ¬q', peldak = true }: { a?: string; b?: string; peldak?: boolean }) {
  const [sa, setSa] = useState(a);
  const [sb, setSb] = useState(b);
  let A: Formula | null = null,
    B: Formula | null = null;
  let error: { e: unknown; src: string } | null = null;
  try {
    A = parse(sa).ast;
  } catch (e) {
    error = { e, src: sa };
  }
  if (!error)
    try {
      B = parse(sb).ast;
    } catch (e) {
      error = { e, src: sb };
    }
  const vars = new Set<string>();
  if (A && B) {
    propVars(A, vars);
    propVars(B, vars);
  }
  const ok = A && B && vars.size <= 6;
  const { names, rows } = valuations(vars);
  const table = ok ? rows.map((r) => ({ r, a: evaluate(A!, r), b: evaluate(B!, r) })) : [];
  const diff = table.filter((x) => x.a !== x.b).length;
  return (
    <Bench title="Ekvivalencia-teszt" hint="Tölts be egy törvényt, vagy írj be saját párt. A piros sorokban különbözik a két oldal értéke.">
      {peldak ? (
        <div className="row">
          {PRESETS.map(([t, x, y]) => (
            <button
              key={t}
              type="button"
              className="btn"
              onClick={() => {
                setSa(x);
                setSb(y);
              }}>
              {t}
            </button>
          ))}
        </div>
      ) : null}
      <div className="cols">
        <label className="f">
          A
          <input type="text" className="formula" value={sa} onChange={(e) => setSa(e.target.value)} spellCheck={false} />
        </label>
        <label className="f">
          B
          <input type="text" className="formula" value={sb} onChange={(e) => setSb(e.target.value)} spellCheck={false} />
        </label>
      </div>
      {error ? <ParseErrorView error={error.e} src={error.src} /> : null}
      {A && B && vars.size > 6 ? <p className="err">Legfeljebb 6 különböző betűt használj.</p> : null}
      {ok ? (
        <>
          <p>
            {diff ? (
              <>
                <Chip kind="no">nem ekvivalensek</Chip> {diff} sorban különböznek, tehát A ≡ B nem logikai törvény.
              </>
            ) : (
              <>
                <Chip kind="ok">A ⇔ B</Chip> Minden sorban egyenlők, tehát ⊨ A ≡ B (az utolsó oszlop csupa 1).
              </>
            )}
          </p>
          <div className="tablewrap">
            <table className="tt">
              <thead>
                <tr>
                  {names.map((n) => (
                    <th key={n}>{n}</th>
                  ))}
                  <th className="sep main">{show(A!)}</th>
                  <th className="main">{show(B!)}</th>
                  <th className="sep">A ≡ B</th>
                </tr>
              </thead>
              <tbody>
                {table.map((x, i) => (
                  <tr key={i} className={x.a !== x.b ? 'counter' : ''}>
                    {names.map((n) => (
                      <td key={n}>{b01(x.r[n])}</td>
                    ))}
                    <td className="sep">{b01(x.a)}</td>
                    <td>{b01(x.b)}</td>
                    <td className="sep">{b01(x.a === x.b)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </Bench>
  );
}
