// All possible situations ("worlds") of an argument, one card each. Tap a world to see which premises
// and whether the conclusion hold there; the task is to find a counterexample (premises all true,
// conclusion false) or to state that there is none, i.e. that the argument is valid.
import { useMemo, useState, type ReactNode } from 'react';

import { minimal } from '@/lib/course';
import { evaluate, parse, valuations, type Valuation } from '@/lib/logic';

import { DoneNote, Feedback, useExercise } from './lesson';

export function Vilagok({
  betuk,
  premisszak,
  konkluzio,
  mondatok,
  children,
  magyarazat,
}: {
  /** letter → [label when true, label when false], e.g. { e: ["🌧️ esik", "☀️ nem esik"] } */
  betuk: Record<string, [string, string]>;
  premisszak: string[];
  konkluzio: string;
  /** the argument in words: one sentence per premise, then the conclusion (shown instead of the formulas) */
  mondatok?: string[];
  children?: ReactNode;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const P = useMemo(() => premisszak.map((s) => parse(s).ast), [premisszak]);
  const K = useMemo(() => parse(konkluzio).ast, [konkluzio]);
  const letters = Object.keys(betuk);
  // the lecture order 00, 01, 10, 11 reads oddly for worlds; start from "everything true"
  const worlds = valuations(letters).rows.reverse();
  const counter = (w: Valuation) => P.every((f) => evaluate(f, w)) && !evaluate(K, w);
  const valid = !worlds.some(counter);
  const [seen, setSeen] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [msg, setMsg] = useState<ReactNode>(null);

  const labels = mondatok ?? [...P.map(minimal), minimal(K)];
  const open = (i: number) => {
    setSel(i);
    setMsg(null);
    if (!seen.includes(i)) setSeen([...seen, i]);
  };
  const pick = () => {
    if (sel === null) return;
    if (counter(worlds[sel])) {
      ex.solve();
      return;
    }
    ex.miss();
    const w = worlds[sel];
    const bad = P.findIndex((f) => !evaluate(f, w));
    setMsg(
      <Feedback kind="no">
        {bad >= 0
          ? `Ebben a világban nem minden premissza igaz (${mondatok ? `„${labels[bad]}”` : labels[bad]} hamis), így ez nem ellenpélda.`
          : 'Ebben a világban a konklúzió is igaz, így ez nem ellenpélda.'}
      </Feedback>
    );
  };
  const none = () => {
    setSel(null);
    if (valid) {
      ex.solve();
      return;
    }
    ex.miss();
    setMsg(<Feedback kind="no">Pedig van ellenpélda. Nézd meg sorban a világokat: keress olyat, ahol minden premissza ✓, a konklúzió ✗.</Feedback>);
  };

  const showAll = ex.done;
  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <ol className="argument">
        {labels.map((l, i) => (
          <li key={i} className={i === labels.length - 1 ? 'concl' : undefined}>
            <span className="arg-tag">{i === labels.length - 1 ? 'tehát' : `${i + 1}.`}</span>
            <span className={mondatok ? undefined : 'line'}>{l}</span>
          </li>
        ))}
      </ol>
      <p className="note" style={{ margin: 0 }}>
        {worlds.length} lehetséges világ van. Koppints rájuk, és nézd meg, mi igaz bennük. Van olyan, ahol minden premissza igaz, a konklúzió mégis
        hamis?
      </p>
      <div className="worlds">
        {worlds.map((w, i) => {
          const visible = showAll || seen.includes(i);
          const isCounter = counter(w);
          const cls = ['wcard', sel === i && !showAll ? 'sel' : '', showAll && isCounter ? 'counter' : '', showAll && !isCounter && P.every((f) => evaluate(f, w)) ? 'model' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <button key={i} type="button" className={cls} onClick={() => !ex.done && open(i)} aria-pressed={sel === i}>
              <span className="wcard-h">{i + 1}. világ</span>
              {letters.map((l) => (
                <span key={l} className="wfact">
                  {betuk[l][w[l] ? 0 : 1]}
                </span>
              ))}
              {visible ? (
                <span className="wvals">
                  {[...P, K].map((f, j) => {
                    const v = evaluate(f, w);
                    return (
                      <span key={j} className={v ? 't' : 'f'}>
                        {j === P.length ? 'K' : `P${j + 1}`} {v ? '✓' : '✗'}
                      </span>
                    );
                  })}
                </span>
              ) : (
                <span className="wvals hidden">?</span>
              )}
            </button>
          );
        })}
      </div>
      {!ex.done ? (
        <>
          <div className="row">
            <button type="button" className="btn on" disabled={sel === null} onClick={pick}>
              {sel === null ? 'Válassz egy világot' : `A(z) ${sel + 1}. világ ellenpélda`}
            </button>
            <button type="button" className="btn" onClick={none}>
              Nincs ellenpélda: helyes
            </button>
            {ex.wrong > 0 ? (
              <button type="button" className="btn ghost" onClick={ex.reveal}>
                Megmutatom a megoldást
              </button>
            ) : null}
          </div>
          {msg}
        </>
      ) : null}
      <DoneNote ex={ex}>
        {valid
          ? 'Egyik világban sem igaz minden premissza úgy, hogy a konklúzió hamis legyen (zöld: minden premissza igaz, és ott a konklúzió is). A következtetés helyes. '
          : `A pirossal jelölt világban minden premissza igaz, a konklúzió mégis hamis. Egyetlen ilyen világ elég: a következtetés nem helyes. `}
        {magyarazat}
      </DoneNote>
    </div>
  );
}
