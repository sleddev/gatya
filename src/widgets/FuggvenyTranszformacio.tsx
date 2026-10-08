import { useState } from 'react';

import { fmt, MINUS } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';
import { transformPoint, transformSteps } from '@/lib/transform';

import { Bench, PlaneCanvas, Seg } from './ui';

type Base = 'x2' | 'abs' | 'sqrt' | 'x3' | 'exp' | 'sin';

const BASES: Record<Base, { label: string; f: (x: number) => number; p: [number, number]; pName: string }> = {
  x2: { label: 'x²', f: (x) => x * x, p: [0, 0], pName: 'csúcs' },
  abs: { label: '|x|', f: Math.abs, p: [0, 0], pName: 'csúcs' },
  sqrt: { label: '√x', f: Math.sqrt, p: [0, 0], pName: 'kezdőpont' },
  x3: { label: 'x³', f: (x) => x ** 3, p: [1, 1], pName: '(1, 1)' },
  exp: { label: '2ˣ', f: (x) => 2 ** x, p: [0, 1], pName: '(0, 1)' },
  sin: { label: 'sin x', f: Math.sin, p: [Math.PI / 2, 1], pName: 'maximum' },
};

const B_VALUES = [-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3];

type P = { a: number; b: number; c: number; d: number };

const PRESETS: [string, Partial<P>][] = [
  ['f(x) + 3', { d: 3 }],
  ['f(x − 2)', { c: 2 }],
  ['2·f(x)', { a: 2 }],
  ['f(2x)', { b: 2 }],
  ['−f(x)', { a: -1 }],
  ['f(−x)', { b: -1 }],
  ['3·f(−x) − 4', { a: 3, b: -1, d: -4 }],
  ['f(2x − 4)', { b: 2, c: 2 }],
];

const n = (x: number) => fmt(x, 2).replace('.', ',');
const signed = (x: number) => (x < 0 ? ` ${MINUS} ${n(-x)}` : ` + ${n(x)}`);

function formula({ a, b, c, d }: P) {
  const bs = b === 1 ? '' : b === -1 ? MINUS : n(b);
  const inner = c === 0 ? `${bs}x` : bs ? `${bs}(x${signed(-c)})` : `x${signed(-c)}`;
  const as = a === 1 ? '' : a === -1 ? MINUS : `${n(a)}·`;
  return `g(x) = ${as}f(${inner})${d ? signed(d) : ''}`;
}

/** Graph of a·f(b·(x − c)) + d next to the graph of f, with the order of the steps spelled out. */
export function FuggvenyTranszformacio({ f = 'x2' }: { f?: Base }) {
  const [base, setBase] = useState<Base>(BASES[f] ? f : 'x2');
  const [p, setP] = useState<P>({ a: 1, b: 1, c: 2, d: 1 });
  const { a, b, c, d } = p;
  const F = BASES[base];
  const g = (x: number) => a * F.f(b * (x - c)) + d;
  const [px, py] = F.p;
  const [qx, qy] = transformPoint(px, py, a, b, c, d);
  const steps = transformSteps(a, b, c, d);

  const draw = (pl: Plane) => {
    const C = pl.col;
    pl.fn(F.f, C.muted, 1.6);
    pl.fn(g, C.acc, 2.8);
    if (Math.hypot(qx - px, qy - py) > 0.3) pl.arrow(px, py, qx, qy, C.q4, 1.6);
    pl.dot(px, py, C.muted, 5);
    pl.dot(qx, qy, C.q1, 6);
    pl.text(qx, qy, 'P′', C.q1, 9, -10);
  };

  const slider = (key: keyof P, label: string, min: number, max: number) => (
    <label className="f" style={{ display: 'grid', gridTemplateColumns: '1.6em 1fr 3.2em', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--math)', fontSize: '1rem' }}>{label}</span>
      <input type="range" min={min} max={max} step={0.5} value={p[key]} onChange={(e) => setP({ ...p, [key]: Number(e.target.value) })} />
      <span className="mono">{n(p[key])}</span>
    </label>
  );

  return (
    <Bench
      title="Függvénytranszformációk"
      hint="A szürke görbe f, a színes g. Húzd a csúszkákat, és kövesd, hova kerül f kiemelt pontja (P → P′).">
      <div className="row">
        <span className="note">f(x) =</span>
        <Seg options={(Object.keys(BASES) as Base[]).map((k) => [k, BASES[k].label] as const)} value={base} onChange={setBase} />
      </div>
      <div className="row">
        <span className="note">Példák:</span>
        {PRESETS.map(([label, q]) => (
          <button key={label} type="button" className="btn sym" onClick={() => setP({ a: 1, b: 1, c: 0, d: 0, ...q })}>
            {label}
          </button>
        ))}
      </div>
      <div className="cols">
        <PlaneCanvas label="f és g grafikonja" options={{ xmin: -6, xmax: 6, ymin: -6, ymax: 6, equal: false, aspect: 0.85 }} draw={draw} />
        <div className="stack">
          <p className="line" style={{ margin: 0 }}>
            {formula(p)}
          </p>
          {slider('a', 'a', -3, 3)}
          <label className="f" style={{ display: 'grid', gridTemplateColumns: '1.6em 1fr 3.2em', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--math)', fontSize: '1rem' }}>b</span>
            <input
              type="range"
              min={0}
              max={B_VALUES.length - 1}
              step={1}
              value={Math.max(0, B_VALUES.indexOf(b))}
              onChange={(e) => setP({ ...p, b: B_VALUES[Number(e.target.value)] })}
            />
            <span className="mono">{n(b)}</span>
          </label>
          {slider('c', 'c', -5, 5)}
          {slider('d', 'd', -5, 5)}
          <div className="out">
            <p>
              <b>Lépések</b> (ebben a sorrendben):
            </p>
            {steps.length ? (
              <ol style={{ margin: 0 }}>
                {steps.map((s, i) => (
                  <li key={i}>
                    <span className="mono">{s.key}</span>: {s.text}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="note">Nincs transzformáció: g = f.</p>
            )}
            <p className="note">
              A kiemelt pont ({F.pName}): P = ({n(px)}, {n(py)}) → P′ = ({n(qx)}, {n(qy)}). Általában (x, y) ↦ (x / b + c, a·y + d).
            </p>
          </div>
        </div>
      </div>
      <div className="legend">
        <span style={{ ['--c' as string]: 'var(--muted)' }}>f</span>
        <span style={{ ['--c' as string]: 'var(--acc)' }}>g</span>
        <span style={{ ['--c' as string]: 'var(--q1)' }}>P′, a kiemelt pont képe</span>
      </div>
    </Bench>
  );
}
