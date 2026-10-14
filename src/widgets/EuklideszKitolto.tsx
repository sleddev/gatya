// Run the Euclidean algorithm by hand: each row a = b · q + r is typed in (q and r), the next row
// shifts left, and at the end the last non-zero remainder is the lnko.
import { useState, type ReactNode } from 'react';

import { compile } from '@/lib/expr';
import { euclid } from '@/lib/numbers';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

const asInt = (s: string): number | null => {
  try {
    const v = compile(s).eval();
    return Math.abs(v.im) < 1e-9 && Number.isInteger(v.re) ? v.re : null;
  } catch {
    return null;
  }
};

export function EuklideszKitolto({ children, a, b, magyarazat }: { children?: ReactNode; a: number; b: number; magyarazat?: ReactNode }) {
  const ex = useExercise();
  const e = euclid(a, b);
  const steps = e.steps;
  const [row, setRow] = useState(0);
  const [q, setQ] = useState('');
  const [r, setR] = useState('');
  const [g, setG] = useState('');
  const [msg, setMsg] = useState<ReactNode>(null);
  const atEnd = row >= steps.length;
  const done = ex.done;
  const visible = done ? steps.length : row;

  const no = (t: ReactNode) => {
    ex.miss();
    setMsg(<Feedback kind="no">{t}</Feedback>);
  };

  const checkRow = () => {
    const s = steps[row];
    const qq = asInt(q);
    const rr = asInt(r);
    if (qq === null || rr === null) return no('Egész számokat írj a két mezőbe.');
    if (qq === s.q && rr === s.r) {
      setMsg(null);
      setQ('');
      setR('');
      setRow(row + 1);
      return;
    }
    if (s.b * qq + rr !== s.a) return no(`Nem stimmel: ${s.b} · ${qq} + ${rr} = ${s.b * qq + rr}, nem ${s.a}.`);
    if (rr < 0) return no('Az egyenlőség igaz, de a maradék nem lehet negatív.');
    return no(`Az egyenlőség igaz, de a maradéknak kisebbnek kell lennie, mint ${s.b}. Belefér még egy ${s.b}-es.`);
  };

  const checkG = () => {
    const gg = asInt(g);
    if (gg === e.g) {
      setMsg(null);
      return ex.solve();
    }
    if (gg === 0) return no('A nulla maradék csak jelzi, hogy vége. Az utolsó nem nulla maradék kell.');
    return no('Nem ez. Az lnko az utolsó nem nulla maradék.');
  };

  const line = (i: number) => {
    const s = steps[i];
    return (
      <div key={i} className="eu-row">
        <span>{s.a}</span> = <span>{s.b}</span> · <b>{s.q}</b> + <b className={s.r === 0 ? 'zero' : i === steps.length - 2 || (steps.length === 1 && i === 0) ? 'last' : ''}>{s.r}</b>
      </div>
    );
  };

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <div className="eu">
        {Array.from({ length: visible }, (_, i) => line(i))}
        {!done && !atEnd ? (
          <div className="eu-row cur">
            <span>{steps[row].a}</span> = <span>{steps[row].b}</span> ·{' '}
            <input className="numin small" aria-label="hányados" inputMode="numeric" value={q} onChange={(ev) => setQ(ev.target.value)} /> +{' '}
            <input
              className="numin small"
              aria-label="maradék"
              inputMode="numeric"
              value={r}
              onChange={(ev) => setR(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' && q.trim() && r.trim()) checkRow();
              }}
            />
          </div>
        ) : null}
      </div>
      {!done && atEnd ? (
        <div className="numrow">
          <span className="numf">
            <span className="numl">
              ({a}, {b}) =
            </span>
            <input className="numin" aria-label="lnko" inputMode="numeric" value={g} onChange={(ev) => setG(ev.target.value)} />
          </span>
        </div>
      ) : null}
      {!done ? (
        <p className="note">{atEnd ? 'A maradék 0 lett: kész az algoritmus. Mennyi a legnagyobb közös osztó?' : `${row + 1}. sor: hányados és maradék.`}</p>
      ) : null}
      <CheckBar ex={ex} onCheck={atEnd ? checkG : checkRow} disabled={atEnd ? !g.trim() : !q.trim() || !r.trim()} />
      {!done ? msg : null}
      <DoneNote ex={ex}>
        {`(${a}, ${b}) = ${e.g}. `}
        {magyarazat}
      </DoneNote>
    </div>
  );
}
