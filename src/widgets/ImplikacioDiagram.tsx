import { useState } from 'react';

import { Bench, Chip, Seg } from './ui';

type Mode = 'implikacio' | 'lanc';
type Fact = 'A' | 'nemA' | 'B' | 'nemB' | 'C' | 'nemC';

// Regions from the inside out: 0 = A, 1 = B \ A, 2 = C \ B (chain only), last = outside everything.
type Entry = { label: string; regions: number[]; ok?: boolean; text: string };

const IMPL: Record<string, Entry> = {
  A: {
    label: 'A igaz',
    regions: [0],
    ok: true,
    text: 'Ha A-ban vagyunk, akkor B-ben is, mert A teljesen B-n belül van. Tehát B igaz. Ez a modus ponens: {A ⊃ B, A} ⊨ B.',
  },
  nemB: {
    label: 'B hamis',
    regions: [2],
    ok: true,
    text: 'Ha B-n kívül vagyunk, akkor A-n is kívül, mert A nem lóg ki B-ből. Tehát A hamis. Ez a modus tollens: {A ⊃ B, ¬B} ⊨ ¬A.',
  },
  B: {
    label: 'B igaz',
    regions: [0, 1],
    ok: false,
    text: 'B-n belül lehetünk a kis körben (A igaz) és a gyűrűben is (A hamis). Az A tehát nem következik. Ez a „következmény állítása”, tipikus hibás következtetés: {A ⊃ B, B} ⊭ A.',
  },
  nemA: {
    label: 'A hamis',
    regions: [1, 2],
    ok: false,
    text: 'A-n kívül lehetünk a gyűrűben (B igaz) és B-n kívül is (B hamis). A ¬B nem következik. Ez az „előtag tagadása”, szintén hibás: {A ⊃ B, ¬A} ⊭ ¬B.',
  },
};

const CHAIN: Record<string, Entry> = {
  A: {
    label: 'A igaz',
    regions: [0],
    text: 'A-ban vagyunk, tehát B-ben is, tehát C-ben is: C igaz. A két implikációból A ⊃ C következik (láncszabály).',
  },
  nemC: {
    label: 'C hamis',
    regions: [3],
    text: 'C-n kívül vagyunk, tehát B-n kívül is, tehát A-n kívül is: A hamis.',
  },
  B: {
    label: 'B igaz',
    regions: [0, 1],
    text: 'B-ben vagyunk: C biztosan igaz, A lehet igaz is, hamis is.',
  },
};

/**
 * "A ⊃ B" pictured as "A is inside B" (the row A = 1, B = 0 is the only one it forbids).
 * Pick what you know, the shaded area shows where you can be, and what follows.
 */
export function ImplikacioDiagram({ mod: mode0 = 'implikacio', a, b }: { mod?: Mode; a?: string; b?: string }) {
  const [mode, setMode] = useState<Mode>(mode0);
  const [fact, setFact] = useState<Fact | null>(null);
  const table = mode === 'implikacio' ? IMPL : CHAIN;
  const cur = fact && table[fact] ? table[fact] : null;
  const regions = cur?.regions ?? [];
  const shade = (i: number) => (regions.includes(i) ? 'color-mix(in srgb, var(--acc) 38%, var(--surface))' : 'var(--surface)');

  const circles =
    mode === 'implikacio'
      ? [
          { name: 'B', cx: 186, cy: 118, r: 92 },
          { name: 'A', cx: 162, cy: 128, r: 46 },
        ]
      : [
          { name: 'C', cx: 186, cy: 118, r: 100 },
          { name: 'B', cx: 172, cy: 126, r: 66 },
          { name: 'A', cx: 160, cy: 134, r: 32 },
        ];
  const outside = circles.length;

  return (
    <Bench
      title={mode === 'implikacio' ? 'Az implikáció mint tartalmazás' : 'Láncszabály'}
      hint="A ⊃ B pontosan azt tiltja, hogy A igaz, B hamis legyen: rajzban az A kör nem lóghat ki B-ből. Válaszd ki, mit tudsz, és nézd meg, hol lehetsz.">
      <Seg
        options={[
          ['implikacio', 'A ⊃ B'],
          ['lanc', 'A ⊃ B, B ⊃ C'],
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setFact(null);
        }}
      />
      <svg className="diagram" viewBox="0 0 340 240" role="img" aria-label={cur ? `${cur.label}: a lehetséges tartomány kiszínezve` : 'Egymásba ágyazott körök'}>
        <rect x={6} y={6} width={328} height={228} rx={10} fill={shade(outside)} stroke="var(--ink)" strokeWidth={1.4} />
        {circles.map((c, i) => (
          <circle key={c.name} cx={c.cx} cy={c.cy} r={c.r} fill={shade(outside - 1 - i)} stroke="var(--ink)" strokeWidth={1.6} />
        ))}
        {circles.map((c) => (
          <text key={c.name} x={c.cx} y={c.cy - c.r + 24} textAnchor="middle" className="set">
            {c.name}
          </text>
        ))}
      </svg>
      {mode === 'implikacio' && (a || b) ? (
        <p className="note" style={{ margin: 0 }}>
          {a ? (
            <>
              <b>A</b>: {a}.{' '}
            </>
          ) : null}
          {b ? (
            <>
              <b>B</b>: {b}.
            </>
          ) : null}
        </p>
      ) : null}
      <div className="row">
        <span className="note">Tudjuk:</span>
        {Object.entries(table).map(([k, f]) => (
          <button key={k} type="button" className={`btn${fact === k ? ' on' : ''}`} onClick={() => setFact(fact === k ? null : (k as Fact))}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="out">
        {cur ? (
          <p>
            {cur.ok !== undefined ? <Chip kind={cur.ok ? 'ok' : 'no'}>{cur.ok ? 'következik' : 'nem következik'}</Chip> : null}{' '}
            {cur.text}
          </p>
        ) : (
          <p className="note">
            {mode === 'implikacio'
              ? 'A három tartomány az igazságtábla három sora, ahol A ⊃ B igaz: A és B is igaz (kis kör), csak B igaz (gyűrű), egyik sem (kívül). Az A = 1, B = 0 sornak nincs helye a rajzon.'
              : 'Ha A ⊃ B és B ⊃ C is igaz, akkor A a B-ben, B a C-ben van, így A a C-ben is: A ⊃ C.'}
          </p>
        )}
      </div>
    </Bench>
  );
}
