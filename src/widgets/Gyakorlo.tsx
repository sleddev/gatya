// Endless random drills for the routine ZH tasks: main connective, truth value in an interpretation,
// classification, consequence, brackets. A new task is generated on demand; the streak is per visit.
import { useEffect, useMemo, useState } from 'react';

import { minimal, randomFormula, rng } from '@/lib/course';
import { classify, consequence, evaluate, show, subformulas, valuations, type Formula, type Valuation } from '@/lib/logic';

import { FoJel } from './FoJel';
import { FormulaValasz } from './FormulaValasz';
import { CardProvider, Feedback } from './lesson';

type Kind = 'fojel' | 'ertek' | 'osztaly' | 'kovetkezik' | 'zarojel';

const LABEL: Record<Kind, string> = {
  fojel: 'Fő logikai jel',
  ertek: 'Igazságérték',
  osztaly: 'Érvényes? Kielégíthető?',
  kovetkezik: 'Következik?',
  zarojel: 'Zárójelek elhagyása',
};

const LETTERS = ['X', 'Y', 'Z'];

function makeTask(kind: Kind, seed: number) {
  const r = rng(seed);
  const size = 3 + Math.floor(r() * 3);
  if (kind === 'osztaly') {
    // aim for each class equally often, otherwise almost everything is "kielégíthető és cáfolható"
    const want = Math.floor(r() * 3);
    let f = randomFormula(r, LETTERS.slice(0, 2), size);
    for (let i = 0; i < 400; i++) {
      const k = classify(f).kind;
      if ((want === 0 && k === 'valid') || (want === 1 && k === 'contingent') || (want === 2 && k === 'unsatisfiable')) break;
      f = randomFormula(r, LETTERS.slice(0, 2), 2 + Math.floor(r() * 4));
    }
    return { f };
  }
  if (kind === 'kovetkezik') {
    const want = r() < 0.5;
    let prem: Formula[] = [];
    let concl: Formula = randomFormula(r, LETTERS, 2);
    for (let i = 0; i < 400; i++) {
      prem = [randomFormula(r, LETTERS, 2 + Math.floor(r() * 2)), randomFormula(r, LETTERS, 1 + Math.floor(r() * 2))];
      concl = randomFormula(r, LETTERS, 1 + Math.floor(r() * 2));
      const c = consequence(prem, concl);
      if (c.models > 0 && c.holds === want) break;
    }
    return { f: concl, prem };
  }
  const f = randomFormula(r, LETTERS, size);
  const v: Valuation = Object.fromEntries(LETTERS.map((l) => [l, r() < 0.5]));
  return { f, v };
}

export function Gyakorlo({ tipusok = ['fojel', 'ertek', 'osztaly', 'kovetkezik', 'zarojel'] }: { tipusok?: Kind[] }) {
  const [kind, setKind] = useState<Kind>(tipusok[0]);
  // fixed first seed so the pre-rendered HTML matches; a random one right after mounting
  const [seed, setSeed] = useState(1);
  useEffect(() => setSeed(Math.floor(Math.random() * 1e9)), []);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const task = useMemo(() => makeTask(kind, seed), [kind, seed]);

  const fresh = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setAnswered(null);
  };
  const score = (ok: boolean) => {
    if (answered !== null) return;
    setAnswered(ok);
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
          Sorozat: <b>{streak}</b> · legjobb: {best}. Minden feladat véletlen, annyit gyakorolsz, amennyit akarsz.
        </p>
      </div>
      <div className="row">
        {tipusok.map((k) => (
          <button
            key={k}
            type="button"
            className={`btn small${k === kind ? ' on' : ''}`}
            onClick={() => {
              setKind(k);
              fresh();
            }}>
            {LABEL[k]}
          </button>
        ))}
      </div>
      {/* the embedded exercises report their first answer to the streak */}
      <CardProvider value={{ register: () => () => {}, solve: () => score(true), miss: () => score(false) }}>
        <div key={`${kind}${seed}`}>
          {kind === 'fojel' ? <FoJel formula={minimal(task.f)}>Melyik a fő logikai jel?</FoJel> : null}
          {kind === 'zarojel' ? (
            <FormulaValasz helyes={show(task.f)} mod="minimalis">
              Hagyd el a lehető legtöbb zárójelet: <span className="line">{show(task.f)}</span>
            </FormulaValasz>
          ) : null}
          {kind === 'ertek' ? <Ertek f={task.f} v={task.v!} onAnswer={score} /> : null}
          {kind === 'osztaly' ? <Osztaly f={task.f} onAnswer={score} /> : null}
          {kind === 'kovetkezik' ? <Kovetkezik prem={task.prem!} f={task.f} onAnswer={score} /> : null}
        </div>
      </CardProvider>
      <div className="row">
        <button type="button" className="btn on" onClick={fresh}>
          Új feladat →
        </button>
      </div>
    </section>
  );
}

function Choice({ options, right, onAnswer }: { options: string[]; right: number; onAnswer: (ok: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="opts">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={`opt${pick === null ? '' : i === right ? ' right' : i === pick ? ' wrong' : ''}`}
          onClick={() => {
            if (pick !== null) return;
            setPick(i);
            onAnswer(i === right);
          }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Ertek({ f, v, onAnswer }: { f: Formula; v: Valuation; onAnswer: (ok: boolean) => void }) {
  const [done, setDone] = useState(false);
  const value = evaluate(f, v);
  const vals = Object.entries(v)
    .filter(([k]) => show(f).includes(k))
    .map(([k, b]) => `|${k}| = ${b ? 1 : 0}`)
    .join(', ');
  return (
    <div className="ex">
      <div className="ex-q">
        Mennyi <span className="line">{minimal(f)}</span> értéke, ha {vals || 'bármi'}?
      </div>
      <Choice
        options={['1 (igaz)', '0 (hamis)']}
        right={value ? 0 : 1}
        onAnswer={(ok) => {
          setDone(true);
          onAnswer(ok);
        }}
      />
      {done ? (
        <ol className="eval-steps">
          {subformulas(f).map((g, i) => (
            <li key={i}>
              <span className="line">{minimal(g)}</span> = <b>{evaluate(g, v) ? 1 : 0}</b>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function Osztaly({ f, onAnswer }: { f: Formula; onAnswer: (ok: boolean) => void }) {
  const [done, setDone] = useState(false);
  const c = classify(f);
  const right = c.kind === 'valid' ? 0 : c.kind === 'contingent' ? 1 : 2;
  return (
    <div className="ex">
      <div className="ex-q">
        Milyen formula: <span className="line">{minimal(f)}</span>?
      </div>
      <Choice
        options={['logikai törvény (érvényes)', 'kielégíthető és cáfolható', 'kielégíthetetlen (ellentmondás)']}
        right={right}
        onAnswer={(ok) => {
          setDone(true);
          onAnswer(ok);
        }}
      />
      {done ? (
        <Feedback kind="info">
          A {c.rows} interpretációból {c.trueRows}-ben igaz.{' '}
          {c.kind === 'contingent' ? 'Van, ahol igaz, és van, ahol hamis.' : c.kind === 'valid' ? 'Mindegyikben igaz.' : 'Egyikben sem igaz.'}
        </Feedback>
      ) : null}
    </div>
  );
}

function Kovetkezik({ prem, f, onAnswer }: { prem: Formula[]; f: Formula; onAnswer: (ok: boolean) => void }) {
  const [done, setDone] = useState(false);
  const c = consequence(prem, f);
  const counter = c.table.find((r) => r.counter);
  const names = valuations(c.names).names;
  return (
    <div className="ex">
      <div className="ex-q">
        Igaz-e, hogy <span className="line">{prem.map(minimal).join(', ')} ⊨ {minimal(f)}</span>?
      </div>
      <Choice
        options={['Igen, következik', 'Nem következik']}
        right={c.holds ? 0 : 1}
        onAnswer={(ok) => {
          setDone(true);
          onAnswer(ok);
        }}
      />
      {done ? (
        <Feedback kind="info">
          {counter
            ? `Ellenpélda: ${names.map((n) => `${n} = ${counter.v[n] ? 1 : 0}`).join(', ')}. Itt minden premissza igaz, a konklúzió hamis.`
            : `A premisszák ${c.models} modelljének mindegyikében igaz a konklúzió, ellenpélda nincs.`}
        </Feedback>
      ) : null}
    </div>
  );
}
