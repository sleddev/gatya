// One card of a <Lecke>: a short idea plus (usually) an exercise. „Tovább” unlocks when the exercises are solved.
import { useContext, type ReactNode } from 'react';

import { CardProvider, LessonCtx, useCardState, useScrollIntoView } from './lesson';

export function Kartya({ cim, index = 0, children }: { cim?: string; index?: number; children: ReactNode }) {
  const lesson = useContext(LessonCtx);
  const { api, open, total } = useCardState();
  const active = !!lesson && !lesson.showAll && index === lesson.cur;
  const ref = useScrollIntoView<HTMLElement>(!!lesson && index > 0 && index === lesson.cur && !lesson.showAll);
  const last = !!lesson && index === lesson.total - 1;

  return (
    <CardProvider value={api}>
      <section ref={ref} className={`card${active ? ' active' : ''}`}>
        {cim ? (
          <div className="card-h">
            {lesson ? <span className="card-n">{index + 1}</span> : null}
            <h3>{cim}</h3>
          </div>
        ) : null}
        <div className="card-body">{children}</div>
        {active ? (
          <div className="card-foot">
            {open > 0 ? (
              <span className="note">
                {total > 1 ? `Még ${open} feladat van hátra ezen a kártyán.` : 'Oldd meg a feladatot a továbblépéshez.'}
              </span>
            ) : (
              <span />
            )}
            <button type="button" className="btn on next" disabled={open > 0} onClick={lesson.next}>
              {last ? 'Befejezem' : 'Tovább'}
            </button>
          </div>
        ) : null}
      </section>
    </CardProvider>
  );
}
