// Mark every variable occurrence free (szabad) or bound (kötött). Afterwards each bound occurrence
// gets the colour of the quantifier that binds it.
import { useMemo, useState, type ReactNode } from 'react';

import { analyseFirstOrder, parse } from '@/lib/logic';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

type Mark = 'sz' | 'k' | null;
const COLORS = ['var(--q1)', 'var(--q3)', 'var(--q4)', 'var(--q2)', 'var(--q5)'];

export function SzabadKotott({ formula, children, magyarazat }: { formula: string; children?: ReactNode; magyarazat?: ReactNode }) {
  const ex = useExercise();
  const { ast, tokens } = useMemo(() => parse(formula, true), [formula]);
  const info = useMemo(() => analyseFirstOrder(ast), [ast]);
  const occ = info.occurrences;
  const [marks, setMarks] = useState<Mark[]>(() => occ.map(() => null));
  const [checked, setChecked] = useState(false);

  const truth: Mark[] = occ.map((o) => (o.boundBy === null ? 'sz' : 'k'));
  const shown = ex.shown ? truth : marks;
  const quantColor = (id: number) => COLORS[info.quantifiers.findIndex((q) => q.id === id) % COLORS.length];
  const qByToken = new Map(info.quantifiers.flatMap((q) => [[q.qtok, q.id] as const, [q.vtok, q.id] as const]));

  const tap = (k: number) => {
    if (ex.done) return;
    setChecked(false);
    setMarks((m) => m.map((v, i) => (i !== k ? v : v === null ? 'sz' : v === 'sz' ? 'k' : null)));
  };

  const empty = marks.filter((m) => m === null).length;
  const bad = marks.filter((m, i) => m !== null && m !== truth[i]).length;
  const check = () => {
    setChecked(true);
    if (!empty && !bad) ex.solve();
    else ex.miss();
  };

  const parts: ReactNode[] = [];
  let pos = 0;
  tokens.forEach((t, i) => {
    if (t.i > pos) parts.push(<span key={`g${i}`}>{formula.slice(pos, t.i)}</span>);
    const text = formula.slice(t.i, t.i + t.len);
    const k = occ.findIndex((o) => o.token === i);
    if (k >= 0) {
      const m = shown[k];
      const wrong = checked && !ex.done && m !== null && m !== truth[k];
      const color = ex.done && occ[k].boundBy !== null ? quantColor(occ[k].boundBy!) : undefined;
      parts.push(
        <button
          key={i}
          type="button"
          className={`occ${m ? ` ${m}` : ''}${wrong ? ' bad' : ''}`}
          style={color ? { color, borderColor: color } : undefined}
          onClick={() => tap(k)}
          aria-label={`${text}: ${m === 'sz' ? 'szabad' : m === 'k' ? 'kötött' : 'jelöletlen'}`}>
          {text}
          <small>{m === 'sz' ? 'sz' : m === 'k' ? 'k' : '?'}</small>
        </button>
      );
    } else {
      const qid = qByToken.get(i);
      parts.push(
        <span key={i} className="tok-t" style={ex.done && qid !== undefined ? { color: quantColor(qid), fontWeight: 700 } : undefined}>
          {text}
        </span>
      );
    }
    pos = t.i + t.len;
  });

  const params = info.free;

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <div className="tokline">{parts}</div>
      {!ex.done ? <p className="note">Koppints minden változó-előfordulásra: ? → sz (szabad) → k (kötött). A kvantor melletti változót nem kell jelölni.</p> : null}
      <CheckBar ex={ex} onCheck={check} />
      {checked && !ex.done ? (
        <Feedback kind="no">
          {bad ? `${bad} jelölés rossz (pirossal). ` : ''}
          {empty ? `${empty} előfordulás még jelöletlen.` : ''}
          {bad ? ' Minden előfordulásnál nézd meg: benne van-e egy ugyanilyen nevű változót kötő kvantor hatáskörében?' : ''}
        </Feedback>
      ) : null}
      <DoneNote ex={ex}>
        A kötött előfordulások a kötő kvantor színét kapták. Paraméterek (szabad változók): {params.length ? `{${params.join(', ')}}` : '∅'}, tehát a
        formula {info.closed ? 'zárt' : 'nyitott'}. {magyarazat}
      </DoneNote>
    </div>
  );
}
