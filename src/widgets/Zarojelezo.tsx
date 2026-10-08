import { useState } from 'react';

import { bracketSteps, type Seg } from '@/lib/bracketing';
import { parse } from '@/lib/logic';

import { Examples, FormulaInput, ParseErrorView } from './logic-ui';
import { Bench } from './ui';

const EXAMPLES: [string, string][] = [
  ['dia', 'p ⊃ q ≡ ¬p ⊃ ¬q'],
  ['feladat', '¬p ∨ q ⊃ r ≡ s'],
  ['⊃ lánc', 'p ⊃ q ⊃ r'],
  ['∨ és ∧', 'p ∨ q ∧ r ∨ s'],
  ['kvantorral', '∀x P(x) ∨ Q(x) ⊃ ∃x R(x)'],
];

function Line({ segs }: { segs: Seg[] }) {
  return (
    <span className="brk">
      {segs.map((g, i) => (
        <span key={i} className={[g.k, g.scope ? 'scope' : ''].filter(Boolean).join(' ') || undefined}>
          {g.s}
        </span>
      ))}
    </span>
  );
}

/** Adds the brackets of a formula one precedence level at a time, ending with the main connective. */
export function Zarojelezo({ formula = '¬p ∨ q ⊃ r ≡ s' }: { formula?: string }) {
  const [src, setSrc] = useState(formula);
  const [shown, setShown] = useState(1);
  let parsed: ReturnType<typeof parse> | null = null;
  let error: unknown = null;
  try {
    parsed = parse(src, true);
  } catch (e) {
    error = e;
  }
  const steps = parsed ? bracketSteps(parsed.ast) : [];
  const n = Math.min(shown, steps.length);
  const change = (v: string) => {
    setSrc(v);
    setShown(1);
  };
  return (
    <Bench
      title="Zárójelezés lépésről lépésre"
      hint="A legerősebben kötő jeltől a leggyengébbig haladunk, és mindig az adott jel köré teszünk zárójelet. Ami a végén kívül marad, az a fő logikai jel.">
      <Examples items={EXAMPLES} onPick={change} />
      <FormulaInput value={src} onChange={change} label="Formula" symbols={['¬', '∧', '∨', '⊃', '≡', '∀', '∃', '(', ')']} />
      {error ? (
        <ParseErrorView error={error} src={src} />
      ) : (
        <>
          <ol className="brk-steps">
            {steps.slice(0, n).map((st, i) => (
              <li key={i} className={i === n - 1 ? 'cur' : undefined}>
                <span className="chip mid">{st.title}</span>
                <Line segs={st.segs} />
                {i === n - 1 ? <p className="note">{st.text}</p> : null}
              </li>
            ))}
          </ol>
          <div className="row">
            <button type="button" className="btn" disabled={n >= steps.length} onClick={() => setShown(n + 1)}>
              Következő lépés
            </button>
            <button type="button" className="btn" disabled={n >= steps.length} onClick={() => setShown(steps.length)}>
              Mind
            </button>
            <button type="button" className="btn" disabled={n <= 1} onClick={() => setShown(1)}>
              Elölről
            </button>
          </div>
        </>
      )}
    </Bench>
  );
}
