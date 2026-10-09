// Equivalent transformations, one line at a time. Each new line must be equivalent to the previous one
// (checked with a truth table); the exercise is done when the goal is reached: KNF, DNF, an obviously
// valid A ∨ ¬A ∨ … form, or a given formula.
import { useMemo, useState, type ReactNode } from 'react';

import { isNormalForm, looseShape, minimal, normalFormProblem, normalFormSteps, obviouslyValid, propDifference } from '@/lib/course';
import { evaluate, parse, propVars, type Formula } from '@/lib/logic';

import { DoneNote, Feedback, useExercise } from './lesson';
import { FormulaInput, ParseErrorView } from './logic-ui';

const LAWS: [string, string][] = [
  ['A ⊃ B', '¬A ∨ B'],
  ['A ≡ B', '(A ⊃ B) ∧ (B ⊃ A)'],
  ['¬¬A', 'A'],
  ['¬(A ∧ B)', '¬A ∨ ¬B'],
  ['¬(A ∨ B)', '¬A ∧ ¬B'],
  ['A ∨ (B ∧ C)', '(A ∨ B) ∧ (A ∨ C)'],
  ['A ∧ (B ∨ C)', '(A ∧ B) ∨ (A ∧ C)'],
  ['A ∧ (B ∨ A)', 'A'],
  ['A ∨ (B ∧ A)', 'A'],
  ['A ⊃ B', '¬B ⊃ ¬A'],
  ['A ∧ B ⊃ C', 'A ⊃ (B ⊃ C)'],
  ['(A ∨ B) ⊃ C', '(A ⊃ C) ∧ (B ⊃ C)'],
];

type Goal = 'knf' | 'dnf' | 'torveny';

export function Atalakitas({
  kiindulo,
  cel,
  megoldas,
  children,
  magyarazat,
}: {
  kiindulo: string;
  /** knf, dnf, torveny (reach A ∨ ¬A ∨ …), or the formula to arrive at */
  cel: string;
  /** a model solution, one formula per step (for knf/dnf it is generated if missing) */
  megoldas?: string[];
  children?: ReactNode;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const start = useMemo(() => parse(kiindulo).ast, [kiindulo]);
  const goalF = useMemo(() => (['knf', 'dnf', 'torveny'].includes(cel) ? null : parse(cel).ast), [cel]);
  const [lines, setLines] = useState<Formula[]>([start]);
  const [src, setSrc] = useState('');
  const [msg, setMsg] = useState<ReactNode>(null);
  const allowed = useMemo(() => [...propVars(start)], [start]);

  const reached = (f: Formula) => {
    if (cel === 'knf' || cel === 'dnf') return isNormalForm(f, cel);
    if (cel === 'torveny') return obviouslyValid(f);
    return goalF ? looseShape(f) === looseShape(goalF) : false;
  };

  const solution = useMemo(() => {
    if (megoldas) return megoldas.map((s) => ({ law: '', f: parse(s).ast }));
    if (cel === 'knf' || cel === 'dnf') return normalFormSteps(start, cel);
    return [];
  }, [megoldas, cel, start]);

  const add = () => {
    let f: Formula;
    try {
      f = parse(src).ast;
    } catch (e) {
      setMsg(<ParseErrorView error={e} src={src} />);
      return;
    }
    const extra = [...propVars(f)].filter((v) => !allowed.includes(v));
    if (extra.length) {
      setMsg(<Feedback kind="no">Új betű jelent meg: {extra.join(', ')}. Átalakítás közben csak {allowed.join(', ')} szerepelhet.</Feedback>);
      return;
    }
    const prev = lines[lines.length - 1];
    const row = propDifference(prev, f);
    if (row) {
      ex.miss();
      const vals = Object.entries(row)
        .map(([k, v]) => `${k} = ${v ? 1 : 0}`)
        .join(', ');
      setMsg(
        <Feedback kind="no">
          Ez nem ekvivalens az előző sorral: ha {vals}, az előző sor {evaluate(prev, row) ? 1 : 0}, ez viszont {evaluate(f, row) ? 1 : 0}. Nézd meg a
          törvényeket lent!
        </Feedback>
      );
      return;
    }
    const next = [...lines, f];
    setLines(next);
    setSrc('');
    if (reached(f)) {
      setMsg(null);
      ex.solve();
      return;
    }
    const problem = cel === 'knf' || cel === 'dnf' ? normalFormProblem(f, cel) : null;
    setMsg(<Feedback kind="info">Ekvivalens, jó lépés! {problem ?? (cel === 'torveny' ? 'Addig alakítsd, amíg A ∨ ¬A ∨ … alakú nem lesz.' : 'Folytasd.')}</Feedback>);
  };

  const goalText: Record<Goal, string> = {
    knf: 'Cél: konjunktív normálforma (KNF), azaz literálokból álló vagyok és-elése.',
    dnf: 'Cél: diszjunktív normálforma (DNF), azaz literálokból álló és-ek vagyolása.',
    torveny: 'Cél: olyan alak, amelyben egy diszjunkció tagjai között szerepel valami és a tagadása is (A ∨ ¬A ∨ …). Ez nyilvánvalóan mindig igaz.',
  };

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <p className="note">{cel in goalText ? goalText[cel as Goal] : `Cél: ${goalF ? minimal(goalF) : cel}`}</p>
      <ol className="chain">
        {(ex.shown ? [start, ...solution.map((s) => s.f)] : lines).map((f, i) => (
          <li key={i}>
            <span className="eq" aria-hidden>
              {i ? '⇔' : ''}
            </span>
            <span className="line">{minimal(f)}</span>
            {ex.shown && i > 0 && solution[i - 1]?.law ? <span className="note"> · {solution[i - 1].law}</span> : null}
          </li>
        ))}
      </ol>
      {!ex.done ? (
        <>
          <FormulaInput value={src} onChange={setSrc} label="Következő sor" />
          <div className="row">
            <button type="button" className="btn on" onClick={add} disabled={!src.trim()}>
              Hozzáadom
            </button>
            <button type="button" className="btn" onClick={() => setSrc(minimal(lines[lines.length - 1]))}>
              Előző sor bemásolása
            </button>
            {lines.length > 1 ? (
              <button type="button" className="btn ghost" onClick={() => setLines((l) => l.slice(0, -1))}>
                Utolsó sor törlése
              </button>
            ) : null}
            {ex.wrong > 0 && solution.length ? (
              <button type="button" className="btn ghost" onClick={ex.reveal}>
                Megmutatom a megoldást
              </button>
            ) : null}
          </div>
          {msg}
          <details className="laws">
            <summary>Ekvivalencia-törvények</summary>
            <ul>
              {LAWS.map(([a, b], i) => (
                <li key={i} className="line">
                  {a} ⇔ {b}
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
      <DoneNote ex={ex}>{magyarazat}</DoneNote>
    </div>
  );
}
