// Find an interpretation (truth values for the letters) where the formulas in `igaz` are true and the
// ones in `hamis` are false. Covers satisfiability (find a model), "not a law" (make it false) and
// consequence (premises true, conclusion false). With `lehetetlen`, no such interpretation exists and
// the right answer is the „Nincs ilyen” button.
import { useMemo, useState, type ReactNode } from 'react';

import { minimal } from '@/lib/course';
import { evaluate, parse, propVars, valuations, type Valuation } from '@/lib/logic';

import { DoneNote, Feedback, useExercise } from './lesson';

export function ModellKereso({
  igaz = [],
  hamis = [],
  children,
  nincs = true,
  magyarazat,
}: {
  igaz?: string[];
  hamis?: string[];
  children?: ReactNode;
  /** offer the „Nincs ilyen interpretáció” answer (default true) */
  nincs?: boolean;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const T = useMemo(() => igaz.map((s) => parse(s).ast), [igaz]);
  const F = useMemo(() => hamis.map((s) => parse(s).ast), [hamis]);
  const names = useMemo(() => {
    const v = new Set<string>();
    [...T, ...F].forEach((f) => propVars(f, v));
    return [...v].sort();
  }, [T, F]);
  const good = useMemo(
    () => valuations(names).rows.filter((r) => T.every((f) => evaluate(f, r)) && F.every((f) => !evaluate(f, r))),
    [names, T, F]
  );
  const possible = good.length > 0;
  const [v, setV] = useState<Valuation>(() => Object.fromEntries(names.map((n) => [n, false])));
  const [result, setResult] = useState<'none' | 'checked' | 'claimed'>('none');
  const [said, setSaid] = useState<'impossible' | null>(null);

  const shownV = ex.shown && possible ? good[0] : v;
  const ok = (f: (typeof T)[number], want: boolean) => evaluate(f, shownV) === want;
  const allOk = T.every((f) => ok(f, true)) && F.every((f) => ok(f, false));

  const check = () => {
    setResult('checked');
    setSaid(null);
    if (allOk) ex.solve();
    else ex.miss();
  };
  const claim = () => {
    setResult('claimed');
    setSaid('impossible');
    if (!possible) ex.solve();
    else ex.miss();
  };

  const showValues = result === 'checked' || ex.done;

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <div className="row">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            className={`btn sym toggle${shownV[n] ? ' on' : ''}`}
            disabled={ex.done}
            onClick={() => {
              setResult('none');
              setV((x) => ({ ...x, [n]: !x[n] }));
            }}>
            {n} = {shownV[n] ? 1 : 0}
          </button>
        ))}
      </div>
      <ul className="goals">
        {T.map((f, i) => (
          <li key={`t${i}`}>
            <span className="line">{minimal(f)}</span> <span className="want">legyen igaz</span>
            {showValues ? <Mark ok={ok(f, true)} value={evaluate(f, shownV)} /> : null}
          </li>
        ))}
        {F.map((f, i) => (
          <li key={`f${i}`}>
            <span className="line">{minimal(f)}</span> <span className="want">legyen hamis</span>
            {showValues ? <Mark ok={ok(f, false)} value={evaluate(f, shownV)} /> : null}
          </li>
        ))}
      </ul>
      {!ex.done ? (
        <div className="row">
          <button type="button" className="btn on" onClick={check}>
            Ellenőrzés
          </button>
          {nincs ? (
            <button type="button" className="btn" onClick={claim}>
              Nincs ilyen interpretáció
            </button>
          ) : null}
          {ex.wrong > 0 ? (
            <button type="button" className="btn ghost" onClick={ex.reveal}>
              Megmutatom a megoldást
            </button>
          ) : null}
        </div>
      ) : null}
      {!ex.done && result === 'checked' && !allOk ? (
        <Feedback kind="no">Ez az interpretáció nem jó: nézd meg, melyik feltétel nem teljesül, és próbálj másik értékeket.</Feedback>
      ) : null}
      {!ex.done && said === 'impossible' && possible ? (
        <Feedback kind="no">Pedig van ilyen interpretáció. Keress tovább: indulj ki abból, aminek hamisnak kell lennie, mert az a legszigorúbb.</Feedback>
      ) : null}
      <DoneNote ex={ex}>
        {possible
          ? ex.shown
            ? `Egy jó interpretáció: ${names.map((n) => `${n} = ${good[0][n] ? 1 : 0}`).join(', ')}. `
            : good.length > 1
              ? `(Összesen ${good.length} ilyen interpretáció van, bármelyik megfelel.) `
              : ''
          : 'Valóban nincs ilyen interpretáció: a 2^n lehetőség egyikében sem teljesül minden feltétel egyszerre. '}
        {magyarazat}
      </DoneNote>
    </div>
  );
}

function Mark({ ok, value }: { ok: boolean; value: boolean }) {
  return <span className={`chip ${ok ? 'ok' : 'no'}`}>{value ? 'igaz' : 'hamis'}</span>;
}
