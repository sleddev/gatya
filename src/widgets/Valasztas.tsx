// Multiple choice with instant feedback. The question is the children (Markdown and math work there);
// `helyes` is one index (pick one) or a list of indices (pick all that apply, then check).
import { useState, type ReactNode } from 'react';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

export function Valasztas({
  children,
  valaszok,
  helyes,
  miert = [],
  magyarazat,
  sym,
}: {
  children?: ReactNode;
  valaszok: string[];
  helyes: number | number[];
  /** explanation for each option, shown when that option is picked */
  miert?: string[];
  magyarazat?: ReactNode;
  /** options are formulas: use the math font */
  sym?: boolean;
}) {
  const multi = Array.isArray(helyes);
  const right = new Set(Array.isArray(helyes) ? helyes : [helyes]);
  const ex = useExercise();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [last, setLast] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const done = ex.done;

  const pickOne = (i: number) => {
    if (done) return;
    setLast(i);
    setPicked((p) => new Set(p).add(i));
    if (right.has(i)) ex.solve();
    else ex.miss();
  };

  const toggle = (i: number) => {
    if (done) return;
    setChecked(false);
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const checkMulti = () => {
    setChecked(true);
    const ok = picked.size === right.size && [...picked].every((i) => right.has(i));
    if (ok) ex.solve();
    else ex.miss();
  };

  const cls = (i: number) => {
    if (multi) {
      if (done) return right.has(i) ? ' right' : picked.has(i) ? ' wrong' : '';
      return picked.has(i) ? ' on' : '';
    }
    if (done && right.has(i)) return ' right';
    return picked.has(i) && !right.has(i) ? ' wrong' : '';
  };

  const missing = multi && checked && !done ? [...right].filter((i) => !picked.has(i)).length : 0;
  const extra = multi && checked && !done ? [...picked].filter((i) => !right.has(i)) : [];

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      {multi ? <p className="note">Több jó válasz is lehet: jelöld be mindet, aztán ellenőrizd.</p> : null}
      <div className={`opts${sym ? ' sym' : ''}`}>
        {valaszok.map((v, i) => (
          <button key={i} type="button" className={`opt${cls(i)}`} onClick={() => (multi ? toggle(i) : pickOne(i))} aria-pressed={picked.has(i)}>
            {multi ? <span className="box" aria-hidden>{picked.has(i) ? '■' : '□'}</span> : null}
            <span>{v}</span>
          </button>
        ))}
      </div>
      {multi ? (
        <CheckBar ex={ex} onCheck={checkMulti} disabled={!picked.size} />
      ) : (
        <CheckBar ex={ex} />
      )}
      {!multi && last !== null && !right.has(last) && !done ? (
        <Feedback kind="no">{miert[last] ?? 'Nem ez. Gondold át még egyszer!'}</Feedback>
      ) : null}
      {multi && checked && !done ? (
        <Feedback kind="no">
          {extra.length ? (miert[extra[0]] ?? `A(z) „${valaszok[extra[0]]}” nem jó.`) : null}{' '}
          {missing ? `${extra.length ? 'És még ' : 'Még '}${missing} jó válasz hiányzik.` : null}
        </Feedback>
      ) : null}
      <DoneNote ex={ex}>{magyarazat ?? (!multi && last !== null && right.has(last) ? miert[last] : null)}</DoneNote>
    </div>
  );
}
