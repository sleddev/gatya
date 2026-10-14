// Endless random drills for the routine DiMat / SzMV tasks (lnko, φ, hatvány maradéka, komplex
// műveletek, vektorok, deriválás, érintő, …). The streak counts first answers, as in <Gyakorlo>.
import { useEffect, useMemo, useState } from 'react';

import { DRILL_LABEL, makeDrill, type DrillKind } from '@/lib/drill';

import { CardProvider } from './lesson';
import { SzamValasz } from './SzamValasz';

export function MatekGyakorlo({ tipusok = ['lnko', 'maradek', 'phi', 'hatvanymod'] }: { tipusok?: DrillKind[] }) {
  const kinds = tipusok.filter((k) => k in DRILL_LABEL);
  const [kind, setKind] = useState<DrillKind>(kinds[0]);
  // fixed first seed so the pre-rendered HTML matches; a random one right after mounting
  const [seed, setSeed] = useState(1);
  useEffect(() => setSeed(Math.floor(Math.random() * 1e9)), []);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answered, setAnswered] = useState(false);
  const task = useMemo(() => makeDrill(kind, seed), [kind, seed]);

  const fresh = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setAnswered(false);
  };
  const score = (ok: boolean) => {
    if (answered) return;
    setAnswered(true);
    const s = ok ? streak + 1 : 0;
    setStreak(s);
    setBest((b) => Math.max(b, s));
  };

  return (
    <section className="bench drill">
      <div className="bench-h">
        <span className="tag">Gyakorló</span>
        <h4>Végtelen feladatsor</h4>
        <p>
          Sorozat: <b>{streak}</b> · legjobb: {best}. Minden feladat véletlen; papíron számolj, aztán írd be az eredményt.
        </p>
      </div>
      {kinds.length > 1 ? (
        <div className="row">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              className={`btn small${k === kind ? ' on' : ''}`}
              onClick={() => {
                setKind(k);
                fresh();
              }}>
              {DRILL_LABEL[k]}
            </button>
          ))}
        </div>
      ) : null}
      <CardProvider value={{ register: () => () => {}, solve: () => score(true), miss: () => score(false) }}>
        <SzamValasz
          key={`${kind}${seed}`}
          helyes={task.helyes}
          mezok={task.mezok}
          forma={task.forma}
          valtozok={task.valtozok}
          modulo={task.modulo}
          gombok={task.gombok}
          magyarazat={task.megoldas}>
          <span className="drill-q">{task.kerdes}</span>
        </SzamValasz>
      </CardProvider>
      <div className="row">
        <button type="button" className="btn on" onClick={fresh}>
          Új feladat →
        </button>
      </div>
    </section>
  );
}
