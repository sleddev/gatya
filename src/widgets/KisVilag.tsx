import { useState, type KeyboardEvent } from 'react';

import { parse } from '@/lib/logic';
import { EvalError, evaluateIn, type World } from '@/lib/world';

import { Examples, FormulaInput, ParseErrorView } from './logic-ui';
import { Bench, Chip, Kv, Seg } from './ui';

const PEOPLE = [
  { name: 'Péter', age: 20, face: '🧑' },
  { name: 'Bence', age: 21, face: '👦' },
  { name: 'Anna', age: 45, face: '👩' },
  { name: 'Mari', age: 70, face: '👵' },
];
const FRIEND = [1, 0, 3, 2];

const EXAMPLES: [string, string][] = [
  ['tanul(Péter)', 'tanul(Péter)'],
  ['term a predikátumban', 'dolgozik(barátja(Anna))'],
  ['két argumentum', 'idősebb(barátja(Bence), Bence)'],
  ['kötőszavak', 'tanul(Bence) ∧ ¬havazik'],
  ['mindenki', '∀x (tanul(x) ∨ dolgozik(x))'],
  ['van olyan', '∃x (dolgozik(x) ∧ idősebb(x, Péter))'],
  ['két kvantor', '∀x ∃y idősebb(y, x)'],
  ['nyitott', 'tanul(x)'],
];

type Pred = 'tanul' | 'dolgozik';
const BADGE: Record<Pred, string> = { tanul: '📚', dolgozik: '💼' };

const set = (xs: number[]) => `{${xs.map((i) => PEOPLE[i].name).join(', ')}}`;

/**
 * A four-person interpretation you can edit (who studies, who works, whether it snows),
 * and a formula evaluated in it step by step, from the inside out.
 */
export function KisVilag({ formula = 'dolgozik(barátja(Anna))' }: { formula?: string }) {
  const [src, setSrc] = useState(formula);
  const [tanul, setTanul] = useState<number[]>([0, 1]);
  const [dolgozik, setDolgozik] = useState<number[]>([2]);
  const [havazik, setHavazik] = useState(false);
  const [edit, setEdit] = useState<Pred>('tanul');

  const world: World = {
    U: PEOPLE.map((p) => p.name),
    names: Object.fromEntries(PEOPLE.map((p, i) => [p.name, i])),
    funcs: { barátja: FRIEND },
    preds: {
      tanul: { arity: 1, holds: ([x]) => tanul.includes(x), say: ([x], y) => `${PEOPLE[x].name} ${y ? 'benne van' : 'nincs benne'} a ϱ(tanul) halmazban` },
      dolgozik: {
        arity: 1,
        holds: ([x]) => dolgozik.includes(x),
        say: ([x], y) => `${PEOPLE[x].name} ${y ? 'benne van' : 'nincs benne'} a ϱ(dolgozik) halmazban`,
      },
      idősebb: {
        arity: 2,
        holds: ([x, y]) => PEOPLE[x].age > PEOPLE[y].age,
        say: ([x, y], yes) => `${PEOPLE[x].name} (${PEOPLE[x].age}) ${yes ? '' : 'nem '}idősebb, mint ${PEOPLE[y].name} (${PEOPLE[y].age})`,
      },
    },
    props: { havazik },
  };

  let result: { value: boolean; steps: { expr: string; value: string; why?: string }[] } | null = null;
  let error: unknown = null;
  try {
    result = evaluateIn(parse(src, true).ast, world);
  } catch (e) {
    error = e;
  }

  const toggle = (i: number) => {
    const [cur, setCur] = edit === 'tanul' ? [tanul, setTanul] : [dolgozik, setDolgozik];
    setCur(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort());
  };
  const key = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(i);
    }
  };

  const W = 340;
  const X = (i: number) => 44 + i * 84;

  return (
    <Bench
      title="Kis világ"
      hint="Ez egy interpretáció: négy ember az univerzum. Koppints valakire, hogy tanuljon vagy dolgozzon. Lent a formula értéke lépésről lépésre, belülről kifelé.">
      <svg className="diagram" viewBox={`0 0 ${W} 170`} role="group" aria-label="Az univerzum: Péter, Bence, Anna, Mari">
        {[
          [0, 1],
          [2, 3],
        ].map(([a, b]) => (
          <g key={a}>
            <path d={`M ${X(a) + 8} 40 Q ${(X(a) + X(b)) / 2} 4 ${X(b) - 8} 40`} fill="none" stroke="var(--q4)" strokeWidth={1.6} strokeDasharray="4 3" />
            <text x={(X(a) + X(b)) / 2} y={16} textAnchor="middle" className="small" style={{ fill: 'var(--q4)' }}>
              barátja ↔
            </text>
          </g>
        ))}
        {PEOPLE.map((p, i) => (
          <g key={p.name} className="node" role="button" tabIndex={0} aria-label={`${p.name}: ${edit} be/ki`} onClick={() => toggle(i)} onKeyDown={key(i)}>
            <circle cx={X(i)} cy={66} r={26} fill="var(--sunk)" stroke="var(--line)" strokeWidth={1.4} />
            <text x={X(i)} y={77} textAnchor="middle" style={{ fontSize: 28 }}>
              {p.face}
            </text>
            <text x={X(i)} y={112} textAnchor="middle">
              {p.name}
            </text>
            <text x={X(i)} y={127} textAnchor="middle" className="small">
              {p.age} éves
            </text>
            <text x={X(i)} y={154} textAnchor="middle" style={{ fontSize: 18 }}>
              {tanul.includes(i) ? BADGE.tanul : ''}
              {dolgozik.includes(i) ? BADGE.dolgozik : ''}
            </text>
          </g>
        ))}
      </svg>
      <div className="row">
        <span className="note">Koppintásra:</span>
        <Seg
          options={[
            ['tanul', '📚 tanul'],
            ['dolgozik', '💼 dolgozik'],
          ]}
          value={edit}
          onChange={setEdit}
        />
        <button type="button" className={`btn${havazik ? ' on' : ''}`} onClick={() => setHavazik(!havazik)}>
          ❄️ havazik: {havazik ? 'igen' : 'nem'}
        </button>
      </div>
      <Kv
        rows={[
          ['U', set([0, 1, 2, 3])],
          ['ϱ(Péter), …', 'Péter, … (mindenkinek a saját neve)'],
          ['ϱ(barátja)', 'Péter ↦ Bence, Bence ↦ Péter, Anna ↦ Mari, Mari ↦ Anna'],
          ['ϱ(tanul)', set(tanul)],
          ['ϱ(dolgozik)', set(dolgozik)],
          ['ϱ(idősebb)', 'azok az (x, y) párok, ahol x idősebb y-nál'],
          ['ϱ(havazik)', havazik ? '1' : '0'],
        ]}
      />
      <Examples items={EXAMPLES} onPick={setSrc} />
      <FormulaInput value={src} onChange={setSrc} label="Formula" symbols={['¬', '∧', '∨', '⊃', '≡', '∀', '∃', '(', ')', ',']} />
      {error instanceof EvalError ? (
        <p className="err">{error.message}</p>
      ) : error ? (
        <ParseErrorView error={error} src={src} />
      ) : result ? (
        <div className="out">
          <ol className="eval-steps">
            {result.steps.map((s, i) => (
              <li key={i}>
                <span className="line">
                  {s.expr} = <b>{s.value}</b>
                </span>
                {s.why ? <span className="note">{s.why}</span> : null}
              </li>
            ))}
          </ol>
          <p>
            {result.value ? <Chip kind="ok">igaz</Chip> : <Chip kind="no">hamis</Chip>} ebben az interpretációban. Változtass a világon, és nézd meg, mikor fordul
            meg!
          </p>
        </div>
      ) : null}
    </Bench>
  );
}
