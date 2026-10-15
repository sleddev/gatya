import { useState } from 'react';

import { fmt, MINUS, par } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';
import { derivative, fitPolynomial, horner, polyString } from '@/lib/poly';

import { Bench, Kv, PlaneCanvas, Seg } from './ui';

type Kind = 'egyenes' | 'kor' | 'hermite' | 'hipocikloid';
type P2 = [number, number];

const s = (x: number) => fmt(x).replace('-', MINUS);
const pt = ([x, y]: P2) => `(${s(x)}, ${s(y)})`;
/** "a + vt" with tidy signs: 3 + t, 2 − 2t, 4 */
const lin = (a: number, v: number) =>
  v === 0 ? s(a) : `${s(a)} ${v < 0 ? MINUS : '+'} ${Math.abs(v) === 1 ? '' : fmt(Math.abs(v))}t`;

/** Numeric derivative of a parametric curve (used for the hypocycloid; the others are exact). */
const numDiff = (f: (t: number) => P2, t: number): P2 => {
  const h = 1e-5;
  const [a, b] = f(t + h);
  const [c, d] = f(t - h);
  return [(a - c) / (2 * h), (b - d) / (2 * h)];
};

/**
 * A parametric curve x = x(t), y = y(t) with a t slider: the point at t (like a(t) in GeoGebra)
 * and, optionally, the tangent vector (x′(t), y′(t)) drawn from it.
 */
export function ParameteresGorbe({
  tipus = 'egyenes',
  tipusok,
  erinto = false,
}: {
  tipus?: Kind;
  /** let the reader switch between these curve types */
  tipusok?: Kind[];
  /** show the tangent vector at the current point */
  erinto?: boolean;
}) {
  const [kind, setKind] = useState<Kind>(tipus);
  const [A, setA] = useState<P2>([2, 3]);
  const [B, setB] = useState<P2>([4, 4]);
  const [range, setRange] = useState<'szakasz' | 'egyenes'>('szakasz');
  const [K, setK] = useState<P2>([2, 2]);
  const [r, setR] = useState(1.7);
  const [H, setH] = useState<P2[]>([
    [2, 4],
    [3, 6],
    [6, 5],
    [7, 3],
  ]);
  const [ab, setAb] = useState<P2>([8.5, 3.9]);
  const [showTan, setShowTan] = useState(erinto);
  const [t, setT] = useState(0.5);

  // Each curve: point function, exact derivative (if any), t range, GeoGebra lines, view.
  let f: (t: number) => P2;
  let df: (t: number) => P2;
  let t0: number;
  let t1: number;
  let tStep = 0.01;
  let rows: [string, string][] = [];
  let view = { xmin: -3, xmax: 8, ymin: 0, ymax: 7 };

  if (kind === 'egyenes') {
    const v: P2 = [B[0] - A[0], B[1] - A[1]];
    f = (t) => [A[0] + v[0] * t, A[1] + v[1] * t];
    df = () => v;
    [t0, t1] = range === 'szakasz' ? [0, 1] : [-2, 1.6];
    rows = [
      ['qx(t)', `(1 ${MINUS} t)·${par(A[0])} + t·${par(B[0])}  =  ${lin(A[0], v[0])}`],
      ['qy(t)', `(1 ${MINUS} t)·${par(A[1])} + t·${par(B[1])}  =  ${lin(A[1], v[1])}`],
      ['vec = B − A', pt(v)],
    ];
  } else if (kind === 'kor') {
    f = (t) => [r * Math.cos(t) + K[0], r * Math.sin(t) + K[1]];
    df = (t) => [-r * Math.sin(t), r * Math.cos(t)];
    [t0, t1] = [0, 2 * Math.PI];
    view = { xmin: -3, xmax: 7, ymin: -2, ymax: 6 };
    rows = [
      ['qx(t)', `${s(r)}·cos(t) + ${s(K[0])}`],
      ['qy(t)', `${s(r)}·sin(t) + ${s(K[1])}`],
    ];
  } else if (kind === 'hermite') {
    const ts = [-1, 0, 1, 2];
    const fx = fitPolynomial(ts.map((u, i) => [u, H[i][0]])) ?? [0];
    const fy = fitPolynomial(ts.map((u, i) => [u, H[i][1]])) ?? [0];
    const dx = derivative(fx);
    const dy = derivative(fy);
    f = (t) => [horner(fx, t), horner(fy, t)];
    df = (t) => [horner(dx, t), horner(dy, t)];
    [t0, t1] = [-1, 2];
    view = { xmin: 0, xmax: 10, ymin: 0, ymax: 7 };
    rows = [
      ['f(t)', polyString(fx.map((c) => +c.toFixed(3)), 't', false)],
      ['g(t)', polyString(fy.map((c) => +c.toFixed(3)), 't', false)],
    ];
  } else {
    const [a, b] = ab;
    const k = a / b - 1;
    f = (t) => [(a - b) * Math.cos(t) + b * Math.cos(k * t), (a - b) * Math.sin(t) - b * Math.sin(k * t)];
    df = (t) => numDiff(f, t);
    [t0, t1] = [0, 12 * Math.PI];
    tStep = 0.05;
    view = { xmin: -11.5, xmax: 11.5, ymin: -10, ymax: 10 };
    rows = [
      ['p(t)', `${s(a - b)}·cos(t) + ${s(b)}·cos(${s(k)}·t)`],
      ['q(t)', `${s(a - b)}·sin(t) ${MINUS} ${s(b)}·sin(${s(k)}·t)`],
    ];
  }

  const tt = Math.min(t1, Math.max(t0, t));
  const P = f(tt);
  const d = df(tt);

  const draw = (p: Plane) => {
    const C = p.col;
    const n = kind === 'hipocikloid' ? 1600 : 240;
    const pts: P2[] = [];
    for (let i = 0; i <= n; i++) pts.push(f(t0 + ((t1 - t0) * i) / n));
    p.polygon(pts, C.acc, 2.6, false);
    if (kind === 'egyenes') {
      p.dot(A[0], A[1], C.ink, 5);
      p.text(A[0], A[1], 'A (t = 0)', C.ink, 8, 14);
      p.dot(B[0], B[1], C.ink, 5);
      p.text(B[0], B[1], 'B (t = 1)', C.ink, 8, 14);
    }
    if (kind === 'kor') {
      p.dot(K[0], K[1], C.muted, 4);
      p.line(K[0], K[1], P[0], P[1], C.muted, 1.2, [4, 4]);
    }
    if (kind === 'hermite')
      H.forEach((q, i) => {
        p.dot(q[0], q[1], C.ink, 5);
        p.text(q[0], q[1], `${'ABCD'[i]} (t = ${[-1, 0, 1, 2][i]})`.replace('-', MINUS), C.ink, 8, -8);
      });
    if (showTan) p.arrow(P[0], P[1], P[0] + d[0], P[1] + d[1], C.q3, 2.4);
    p.dot(P[0], P[1], C.q1, 6);
    p.text(P[0], P[1], 'P', C.q1, -16, 18);
  };

  const drag: { get: () => P2; set: (x: number, y: number) => void }[] = [];
  const snap = (v: number) => Math.round(v * 2) / 2;
  if (kind === 'egyenes')
    drag.push({ get: () => A, set: (x, y) => setA([snap(x), snap(y)]) }, { get: () => B, set: (x, y) => setB([snap(x), snap(y)]) });
  if (kind === 'kor') drag.push({ get: () => K, set: (x, y) => setK([snap(x), snap(y)]) });
  if (kind === 'hermite')
    H.forEach((_, i) => drag.push({ get: () => H[i], set: (x, y) => setH(H.map((q, j) => (j === i ? [snap(x), snap(y)] : q))) }));

  const piLabel = kind === 'kor' || kind === 'hipocikloid' ? ` = ${fmt(tt / Math.PI, 2)}π` : '';
  const curveCmd =
    kind === 'egyenes'
      ? `a = Curve(qx(t), qy(t), t, ${s(t0)}, ${s(t1)})`
      : kind === 'kor'
        ? 'a = Curve(qx(t), qy(t), t, 0, 2pi)'
        : kind === 'hermite'
          ? 'a = Curve(f(t), g(t), t, t0, t3)'
          : 'c = Curve(p(t), q(t), t, 0, 12pi)';

  return (
    <Bench
      title="Paraméteres görbe"
      hint="Húzd a t csúszkát: a P pont végigfut a görbén. A fekete pontokat egérrel mozgathatod. Az érintővektor (x′(t), y′(t)) a mozgás irányába mutat, és annál hosszabb, minél gyorsabban halad a pont.">
      {tipusok && tipusok.length > 1 ? (
        <Seg
          options={tipusok.map((k) => [k, { egyenes: 'egyenes', kor: 'kör', hermite: 'Hermite-ív', hipocikloid: 'hipocikloid' }[k]] as const)}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setT(k === 'egyenes' ? 0.5 : k === 'hermite' ? 0 : Math.PI / 4);
          }}
        />
      ) : null}
      <div className="cols">
        <PlaneCanvas key={kind} label="A paraméteres görbe" options={{ ...view, equal: true, aspect: 0.8 }} points={drag} draw={draw} />
        <div className="stack">
          <label className="f">
            t = {fmt(tt, 2)}
            {piLabel}
            <input type="range" min={t0} max={t1} step={tStep} value={tt} onChange={(e) => setT(Number(e.target.value))} />
          </label>
          {kind === 'egyenes' ? (
            <Seg
              options={[
                ['szakasz', 't ∈ [0, 1]'],
                ['egyenes', 't ∈ [−2, 1,6]'],
              ]}
              value={range}
              onChange={setRange}
            />
          ) : null}
          {kind === 'kor' ? (
            <label className="f">
              sugár = {fmt(r, 1)}
              <input type="range" min={0.5} max={3} step={0.1} value={r} onChange={(e) => setR(Number(e.target.value))} />
            </label>
          ) : null}
          {kind === 'hipocikloid'
            ? (['a', 'b'] as const).map((k, i) => (
                <label key={k} className="f">
                  {k} = {fmt(ab[i], 1)}
                  <input
                    type="range"
                    min={i ? 1 : 4}
                    max={i ? 6 : 10}
                    step={0.1}
                    value={ab[i]}
                    onChange={(e) => setAb(ab.map((v, j) => (j === i ? Number(e.target.value) : v)) as P2)}
                  />
                </label>
              ))
            : null}
          <label className="row">
            <input type="checkbox" checked={showTan} onChange={(e) => setShowTan(e.target.checked)} /> érintővektor
          </label>
          <Kv
            rows={[
              ...rows,
              ['GeoGebra', curveCmd],
              [`P = ${kind === 'hipocikloid' ? 'c' : 'a'}(${fmt(tt, 2)})`, pt(P)],
              ...(showTan ? ([['(x′(t), y′(t))', pt(d)]] as [string, string][]) : []),
            ]}
          />
          <div className="legend">
            <span style={{ ['--c' as string]: 'var(--acc)' }}>görbe</span>
            <span style={{ ['--c' as string]: 'var(--q1)' }}>P = a(t)</span>
            {showTan ? <span style={{ ['--c' as string]: 'var(--q3)' }}>érintővektor</span> : null}
          </div>
        </div>
      </div>
    </Bench>
  );
}
