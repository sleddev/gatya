// Type a number (or several) as the answer. Checked by value, so 7/3, 2,333… (with `tures`) and
// 14/6 are all fine; with `valtozok` the answer is an expression (9x − 15) compared as a function.
// `forma="halmaz"` takes a list in any order; `modulo` accepts anything congruent to the answer.
import { useRef, useState, type ReactNode } from 'react';

import { compareSets, compile, ExprError, sameValue } from '@/lib/expr';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';
import { insertAtCaret } from './ui';

type Forma = 'mezok' | 'vektor' | 'halmaz';

export function SzamValasz({
  children,
  helyes,
  mezok,
  forma = 'mezok',
  valtozok = [],
  tures,
  modulo,
  hibak = {},
  tipp,
  magyarazat,
  gombok,
  egyseg,
}: {
  children?: ReactNode;
  /** the answer; a list for several boxes. For `halmaz`: the elements, comma-separated */
  helyes: string | string[];
  /** a label in front of each box, e.g. ["q =", "r ="] */
  mezok?: string[];
  forma?: Forma;
  /** letters allowed in the answer (it is then compared as a function of them) */
  valtozok?: string[];
  /** allowed relative error, e.g. 0.005 for a rounded decimal */
  tures?: number;
  /** accept any number congruent to the answer modulo this */
  modulo?: number;
  /** typical wrong answers → what went wrong; several boxes: values joined with ";" */
  hibak?: Record<string, string>;
  tipp?: ReactNode;
  magyarazat?: ReactNode;
  /** extra symbol buttons (√, π, i, x, …) */
  gombok?: string[];
  /** unit after the box, e.g. "°" */
  egyseg?: string;
}) {
  const want = Array.isArray(helyes) ? helyes : [helyes];
  const n = forma === 'halmaz' ? 1 : want.length;
  const ex = useExercise();
  const [vals, setVals] = useState<string[]>(() => Array(n).fill(''));
  const [bad, setBad] = useState<boolean[]>(() => Array(n).fill(false));
  const [msg, setMsg] = useState<ReactNode>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focus, setFocus] = useState(0);

  const set = (i: number, v: string) => {
    setVals((old) => old.map((x, j) => (j === i ? v : x)));
    setBad((old) => old.map((x, j) => (j === i ? false : x)));
  };

  const no = (text: ReactNode) => {
    ex.miss();
    setMsg(<Feedback kind="no">{text}</Feedback>);
  };

  const check = () => {
    if (forma === 'halmaz') {
      let d;
      try {
        d = compareSets(vals[0], want[0]);
      } catch (e) {
        return no(e instanceof ExprError ? e.message : 'Ezt nem tudom értelmezni.');
      }
      if (d.ok) {
        setMsg(null);
        return ex.solve();
      }
      const parts: string[] = [];
      if (d.extra.length) parts.push(`Nem eleme: ${d.extra.join(', ')}.`);
      if (d.missing) parts.push(d.missing === 1 ? 'Még egy elem hiányzik.' : `Még ${d.missing} elem hiányzik.`);
      const known = Object.entries(hibak).find(([k]) => {
        try {
          return compareSets(vals[0], k).ok;
        } catch {
          return false;
        }
      });
      return no(known ? known[1] : parts.join(' '));
    }

    const opts = { vars: valtozok, tol: tures, modulo };
    const res: boolean[] = [];
    for (let i = 0; i < n; i++) {
      try {
        compile(vals[i], valtozok);
      } catch (e) {
        setBad((old) => old.map((x, j) => (j === i ? true : x)));
        const where = n > 1 ? `${(mezok?.[i] ?? `${i + 1}. mező`).replace(/\s*=\s*$/, '')}: ` : '';
        setMsg(<Feedback kind="no">{where + (e instanceof ExprError ? e.message : 'Ezt nem tudom értelmezni.')}</Feedback>);
        return;
      }
      res.push(sameValue(vals[i], want[i], opts));
    }
    setBad(res.map((r) => !r));
    if (res.every(Boolean)) {
      setMsg(null);
      return ex.solve();
    }
    const known = Object.entries(hibak).find(([k]) => {
      const ks = k.split(';');
      if (ks.length !== n) return false;
      try {
        return ks.every((kv, i) => sameValue(vals[i], kv, opts));
      } catch {
        return false;
      }
    });
    if (known) return no(known[1]);
    if (n > 1) {
      const right = res.filter(Boolean).length;
      return no(right ? `${right} jó, ${n - right} még nem. A pirossal jelölt mezőt nézd át!` : 'Egyik sem jó még. Számold újra!');
    }
    return no('Nem ennyi. Számold újra!');
  };

  const syms = gombok ?? (valtozok.length ? [...valtozok, '^', '√'] : []);

  const shown = forma === 'halmaz' ? `{${want[0]}}`.replace('{}', '∅') : want;
  const solution =
    forma === 'halmaz' ? (
      <span className="num">{shown as string}</span>
    ) : forma === 'vektor' ? (
      <span className="num">({want.join('; ')})</span>
    ) : (
      want.map((w, i) => (
        <span key={i} className="num">
          {i ? ', ' : ''}
          {mezok?.[i] ? `${mezok[i]} ` : ''}
          {w}
          {egyseg ?? ''}
        </span>
      ))
    );

  const input = (i: number) => (
    <input
      key={i}
      ref={(el) => {
        refs.current[i] = el;
      }}
      type="text"
      // not "decimal": phone number pads have no "/" and (on iOS) no "−", so 7/3 or −4 couldn't be typed
      inputMode="text"
      className={`numin${bad[i] ? ' bad' : ''}${forma === 'halmaz' ? ' wide' : ''}`}
      aria-label={mezok?.[i] ?? 'Válasz'}
      value={vals[i]}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      onFocus={() => setFocus(i)}
      onChange={(e) => set(i, e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && vals.every((v) => v.trim() || forma === 'halmaz')) check();
      }}
    />
  );

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      {ex.done ? (
        <div className="answer num-answer">{ex.ok && forma !== 'halmaz' ? solutionFromInput(vals, mezok, forma, egyseg) : solution}</div>
      ) : (
        <>
          {syms.length ? (
            <div className="row">
              {syms.map((s) => (
                <button key={s} type="button" className="btn sym" onClick={() => insertAtCaret(refs.current[focus] ?? null, s, (v) => set(focus, v))}>
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <div className={`numrow${forma === 'vektor' ? ' vec' : ''}`}>
            {forma === 'vektor' ? <span className="paren">(</span> : null}
            {Array.from({ length: n }, (_, i) => (
              <span key={i} className="numf">
                {mezok?.[i] && forma !== 'vektor' ? <span className="numl">{mezok[i]}</span> : null}
                {input(i)}
                {egyseg ? <span className="numl">{egyseg}</span> : null}
                {forma === 'vektor' && i < n - 1 ? <span className="paren">;</span> : null}
              </span>
            ))}
            {forma === 'vektor' ? <span className="paren">)</span> : null}
          </div>
          {forma === 'halmaz' ? <p className="note">Az elemeket vesszővel válaszd el; a sorrend nem számít. Üres halmaz: ∅ vagy „nincs”.</p> : null}
          <CheckBar ex={ex} onCheck={check} disabled={forma !== 'halmaz' && vals.some((v) => !v.trim())} />
        </>
      )}
      {!ex.done ? msg : null}
      {!ex.done && ex.wrong > 0 && tipp ? <Feedback kind="info">{tipp}</Feedback> : null}
      <DoneNote ex={ex}>
        {ex.shown ? <>{solution}. </> : null}
        {magyarazat}
      </DoneNote>
    </div>
  );
}

function solutionFromInput(vals: string[], mezok: string[] | undefined, forma: Forma, egyseg?: string) {
  if (forma === 'vektor') return <span className="num">({vals.map((v) => v.trim()).join('; ')})</span>;
  return vals.map((v, i) => (
    <span key={i} className="num">
      {i ? ', ' : ''}
      {mezok?.[i] ? `${mezok[i]} ` : ''}
      {v.trim()}
      {egyseg ?? ''}
    </span>
  ));
}
