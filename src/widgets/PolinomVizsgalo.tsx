import { useState } from 'react';

import { fmt, MINUS } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';
import { derivative, extrema, horner, polyString, roots } from '@/lib/poly';

import { Bench, Kv, PlaneCanvas } from './ui';

type Coefs = { a: number; b: number; c: number; d: number; e: number };

const PRESETS: [string, number, Partial<Coefs>][] = [
  ['másodfokú', 2, { a: 1, b: -2, c: -3 }],
  ['harmadfokú, 2 szélsőérték', 3, { a: 1, b: 0, c: -3, d: 1 }],
  ['harmadfokú, nincs szélsőérték', 3, { a: 0.5, b: 0, c: 1, d: -2 }],
  ['negyedfokú, 4 gyök', 4, { a: 1, b: 0, c: -5, d: 0, e: 4 }],
  ['negyedfokú, 1 minimum', 4, { a: 0.2, b: 0, c: 0.5, d: -1, e: -2 }],
  ['kétszeres gyök', 2, { a: 1, b: -2, c: 1 }],
];

/** Polynomial of degree 2–4 with sliders: roots, extrema, y-intercept and a draggable tangent (like the GeoGebra files). */
export function PolinomVizsgalo({ fok = 3, egyutthatok }: { fok?: 2 | 3 | 4; egyutthatok?: number[] }) {
  const init: Coefs = { a: 1, b: 0, c: -3, d: 1, e: 0 };
  if (egyutthatok) 'abcde'.split('').forEach((k, i) => (init[k as keyof Coefs] = egyutthatok[i] ?? 0));
  const [deg, setDeg] = useState<number>(fok);
  const [co, setCo] = useState<Coefs>(init);
  const [x0, setX0] = useState(1);
  const keys = 'abcde'.slice(0, deg + 1).split('') as (keyof Coefs)[];
  const coefs = keys.map((k) => co[k]);
  const d = derivative(coefs);
  const rs = roots(coefs);
  const ex = extrema(coefs);
  const y0 = horner(coefs, x0);
  const m = horner(d, x0);
  const b = y0 - m * x0;

  const draw = (p: Plane) => {
    const C = p.col;
    p.fn((x) => horner(coefs, x), C.acc, 2.6);
    p.fn((x) => y0 + m * (x - x0), C.q1, 1.6);
    rs.forEach((r) => p.dot(r, 0, C.bad, 5));
    ex.forEach((e) => {
      p.dot(e.x, e.y, C.good, 5);
      p.text(e.x, e.y, e.kind, C.good, 6, e.kind === 'max' ? -12 : 14);
    });
    p.dot(0, coefs[coefs.length - 1], C.muted, 4);
    p.handle(x0, y0, C.q1);
    p.text(x0, y0, 'P', C.q1, 8, 12);
  };

  return (
    <Bench
      title="Polinom vizsgálata"
      hint="Mozgasd a csúszkákat: figyeld, hogyan jelennek meg és olvadnak össze a gyökök. A kétszeres gyök ott van, ahol egy szélsőérték éppen a tengelyen ül. A P pontot húzva az érintő is mozog.">
      <div className="row">
        <span className="note">Betöltés:</span>
        {PRESETS.map(([label, dg, c]) => (
          <button
            key={label}
            type="button"
            className="btn"
            onClick={() => {
              setDeg(dg);
              setCo({ a: 0, b: 0, c: 0, d: 0, e: 0, ...c });
            }}>
            {label}
          </button>
        ))}
      </div>
      <div className="cols">
        <PlaneCanvas
          label="A polinom grafikonja"
          options={{ xmin: -6, xmax: 6, ymin: -8, ymax: 8, equal: false, aspect: 0.8 }}
          points={[{ get: () => [x0, y0], set: (x) => setX0(Math.round(x * 10) / 10) }]}
          draw={draw}
        />
        <div className="stack">
          <label className="f">
            fokszám
            <select value={deg} onChange={(e) => setDeg(Number(e.target.value))}>
              {[2, 3, 4].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {keys.map((k) => (
            <label key={k} className="f" style={{ gridTemplateColumns: '1.6em 1fr 3.4em', alignItems: 'center', display: 'grid', gap: 8 }}>
              <span style={{ fontFamily: 'var(--math)', fontSize: '1rem' }}>{k}</span>
              <input type="range" min={-5} max={5} step={0.1} value={co[k]} onChange={(e) => setCo({ ...co, [k]: Number(e.target.value) })} />
              <span className="mono">{fmt(co[k], 1)}</span>
            </label>
          ))}
          <label className="f">
            érintő x₀ = {fmt(x0, 1)}
            <input type="range" min={-5} max={5} step={0.1} value={x0} onChange={(e) => setX0(Number(e.target.value))} />
          </label>
          <Kv
            rows={[
              ['f(x)', polyString(coefs.map((v) => +v.toFixed(1)), 'x', false)],
              ["f′(x)", polyString(d.map((v) => +v.toFixed(2)), 'x', false)],
              ['Root(f)', rs.length ? rs.map((r) => fmt(r)).join(', ') : 'nincs valós gyök'],
              ['Extremum(f)', ex.length ? ex.map((e) => `${e.kind} (${fmt(e.x)}, ${fmt(e.y)})`).join('; ') : 'nincs (f′ nem vált előjelet)'],
              ['y-tengelymetszet', `(0, ${fmt(coefs[coefs.length - 1])})`],
              ['érintő x₀-ban', `m = f′(${fmt(x0, 1)}) = ${fmt(m)},  y = ${fmt(m)}x ${b < 0 ? MINUS : '+'} ${fmt(Math.abs(b))}`],
            ]}
          />
          <div className="legend">
            <span style={{ ['--c' as string]: 'var(--acc)' }}>f</span>
            <span style={{ ['--c' as string]: 'var(--q1)' }}>érintő</span>
            <span style={{ ['--c' as string]: 'var(--bad)' }}>gyökök</span>
            <span style={{ ['--c' as string]: 'var(--good)' }}>szélsőértékek</span>
          </div>
        </div>
      </div>
    </Bench>
  );
}
