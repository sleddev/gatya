import { useState } from 'react';

import { absText } from '@/lib/complex';
import { fmt, mod, par, sgn } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';

import { Bench, Chip, Kv, PlaneCanvas, Seg } from './ui';

type Mode = 'pontok' | 'osszeg' | 'skalar' | 'szorzat';
const MODES: [Mode, string][] = [
  ['pontok', 'Két pont'],
  ['osszeg', 'Összeg u + v'],
  ['skalar', 'Skalárszoros k·u'],
  ['szorzat', 'Skaláris szorzat, szög'],
];
type V = [number, number];
const len = (v: V) => Math.hypot(v[0], v[1]);

/** 2D vectors with draggable tips; each mode shows the lab handout's computation with your numbers. */
export function VektorLabor({ mod: mode0 = 'pontok', modok }: { mod?: Mode; modok?: Mode[] }) {
  const [mode, setMode] = useState<Mode>(mode0);
  const [A, setA] = useState<V>([2, 3]);
  const [B, setB] = useState<V>([5, 7]);
  const [u, setU] = useState<V>([3, 4]);
  const [v, setV] = useState<V>([5, 2]);
  const [k, setK] = useState(2);
  const modes = modok ? MODES.filter(([m]) => modok.includes(m)) : MODES;

  const draw = (p: Plane) => {
    const C = p.col;
    if (mode === 'pontok') {
      p.line(A[0], A[1], B[0], A[1], C.axis, 1, [3, 3]);
      p.line(B[0], A[1], B[0], B[1], C.axis, 1, [3, 3]);
      p.arrow(A[0], A[1], B[0], B[1], C.acc);
      p.handle(A[0], A[1], C.q1);
      p.handle(B[0], B[1], C.q1);
      p.text(A[0], A[1], 'A', C.q1, -16, 10);
      p.text(B[0], B[1], 'B', C.q1);
      p.text((A[0] + B[0]) / 2, A[1], `Δx = ${fmt(B[0] - A[0])}`, C.muted, -20, 12);
      p.text(B[0], (A[1] + B[1]) / 2, `Δy = ${fmt(B[1] - A[1])}`, C.muted, 8, 0);
      return;
    }
    if (mode === 'osszeg') {
      const w: V = [u[0] + v[0], u[1] + v[1]];
      p.line(u[0], u[1], w[0], w[1], C.axis, 1.4, [4, 4]);
      p.line(v[0], v[1], w[0], w[1], C.axis, 1.4, [4, 4]);
      p.arrow(0, 0, w[0], w[1], C.q3, 2.8);
      p.text(w[0], w[1], 'u + v', C.q3);
    }
    if (mode === 'skalar') {
      p.arrow(0, 0, k * u[0], k * u[1], C.q3, 5);
      p.text(k * u[0], k * u[1], 'k·u', C.q3);
      p.arrow(0, 0, u[0], u[1], C.acc);
      p.handle(u[0], u[1], C.acc);
      p.text(u[0], u[1], 'u', C.acc);
      return;
    }
    if (mode === 'szorzat') {
      if (len(u) && len(v)) {
        let a1 = Math.atan2(u[1], u[0]),
          a2 = Math.atan2(v[1], v[0]);
        if (mod(a2 - a1, 2 * Math.PI) > Math.PI) [a1, a2] = [a2, a1];
        p.angleArc(0, 0, a1, a2, 30, C.q4);
        const L = len(v);
        const t = (u[0] * v[0] + u[1] * v[1]) / (L * L);
        p.line(u[0], u[1], t * v[0], t * v[1], C.axis, 1, [3, 3]);
      }
    }
    p.arrow(0, 0, v[0], v[1], C.q1);
    p.handle(v[0], v[1], C.q1);
    p.text(v[0], v[1], 'v', C.q1);
    p.arrow(0, 0, u[0], u[1], C.acc);
    p.handle(u[0], u[1], C.acc);
    p.text(u[0], u[1], 'u', C.acc);
  };

  const points = [
    { get: () => A, set: (x: number, y: number) => setA([x, y]), active: () => mode === 'pontok' },
    { get: () => B, set: (x: number, y: number) => setB([x, y]), active: () => mode === 'pontok' },
    { get: () => u, set: (x: number, y: number) => setU([x, y]), active: () => mode !== 'pontok' },
    { get: () => v, set: (x: number, y: number) => setV([x, y]), active: () => mode === 'osszeg' || mode === 'szorzat' },
  ];

  let info;
  if (mode === 'pontok') {
    const dx = B[0] - A[0],
      dy = B[1] - A[1];
    info = (
      <>
        <Kv
          rows={[
            ['pontok', `A(${A.map(sgn).join(', ')}), B(${B.map(sgn).join(', ')})`],
            ['távolság', `d = √((${par(B[0])} − ${par(A[0])})² + (${par(B[1])} − ${par(A[1])})²) = √(${dx * dx} + ${dy * dy}) = ${absText(dx, dy)}`],
            ['AB⃗ vektor', `(${par(B[0])} − ${par(A[0])}, ${par(B[1])} − ${par(A[1])}) = (${sgn(dx)}, ${sgn(dy)})`],
            ['GeoGebra', 'u = Vector(A, B),  Distance(A, B)'],
          ]}
        />
        <p className="note">A távolság éppen az AB⃗ vektor hossza: ugyanaz a Pitagorasz-képlet.</p>
      </>
    );
  } else if (mode === 'osszeg') {
    info = (
      <>
        <Kv
          rows={[
            ['u, v', `(${u.map(sgn).join(', ')}), (${v.map(sgn).join(', ')})`],
            ['u + v', `(${par(u[0])} + ${par(v[0])}, ${par(u[1])} + ${par(v[1])}) = (${sgn(u[0] + v[0])}, ${sgn(u[1] + v[1])})`],
            ['‖u‖', `√(${u[0] ** 2} + ${u[1] ** 2}) = ${absText(u[0], u[1])}`],
            ['‖u + v‖', `${absText(u[0] + v[0], u[1] + v[1])} ≤ ‖u‖ + ‖v‖ = ${fmt(len(u) + len(v))}`],
            ['GeoGebra', 'w = u + v,  Length(u)'],
          ]}
        />
        <p className="note">A szaggatott oldalak kiegészítik paralelogrammává: u után v ugyanoda visz, mint v után u.</p>
      </>
    );
  } else if (mode === 'skalar') {
    info = (
      <Kv
        rows={[
          ['k · u', `${sgn(k)}·(${u.map(sgn).join(', ')}) = (${fmt(k * u[0])}, ${fmt(k * u[1])})`],
          ['‖k·u‖', `|k|·‖u‖ = ${fmt(Math.abs(k))}·${absText(u[0], u[1])} = ${fmt(Math.abs(k) * len(u))}`],
          ['irány', k > 0 ? 'ugyanaz, mint u' : k < 0 ? 'u-val ellentétes' : 'k = 0: nullvektor'],
          ['GeoGebra', 'b = k * u  (k csúszka)'],
        ]}
      />
    );
  } else {
    const d = u[0] * v[0] + u[1] * v[1],
      lu = len(u),
      lv = len(v);
    const cs = lu && lv ? d / (lu * lv) : NaN;
    const ang = (Math.acos(Math.max(-1, Math.min(1, cs))) * 180) / Math.PI;
    info = (
      <>
        <Kv
          rows={[
            ['u · v', `${par(u[0])}·${par(v[0])} + ${par(u[1])}·${par(v[1])} = ${sgn(d)}`],
            ['‖u‖, ‖v‖', `${absText(u[0], u[1])}, ${absText(v[0], v[1])}`],
            ['cos α', Number.isFinite(cs) ? `${sgn(d)} / (${absText(u[0], u[1])} · ${absText(v[0], v[1])}) = ${fmt(cs, 4)}` : 'nem értelmezett (nullvektor)'],
            ['α', Number.isFinite(cs) ? `${fmt(ang, 2)}°` : '–'],
            ['GeoGebra', 'Dot(u, v),  Angle(u, v)'],
          ]}
        />
        <p>
          {d === 0 && lu && lv ? (
            <Chip kind="ok">u · v = 0 → merőlegesek</Chip>
          ) : d > 0 ? (
            <Chip kind="mid">u · v &gt; 0 → hegyesszög</Chip>
          ) : (
            <Chip kind="mid">u · v &lt; 0 → tompaszög</Chip>
          )}
        </p>
        <p className="note">A szaggatott vonal u merőleges vetülete v egyenesére; a vetület előjeles hossza u·v / ‖v‖.</p>
      </>
    );
  }

  return (
    <Bench title="Vektorlabor" hint="Húzd a nyilak végét (egész koordinátákra illeszkednek). Minden mód a gyakorlati jegyzet számolását mutatja a te számaiddal.">
      {modes.length > 1 ? <Seg options={modes} value={mode} onChange={setMode} /> : null}
      <div className="cols">
        <div className="stack">
          <PlaneCanvas label="Vektorok a síkon" options={{ xmin: -4, xmax: 10, ymin: -3, ymax: 9, aspect: 0.78, snap: 1 }} points={points} draw={draw} />
          {mode === 'skalar' ? (
            <label className="f">
              k = {sgn(k)}
              <input type="range" min={-3} max={3} step={0.5} value={k} onChange={(e) => setK(Number(e.target.value))} />
            </label>
          ) : null}
        </div>
        <div className="out">{info}</div>
      </div>
    </Bench>
  );
}
