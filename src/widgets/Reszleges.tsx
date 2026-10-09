// Evaluation with partial information: every letter is 1, 0 or ? (unknown). A subformula gets a value
// when all ways of filling in the unknowns give the same result; otherwise it stays ?. Shows how a
// single known value can already decide the whole formula (the "rövidzár").
import { useMemo, useState } from 'react';

import { minimal } from '@/lib/course';
import { evaluate, parse, propVars, subformulas, valuations, type Formula, type Valuation } from '@/lib/logic';

import { Bench } from './ui';

type V = 0 | 1 | null;

function partial(f: Formula, known: Record<string, V>): V {
  const unknown = [...propVars(f)].filter((n) => known[n] === null);
  const base: Valuation = Object.fromEntries(Object.entries(known).map(([k, v]) => [k, v === 1]));
  const seen = new Set<boolean>();
  for (const r of valuations(unknown).rows) {
    seen.add(evaluate(f, { ...base, ...r }));
    if (seen.size > 1) return null;
  }
  return seen.has(true) ? 1 : 0;
}

const parseInit = (s: string): Record<string, V> =>
  Object.fromEntries(
    s
      .split(',')
      .map((p) => p.split('=').map((x) => x.trim()))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k, v === '1' ? 1 : v === '0' ? 0 : null])
  );

export function Reszleges({ formula, ismert = '' }: { formula: string; /** e.g. "Z=1" */ ismert?: string }) {
  const f = useMemo(() => parse(formula).ast, [formula]);
  const names = useMemo(() => [...propVars(f)].sort(), [f]);
  const [known, setKnown] = useState<Record<string, V>>(() => {
    const init = parseInit(ismert);
    return Object.fromEntries(names.map((n) => [n, init[n] ?? null]));
  });
  const subs = useMemo(() => subformulas(f), [f]);
  const cycle = (n: string) => setKnown((k) => ({ ...k, [n]: k[n] === null ? 1 : k[n] === 1 ? 0 : null }));
  const show = (v: V) => (v === null ? '?' : String(v));
  const main = partial(f, known);

  return (
    <Bench
      title="Mit tudunk részleges információból?"
      hint="Koppints a betűkre: ? (ismeretlen) → 1 → 0. Egy részformula értéke akkor dől el, ha az ismeretlenek bármilyen értékénél ugyanaz jön ki.">
      <div className="row">
        {names.map((n) => (
          <button key={n} type="button" className={`btn sym toggle${known[n] === null ? '' : ' on'}`} onClick={() => cycle(n)}>
            {n} = {show(known[n])}
          </button>
        ))}
      </div>
      <ol className="eval-steps partial">
        {subs.map((s, i) => {
          const v = partial(s, known);
          return (
            <li key={i} className={s === f ? 'main' : undefined}>
              <span className="line">{minimal(s)}</span> = <b className={v === null ? 'unk' : undefined}>{show(v)}</b>
            </li>
          );
        })}
      </ol>
      <p className="out" style={{ margin: 0 }}>
        {main === null ? (
          <span>
            <span className="chip mid">nem dől el</span> Ennyi információból a formula lehet igaz is és hamis is.
          </span>
        ) : (
          <span>
            <span className={`chip ${main ? 'ok' : 'no'}`}>{main ? 'biztosan igaz' : 'biztosan hamis'}</span>{' '}
            {names.some((n) => known[n] === null) ? 'Pedig nem minden betű értékét ismerjük!' : 'Minden betű ismert.'}
          </span>
        )}
      </p>
    </Bench>
  );
}
