import { useState } from 'react';

import { useExercise } from './lesson';
import { Bench } from './ui';

type Item = { kerdes: string; helyes: number; miert?: string };

/** A list of items to classify into one of the given categories. Inside a lesson card it counts as an exercise. */
export function Besorolo({
  cim = 'Sorold be!',
  utmutato,
  opciok,
  elemek,
}: {
  cim?: string;
  utmutato?: string;
  opciok: string[];
  elemek: Item[];
}) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  const ex = useExercise();
  const pick = (i: number, j: number) => {
    const next = { ...picks, [i]: j };
    setPicks(next);
    if (j !== elemek[i].helyes) ex.miss();
    else if (elemek.every((e, k) => next[k] === e.helyes)) ex.solve();
  };
  const done = Object.keys(picks).length;
  const right = elemek.filter((e, i) => picks[i] === e.helyes).length;
  return (
    <Bench title={cim} hint={utmutato ?? 'Válassz minden sorban; a magyarázat a választás után jelenik meg.'}>
      <div className="quiz">
        {elemek.map((e, i) => {
          const p = picks[i];
          return (
            <div className="qi" key={i}>
              <div className="q" style={{ fontFamily: 'var(--math)', fontSize: '1.05rem' }}>
                {e.kerdes}
              </div>
              <div className="opts">
                {opciok.map((o, j) => (
                  <button
                    key={j}
                    type="button"
                    className={`btn${p === undefined ? '' : j === e.helyes ? ' right' : p === j ? ' wrong' : ''}`}
                    onClick={() => pick(i, j)}>
                    {o}
                  </button>
                ))}
              </div>
              {p !== undefined ? (
                <div className="why">
                  {p === e.helyes ? <span className="chip ok">helyes</span> : <span className="chip no">a válasz: {opciok[e.helyes]}</span>}{' '}
                  {e.miert}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {done ? (
        <p className="note">
          {right} / {elemek.length} helyes{done < elemek.length ? ` (${elemek.length - done} még hátra)` : ''}.
        </p>
      ) : null}
    </Bench>
  );
}
