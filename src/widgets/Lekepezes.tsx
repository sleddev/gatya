import { useState, type KeyboardEvent } from 'react';

import { classifyMapping, toggleArrow, type Arrows } from '@/lib/mapping';

import { Bench, Chip } from './ui';

const D_NAMES = ['1', '2', '3', '4', '5'];
const R_NAMES = ['a', 'b', 'c', 'd', 'e'];
// Hungarian suffixes depend on how the name is pronounced, so they are spelled out.
const D_FROM = ['1-ből', '2-ből', '3-ból', '4-ből', '5-ből'];
const R_INTO = ['a-ba', 'b-be', 'c-be', 'd-be', 'e-be'];

const PRESETS: Record<string, { label: string; r: number; arrows: Arrows }> = {
  'nem-fuggveny': { label: 'nem függvény', r: 4, arrows: [[0, 1], [2], [], [3]] },
  'egyik-sem': { label: 'egyik sem', r: 4, arrows: [[0], [0], [2], [2]] },
  injektiv: { label: 'csak injektív', r: 4, arrows: [[1], [0], [3]] },
  szurjektiv: { label: 'csak szürjektív', r: 3, arrows: [[0], [1], [1], [2]] },
  bijektiv: { label: 'bijektív', r: 4, arrows: [[2], [0], [3], [1]] },
  ures: { label: 'üres', r: 4, arrows: [[], [], [], []] },
};

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} és ${names[names.length - 1]}` : names[0]);

/** Arrow diagram of a relation D → R: draw arrows, see whether it is a function, injective, surjective. */
export function Lekepezes({ kezdo = 'egyik-sem' }: { kezdo?: string }) {
  const start = PRESETS[kezdo] ?? PRESETS['egyik-sem'];
  const [arrows, setArrows] = useState<Arrows>(start.arrows);
  const [rSize, setRSize] = useState(start.r);
  const [sel, setSel] = useState<number | null>(null);
  const n = arrows.length;
  const k = rSize;
  const res = classifyMapping(arrows, k);

  const rows = Math.max(n, k);
  const W = 340;
  const H = rows * 48 + 54;
  const LX = 80;
  const RX = 260;
  const cy = H / 2 + 12;
  const yOf = (i: number, count: number) => cy + (i - (count - 1) / 2) * 48;
  const ry = (rows * 48) / 2 + 14;

  const bad = new Set(res.fn ? [] : [...res.missing, ...res.multi]);
  const hits = res.fn ? res.preimages.map((p) => p.length) : Array.from({ length: k }, (_, y) => arrows.filter((a) => a.includes(y)).length);

  const setD = (size: number) => {
    setSel(null);
    setArrows(size > n ? [...arrows, []] : arrows.slice(0, size));
  };
  const setR = (size: number) => {
    setRSize(size);
    if (size < k) setArrows(arrows.map((a) => a.filter((y) => y < size)));
  };
  const pick = (x: number) => setSel(sel === x ? null : x);
  const hitR = (y: number) => {
    if (sel === null) return;
    setArrows(toggleArrow(arrows, sel, y));
  };
  const key = (f: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      f();
    }
  };

  return (
    <Bench
      title="Nyíldiagram"
      hint="Koppints egy bal oldali elemre, aztán egy jobb oldalira: a nyíl be- vagy kikapcsol. Figyeld, mikor lesz a hozzárendelés függvény, injektív, szürjektív.">
      <div className="row">
        <span className="note">Betöltés:</span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            className="btn"
            onClick={() => {
              setSel(null);
              setArrows(p.arrows);
              setRSize(p.r);
            }}>
            {p.label}
          </button>
        ))}
      </div>
      <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Nyíldiagram a D és R halmaz között">
        <ellipse cx={LX} cy={cy} rx={50} ry={ry} fill="var(--sunk)" stroke="var(--line)" />
        <ellipse cx={RX} cy={cy} rx={50} ry={ry} fill="var(--sunk)" stroke="var(--line)" />
        <text x={LX} y={20} textAnchor="middle" className="set">
          D
        </text>
        <text x={RX} y={20} textAnchor="middle" className="set">
          R
        </text>
        {arrows.flatMap((ys, x) =>
          ys.map((y) => {
            const x1 = LX,
              y1 = yOf(x, n),
              x2 = RX,
              y2 = yOf(y, k);
            const L = Math.hypot(x2 - x1, y2 - y1);
            const ux = (x2 - x1) / L,
              uy = (y2 - y1) / L;
            const sx = x1 + ux * 17,
              sy = y1 + uy * 17,
              ex = x2 - ux * 18,
              ey = y2 - uy * 18;
            const col = bad.has(x) ? 'var(--bad)' : 'var(--q1)';
            return (
              <g key={`${x}-${y}`}>
                <line x1={sx} y1={sy} x2={ex - ux * 8} y2={ey - uy * 8} stroke={col} strokeWidth={2.2} />
                <polygon
                  points={`${ex},${ey} ${ex - ux * 11 - uy * 5},${ey - uy * 11 + ux * 5} ${ex - ux * 11 + uy * 5},${ey - uy * 11 - ux * 5}`}
                  fill={col}
                />
              </g>
            );
          })
        )}
        {arrows.map((_, x) => (
          <g
            key={`d${x}`}
            role="button"
            tabIndex={0}
            aria-pressed={sel === x}
            aria-label={`${D_NAMES[x]} kiválasztása`}
            className="node"
            onClick={() => pick(x)}
            onKeyDown={key(() => pick(x))}>
            <circle
              cx={LX}
              cy={yOf(x, n)}
              r={16}
              fill={sel === x ? 'var(--acc)' : 'var(--surface)'}
              stroke={bad.has(x) ? 'var(--bad)' : sel === x ? 'var(--acc)' : 'var(--ink)'}
              strokeWidth={bad.has(x) ? 2.4 : 1.5}
            />
            <text x={LX} y={yOf(x, n) + 5} textAnchor="middle" fill={sel === x ? 'var(--surface)' : 'var(--ink)'}>
              {D_NAMES[x]}
            </text>
          </g>
        ))}
        {Array.from({ length: k }, (_, y) => {
          const h = hits[y];
          const stroke = res.fn && h === 0 ? 'var(--bad)' : h > 1 ? 'var(--warn)' : 'var(--ink)';
          return (
            <g
              key={`r${y}`}
              role="button"
              tabIndex={sel === null ? -1 : 0}
              aria-label={sel === null ? R_NAMES[y] : `nyíl ${D_NAMES[sel]} → ${R_NAMES[y]}`}
              className={sel === null ? '' : 'node'}
              onClick={() => hitR(y)}
              onKeyDown={key(() => hitR(y))}>
              <circle
                cx={RX}
                cy={yOf(y, k)}
                r={16}
                fill="var(--surface)"
                stroke={stroke}
                strokeWidth={h === 1 ? 1.5 : 2.4}
                strokeDasharray={res.fn && h === 0 ? '4 3' : undefined}
              />
              <text x={RX} y={yOf(y, k) + 5} textAnchor="middle">
                {R_NAMES[y]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="row" style={{ columnGap: 22 }}>
        {(
          [
            ['D', n, setD],
            ['R', k, setR],
          ] as const
        ).map(([name, size, set]) => (
          <span key={name} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <span className="note">|{name}| =</span>
            <button type="button" className="btn sym" disabled={size <= 2} onClick={() => set(size - 1)} aria-label={`${name}-ből egy elem el`}>
              −
            </button>
            <span className="mono">{size}</span>
            <button type="button" className="btn sym" disabled={size >= 5} onClick={() => set(size + 1)} aria-label={`${name}-hez egy elem hozzá`}>
              +
            </button>
          </span>
        ))}
      </div>
      <div className="out">
        {!res.fn ? (
          <>
            <p>
              <Chip kind="no">nem függvény</Chip>
            </p>
            {res.missing.length ? (
              <p>
                {list(res.missing.map((x) => D_FROM[x]))} nem indul nyíl: a függvénynek <b>minden</b> elemhez rendelnie kell valamit.
              </p>
            ) : null}
            {res.multi.length ? (
              <p>
                {list(res.multi.map((x) => D_FROM[x]))} több nyíl indul: a hozzárendelés nem <b>egyértelmű</b>.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="row" style={{ gap: 6 }}>
              <Chip kind="ok">függvény</Chip>
              <Chip kind={res.injective ? 'ok' : 'no'}>{res.injective ? 'injektív' : 'nem injektív'}</Chip>
              <Chip kind={res.surjective ? 'ok' : 'no'}>{res.surjective ? 'szürjektív' : 'nem szürjektív'}</Chip>
              {res.injective && res.surjective ? <Chip kind="ok">bijektív</Chip> : null}
            </p>
            <p className="line">{arrows.map(([y], x) => `f(${D_NAMES[x]}) = ${R_NAMES[y]}`).join(',  ')}</p>
            <p>
              {res.injective ? (
                <>Minden R-beli elembe legfeljebb egy nyíl fut, tehát különböző elemek képe különböző.</>
              ) : (
                <>
                  <b>{R_INTO[res.collision!]}</b> több nyíl fut ({list(res.preimages[res.collision!].map((x) => `f(${D_NAMES[x]})`))} ugyanaz), ezért nem
                  injektív.
                </>
              )}{' '}
              {res.surjective ? (
                <>R minden elemébe fut nyíl, az értékkészlet az egész R.</>
              ) : (
                <>
                  {list(res.unhit.map((y) => R_INTO[y]))} nem fut nyíl, ezért nem szürjektív. Az értékkészlet{' '}
                  {`{${R_NAMES.slice(0, k)
                    .filter((_, y) => !res.unhit.includes(y))
                    .join(', ')}}`}
                  .
                </>
              )}
            </p>
          </>
        )}
        {n < k ? (
          <p className="note">|D| &lt; |R|: egy függvénynek itt kevesebb nyila van, mint ahány R-beli elem, így sosem lehet szürjektív.</p>
        ) : n > k ? (
          <p className="note">|D| &gt; |R|: egy függvény valamelyik két nyila biztosan ugyanoda fut, így sosem lehet injektív.</p>
        ) : (
          <p className="note">|D| = |R|: véges halmazoknál ilyenkor egy függvény pontosan akkor injektív, ha szürjektív.</p>
        )}
      </div>
    </Bench>
  );
}
