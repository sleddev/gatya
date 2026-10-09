// A lesson: its <Kartya> children appear one by one. The furthest card reached is remembered per device.
import { Children, cloneElement, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { LessonCtx, storageGet, storageSet } from './lesson';
import { useDoc } from './theme';

export function Lecke({ children }: { children: ReactNode }) {
  const { id } = useDoc();
  const key = `gatya:lecke:${id}`;
  const cards = Children.toArray(children).filter(isValidElement) as ReactElement<{ index?: number }>[];
  const total = cards.length;
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const saved = storageGet(key);
    if (saved === 'kesz') {
      setDone(true);
      setCur(total - 1);
    } else if (saved) setCur(Math.min(total - 1, Math.max(0, Number(saved) || 0)));
  }, [key, total]);

  const next = () => {
    if (cur >= total - 1) {
      setDone(true);
      storageSet(key, 'kesz');
      return;
    }
    const n = cur + 1;
    setCur(n);
    storageSet(key, String(n));
  };

  const restart = () => {
    setCur(0);
    setDone(false);
    setShowAll(false);
    storageSet(key, '0');
    document.querySelector('.lesson')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shown = showAll || done ? total : cur + 1;
  const reached = done ? total : cur;

  return (
    <LessonCtx.Provider value={{ cur: done ? total : cur, total, showAll, next }}>
      <div className="lesson">
        <div className="lesson-bar" aria-label={`Haladás: ${reached} / ${total} kártya`}>
          <div className="lesson-track">
            {cards.map((_, i) => (
              <span key={i} className={i < reached ? 'done' : i === reached ? 'cur' : ''} />
            ))}
          </div>
          <span className="lesson-count">
            {Math.min(reached + (done ? 0 : 1), total)}/{total}
          </span>
          {!done ? (
            <button type="button" className="btn ghost small" onClick={() => setShowAll((s) => !s)} aria-pressed={showAll}>
              {showAll ? 'Csak a mostani' : 'Mutasd mind'}
            </button>
          ) : null}
        </div>
        {cards.slice(0, shown).map((c, i) => cloneElement(c, { key: i, index: i }))}
        {done ? (
          <div className="lesson-done">
            <div className="big" aria-hidden>
              ✓
            </div>
            <div>
              <b>Megvan ez a lecke!</b>
              <p>Ha holnap még egyszer átfutod a végén lévő összefoglalót, sokkal jobban megmarad.</p>
            </div>
            <button type="button" className="btn ghost small" onClick={restart}>
              Újrakezdem
            </button>
          </div>
        ) : null}
      </div>
    </LessonCtx.Provider>
  );
}
