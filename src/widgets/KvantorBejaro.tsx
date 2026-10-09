// A one-place predicate over a small universe you can edit, with ∀x P(x) written out as a big ∧ and
// ∃x P(x) as a big ∨ over the elements. The counterexample (for ∀) and the witness (for ∃) are marked.
// With `cel`, it is an exercise: set the predicate so that ∀ and ∃ get the given values.
import { useState, type ReactNode } from 'react';

import { DoneNote, Feedback, useExercise } from './lesson';
import { Bench } from './ui';

export function KvantorBejaro({
  elemek,
  pred,
  leiras,
  kezdo = [],
  cel,
  children,
  magyarazat,
}: {
  /** the universe, e.g. ["🐱 Cirmi", "🐶 Bodri"]; the first word is the icon */
  elemek: string[];
  pred: string;
  /** what the predicate means, e.g. "x alszik" */
  leiras?: string;
  /** elements (by label) in the predicate at the start */
  kezdo?: string[];
  /** [value of ∀x P(x), value of ∃x P(x)] to reach */
  cel?: [boolean, boolean];
  children?: ReactNode;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const [inP, setInP] = useState<boolean[]>(() => elemek.map((e) => kezdo.includes(e)));
  const [said, setSaid] = useState<string | null>(null);
  const name = (e: string) => e.split(' ').slice(1).join(' ') || e;
  const icon = (e: string) => (e.includes(' ') ? e.split(' ')[0] : '');
  const all = inP.every(Boolean);
  const some = inP.some(Boolean);
  const cex = inP.indexOf(false);
  const wit = inP.indexOf(true);
  const impossible = !!cel && cel[0] && !cel[1];

  const toggle = (i: number) => {
    if (ex.done) return;
    const next = inP.map((v, j) => (j === i ? !v : v));
    setInP(next);
    setSaid(null);
    if (cel && !impossible && next.every(Boolean) === cel[0] && next.some(Boolean) === cel[1]) ex.solve();
  };
  const claim = () => {
    if (impossible) ex.solve();
    else {
      ex.miss();
      setSaid('Lehetséges: kapcsolgasd az elemeket!');
    }
  };

  const term = (i: number) => `${pred}(${name(elemek[i])})`;
  const val = (b: boolean) => (b ? '1' : '0');

  const body = (
    <>
      {children ? <div className="ex-q">{children}</div> : null}
      {leiras ? (
        <p className="note" style={{ margin: 0 }}>
          U = {'{'}
          {elemek.map(name).join(', ')}
          {'}'}, {pred}(x): „{leiras}”. Koppints az elemekre!
        </p>
      ) : null}
      <div className="elems">
        {elemek.map((e, i) => (
          <button
            key={e}
            type="button"
            className={`elem${inP[i] ? ' in' : ''}${!all && i === cex ? ' cex' : ''}${some && i === wit ? ' wit' : ''}`}
            aria-pressed={inP[i]}
            onClick={() => toggle(i)}>
            <span className="elem-ic" aria-hidden>
              {icon(e)}
            </span>
            <span>{name(e)}</span>
            <span className="elem-v">{inP[i] ? pred : `¬${pred}`}</span>
          </button>
        ))}
      </div>
      <div className="qrows">
        <div className="qrow">
          <span className="line">∀x {pred}(x)</span>
          <span className="qexp">
            = {elemek.map((_, i) => term(i)).join(' ∧ ')}
            <br />= {inP.map(val).join(' ∧ ')}
          </span>
          <span className={`chip ${all ? 'ok' : 'no'}`}>{all ? 'igaz' : 'hamis'}</span>
          <span className="note">{all ? 'mindegyik elemre igaz' : `ellenpélda: ${name(elemek[cex])}`}</span>
        </div>
        <div className="qrow">
          <span className="line">∃x {pred}(x)</span>
          <span className="qexp">
            = {elemek.map((_, i) => term(i)).join(' ∨ ')}
            <br />= {inP.map(val).join(' ∨ ')}
          </span>
          <span className={`chip ${some ? 'ok' : 'no'}`}>{some ? 'igaz' : 'hamis'}</span>
          <span className="note">{some ? `tanú: ${name(elemek[wit])}` : 'egyik elemre sem igaz'}</span>
        </div>
      </div>
      {cel && !ex.done ? (
        <div className="row">
          <button type="button" className="btn" onClick={claim}>
            Ez lehetetlen
          </button>
        </div>
      ) : null}
      {said && !ex.done ? <Feedback kind="no">{said}</Feedback> : null}
      {cel ? <DoneNote ex={ex}>{magyarazat}</DoneNote> : null}
    </>
  );
  return cel ? (
    <div className="ex">{body}</div>
  ) : (
    <Bench title="A ∀ egy nagy „és”, az ∃ egy nagy „vagy”" hint="Kapcsold be és ki az elemeket, és figyeld, mikor változik a két kvantoros formula értéke.">
      {body}
    </Bench>
  );
}
