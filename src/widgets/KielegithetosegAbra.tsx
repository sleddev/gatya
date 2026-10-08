import { useState } from 'react';

import { classify, parse, type Classification } from '@/lib/logic';

import { Examples, FormulaInput, ParseErrorView } from './logic-ui';
import { Bench } from './ui';

const BOXES: { kind: Classification; x: number; title: string[]; sub: string }[] = [
  { kind: 'valid', x: 6, title: ['érvényes'], sub: 'mindig 1' },
  { kind: 'contingent', x: 118, title: ['kielégíthető', 'és cáfolható'], sub: 'néha 1, néha 0' },
  { kind: 'unsatisfiable', x: 230, title: ['kielégíthe-', 'tetlen'], sub: 'mindig 0' },
];
const BW = 104;
const NEG: Record<Classification, Classification> = { valid: 'unsatisfiable', contingent: 'contingent', unsatisfiable: 'valid' };
const NAME: Record<Classification, string> = {
  valid: 'érvényes (logikai törvény)',
  contingent: 'kielégíthető és cáfolható',
  unsatisfiable: 'kielégíthetetlen (ellentmondás)',
};

const EXAMPLES: [string, string][] = [
  ['p ∨ ¬p', 'p ∨ ¬p'],
  ['p ⊃ q', 'p ⊃ q'],
  ['p ∧ ¬p', 'p ∧ ¬p'],
  ['(p ⊃ q) ∧ p ⊃ q', '(p ⊃ q) ∧ p ⊃ q'],
  ['(p ⊃ q) ∧ p ∧ ¬q', '(p ⊃ q) ∧ p ∧ ¬q'],
];

/** The three kinds of formulas side by side, with the two overlapping groups and where ¬A lands. */
export function KielegithetosegAbra({ formula = 'p ⊃ q' }: { formula?: string }) {
  const [src, setSrc] = useState(formula);
  let res: ReturnType<typeof classify> | null = null;
  let error: unknown = null;
  try {
    res = classify(parse(src).ast);
  } catch (e) {
    error = e;
  }
  const kind = res?.kind;
  const neg = kind ? NEG[kind] : undefined;
  const cx = (k: Classification) => BOXES.find((b) => b.kind === k)!.x + BW / 2;

  return (
    <Bench
      title="Hova tartozik a formula?"
      hint="Minden formula a három doboz egyikébe esik. A két kapocs mutatja a két átfedő csoportot. A tagadás az érvényest és a kielégíthetetlent felcseréli, a középsőt helyben hagyja.">
      <svg className="diagram" viewBox="0 0 340 214" role="img" aria-label={kind ? `A formula ${NAME[kind]}` : 'A formulák három fajtája'}>
        <path d="M 8 44 V 34 H 220 V 44" fill="none" stroke="var(--good)" strokeWidth={2} />
        <text x={114} y={24} textAnchor="middle" style={{ fill: 'var(--good)', fontSize: 13 }}>
          kielégíthető: van modellje
        </text>
        <path d="M 120 146 V 156 H 332 V 146" fill="none" stroke="var(--bad)" strokeWidth={2} />
        <text x={226} y={174} textAnchor="middle" style={{ fill: 'var(--bad)', fontSize: 13 }}>
          cáfolható: van, ahol hamis
        </text>
        {BOXES.map((b) => {
          const on = b.kind === kind;
          return (
            <g key={b.kind}>
              <rect
                x={b.x}
                y={50}
                width={BW}
                height={90}
                rx={10}
                fill={on ? 'var(--acc)' : 'var(--sunk)'}
                stroke={b.kind === neg && !on ? 'var(--q4)' : 'var(--line)'}
                strokeWidth={b.kind === neg && !on ? 2.4 : 1.2}
                strokeDasharray={b.kind === neg && !on ? '6 4' : undefined}
              />
              {b.title.map((t, i) => (
                <text key={i} x={b.x + BW / 2} y={82 + i * 17 - (b.title.length - 1) * 8} textAnchor="middle" style={{ fill: on ? 'var(--surface)' : 'var(--ink)', fontSize: 13.5 }}>
                  {t}
                </text>
              ))}
              <text x={b.x + BW / 2} y={126} textAnchor="middle" className="small" style={on ? { fill: 'var(--surface)' } : undefined}>
                {b.sub}
              </text>
            </g>
          );
        })}
        {kind && neg && kind !== neg ? (
          <g>
            <path d={`M ${cx(kind)} 142 Q ${(cx(kind) + cx(neg)) / 2} 214 ${cx(neg)} 142`} fill="none" stroke="var(--q4)" strokeWidth={1.8} />
            <text x={(cx(kind) + cx(neg)) / 2} y={204} textAnchor="middle" style={{ fill: 'var(--q4)', fontSize: 14 }}>
              ¬A ide kerül
            </text>
          </g>
        ) : null}
      </svg>
      <Examples items={EXAMPLES} onPick={setSrc} />
      <FormulaInput value={src} onChange={setSrc} label="Formula (ítéletlogikai)" />
      {error ? (
        <ParseErrorView error={error} src={src} />
      ) : res && kind ? (
        <div className="out">
          <p>
            Az igazságtábla {res.rows} sorából <b>{res.trueRows}</b> sorban igaz, ezért a formula <b>{NAME[kind]}</b>.
          </p>
          <p className="note">
            {kind === 'valid'
              ? 'A tagadása minden sorban hamis, tehát kielégíthetetlen (szaggatott keret).'
              : kind === 'unsatisfiable'
                ? 'A tagadása minden sorban igaz, tehát érvényes (szaggatott keret).'
                : 'A tagadása is néha igaz, néha hamis: ugyanebben a dobozban marad.'}
          </p>
        </div>
      ) : null}
    </Bench>
  );
}
