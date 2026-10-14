// Pick the pairs of a relation on the A × B grid (rows: A, columns: B). Checked against `helyes`.
import { useState, type ReactNode } from 'react';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

type El = string | number;
const key = (a: El, b: El) => `${a}\u0000${b}`;
const pair = (a: El, b: El) => `(${a}, ${b})`.replace(/-/g, '−');

export function ParKijelolo({
  children,
  A,
  B,
  helyes,
  magyarazat,
}: {
  children?: ReactNode;
  A: El[];
  B: El[];
  /** the pairs of the relation */
  helyes: [El, El][];
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const want = new Set(helyes.map(([a, b]) => key(a, b)));
  const [on, setOn] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [msg, setMsg] = useState<ReactNode>(null);

  const toggle = (k: string) => {
    if (ex.done) return;
    setChecked(false);
    setMsg(null);
    setOn((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  const check = () => {
    setChecked(true);
    const extra = [...on].filter((k) => !want.has(k));
    const missing = [...want].filter((k) => !on.has(k));
    if (!extra.length && !missing.length) {
      setMsg(null);
      return ex.solve();
    }
    ex.miss();
    const ex0 = extra[0]?.split('\u0000');
    setMsg(
      <Feedback kind="no">
        {extra.length ? (
          <>
            A pirossal jelölt {extra.length === 1 ? 'pár' : `${extra.length} pár`} nem tartozik bele
            {ex0 ? (
              <>
                {' '}
                (például <span className="num">{pair(ex0[0], ex0[1])}</span>)
              </>
            ) : null}
            .{' '}
          </>
        ) : null}
        {missing.length ? `${extra.length ? 'És még' : 'Még'} ${missing.length} pár hiányzik.` : null}
      </Feedback>
    );
  };

  const state = (k: string) => {
    if (ex.shown) return want.has(k) ? ' on' : '';
    if (ex.ok) return on.has(k) ? ' on right' : '';
    if (on.has(k)) return checked && !want.has(k) ? ' on bad' : ' on';
    return '';
  };

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <div className="pairgrid-wrap">
        <table className="pairgrid">
          <thead>
            <tr>
              <th className="corner">
                <span>A</span>
                <span>B</span>
              </th>
              {B.map((b) => (
                <th key={String(b)}>{String(b).replace(/-/g, '−')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {A.map((a) => (
              <tr key={String(a)}>
                <th>{String(a).replace(/-/g, '−')}</th>
                {B.map((b) => {
                  const k = key(a, b);
                  return (
                    <td key={String(b)}>
                      <button type="button" className={`paircell${state(k)}`} aria-pressed={on.has(k)} aria-label={pair(a, b)} onClick={() => toggle(k)}>
                        {pair(a, b)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!ex.done ? <p className="note">Koppints a relációba tartozó párokra (kijelölve: {on.size}).</p> : null}
      <CheckBar ex={ex} onCheck={check} />
      {!ex.done ? msg : null}
      <DoneNote ex={ex}>
        {ex.shown ? (
          <span className="num">
            {'{'}
            {helyes.map(([a, b]) => pair(a, b)).join(', ')}
            {'}'}.{' '}
          </span>
        ) : null}
        {magyarazat}
      </DoneNote>
    </div>
  );
}
