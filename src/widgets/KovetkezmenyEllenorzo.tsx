import { useState } from 'react';

import { consequence, parse, show, type Formula } from '@/lib/logic';

import { b01, ParseErrorView } from './logic-ui';
import { Bench, Chip } from './ui';

type Preset = { cim: string; premisszak: string[]; kovetkezmeny: string };

const PRESETS: Preset[] = [
  { cim: 'modus ponens', premisszak: ['p ⊃ q', 'p'], kovetkezmeny: 'q' },
  { cim: 'modus tollens', premisszak: ['p ⊃ q', '¬q'], kovetkezmeny: '¬p' },
  { cim: 'láncszabály', premisszak: ['p ⊃ q', 'q ⊃ r'], kovetkezmeny: 'p ⊃ r' },
  { cim: 'reductio ad absurdum', premisszak: ['p ⊃ q', 'p ⊃ ¬q'], kovetkezmeny: '¬p' },
  { cim: 'diszjunktív szillogizmus', premisszak: ['p ∨ q', '¬p'], kovetkezmeny: 'q' },
  { cim: '✗ Feri fordítva', premisszak: ['p ⊃ q', 'q'], kovetkezmeny: 'p' },
  { cim: '✗ az előtag tagadása', premisszak: ['p ⊃ q', '¬p'], kovetkezmeny: '¬q' },
  { cim: '⊨ A (üres Γ)', premisszak: [], kovetkezmeny: 'p ∨ ¬p' },
];

/** Γ ⊨ A by truth table, highlighting the models of Γ and any countermodel. */
export function KovetkezmenyEllenorzo({
  premisszak = ['p ⊃ q', 'p'],
  kovetkezmeny = 'q',
  peldak = true,
}: {
  premisszak?: string[];
  kovetkezmeny?: string;
  peldak?: boolean;
}) {
  const [prem, setPrem] = useState(premisszak.join('\n'));
  const [conc, setConc] = useState(kovetkezmeny);
  const lines = prem
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  let premises: Formula[] = [];
  let conclusion: Formula | null = null;
  let error: { e: unknown; src: string } | null = null;
  for (const l of lines) {
    try {
      premises.push(parse(l).ast);
    } catch (e) {
      error = { e, src: l };
      break;
    }
  }
  if (!error)
    try {
      conclusion = parse(conc).ast;
    } catch (e) {
      error = { e, src: conc };
    }
  if (error) premises = [];
  const res = conclusion && !error ? consequence(premises, conclusion) : null;
  const tooMany = res && res.names.length > 6;
  const G = premises.length ? `{${premises.map(show).join(', ')}}` : '∅';
  const counters = res ? res.table.filter((r) => r.counter).length : 0;

  return (
    <Bench
      title="Következmény-ellenőrző"
      hint="Soronként egy premissza. Zöld sor: Γ modellje. Piros sor: ellenpélda (minden premissza igaz, a következmény hamis). Egyetlen piros sor elég ahhoz, hogy Γ ⊭ A.">
      {peldak ? (
        <div className="row">
          <span className="note">Betöltés:</span>
          {PRESETS.map((p) => (
            <button
              key={p.cim}
              type="button"
              className="btn"
              onClick={() => {
                setPrem(p.premisszak.join('\n'));
                setConc(p.kovetkezmeny);
              }}>
              {p.cim}
            </button>
          ))}
        </div>
      ) : null}
      <div className="cols">
        <label className="f">
          Premisszák Γ (soronként egy)
          <textarea rows={4} value={prem} onChange={(e) => setPrem(e.target.value)} spellCheck={false} />
        </label>
        <label className="f">
          Következmény A
          <input type="text" className="formula" value={conc} onChange={(e) => setConc(e.target.value)} spellCheck={false} />
        </label>
      </div>
      {error ? <ParseErrorView error={error.e} src={error.src} /> : null}
      {tooMany ? <p className="err">Legfeljebb 6 különböző betűt használj.</p> : null}
      {res && !tooMany ? (
        <>
          {res.holds ? (
            <p>
              <Chip kind="ok">
                {G} ⊨ {show(conclusion!)}
              </Chip>{' '}
              Γ mind a(z) {res.models} modelljében (zöld sorok) igaz a következmény is. Ugyanez másképp: Γ ∪ {'{¬A}'} kielégíthetetlen, és a
              dedukciótétel szerint ⊨ {premises.length ? `(${premises.map(show).join(' ∧ ')}) ⊃ ` : ''}
              {show(conclusion!)}.
              {res.models === 0 && premises.length ? (
                <span className="note"> Γ-nak egyáltalán nincs modellje, ezért belőle bármi következik.</span>
              ) : null}
            </p>
          ) : (
            <p>
              <Chip kind="no">
                {G} ⊭ {show(conclusion!)}
              </Chip>{' '}
              {counters} ellenpélda-sor (piros): minden premissza igaz, a következmény hamis. Tehát Γ ∪ {'{¬A}'} kielégíthető.
            </p>
          )}
          <div className="tablewrap">
            <table className="tt">
              <thead>
                <tr>
                  {res.names.map((n) => (
                    <th key={n}>{n}</th>
                  ))}
                  {premises.map((p, i) => (
                    <th key={i} className={i === 0 ? 'sep' : ''}>
                      {show(p)}
                    </th>
                  ))}
                  <th className="sep main">{show(conclusion!)}</th>
                </tr>
              </thead>
              <tbody>
                {res.table.map((r, i) => (
                  <tr key={i} className={r.model ? (r.counter ? 'counter' : 'model') : ''}>
                    {res.names.map((n) => (
                      <td key={n}>{b01(r.v[n])}</td>
                    ))}
                    {r.premises.map((x, j) => (
                      <td key={j} className={j === 0 ? 'sep' : ''}>
                        {b01(x)}
                      </td>
                    ))}
                    <td className="sep main">{b01(r.conclusion)}</td>
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
