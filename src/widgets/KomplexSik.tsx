import { useState, type ReactNode } from 'react';

import { absText, angleText, arg, complexText } from '@/lib/complex';
import { fmt, sup } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';

import { Bench, Kv, NumField, PlaneCanvas, Seg } from './ui';

type Mode = 'egy' | 'szorzas' | 'hatvany' | 'gyok' | 'egyseg';
const MODES: [Mode, string][] = [
  ['egy', 'Egy szám'],
  ['szorzas', 'Szorzás z·w'],
  ['hatvany', 'Hatványok zⁿ'],
  ['gyok', 'n-edik gyökök'],
  ['egyseg', 'Egységgyökök'],
];

const ang = (phi: number) => angleText(phi).text;

/** The Gauss plane: drag z (and w), see algebraic/trigonometric forms, products, powers and roots. */
export function KomplexSik({
  mod: mode0 = 'egy',
  z = [1, 1.732],
  w = [-1, 1],
  n: n0 = 3,
  modok,
}: {
  mod?: Mode;
  z?: [number, number];
  w?: [number, number];
  n?: number;
  modok?: Mode[];
}) {
  const [mode, setMode] = useState<Mode>(mode0);
  const [a, setA] = useState(z[0]);
  const [b, setB] = useState(z[1]);
  const [c, setC] = useState(w[0]);
  const [d, setD] = useState(w[1]);
  const [n, setN] = useState(n0);
  const [snap, setSnap] = useState(true);
  const modes = modok ? MODES.filter(([k]) => modok.includes(k)) : MODES;
  const r = Math.hypot(a, b);
  const phi = arg(a, b);

  const draw = (p: Plane) => {
    const C = p.col;
    p.text(p.o.xmax - 0.1, 0, 'Re', C.muted, -4, -10, 'right');
    p.text(0, p.y1 - 0.05, 'Im', C.muted, 8, 10);
    if (mode === 'egyseg') {
      p.circle(0, 0, 1, C.axis, [4, 4]);
      const pts = Array.from({ length: n }, (_, k) => [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)] as [number, number]);
      p.polygon(pts, C.acc);
      pts.forEach(([x, y], k) => {
        p.dot(x, y, C.acc, 5);
        p.text(x, y, `ε${k}`, C.ink, x >= 0 ? 8 : -26, y >= 0 ? -10 : 12);
      });
      return;
    }
    if (mode === 'egy') {
      p.line(a, 0, a, b, C.axis, 1, [2, 3]);
      p.line(0, b, a, b, C.axis, 1, [2, 3]);
      p.line(a, b, a, -b, C.axis, 1, [3, 4]);
      p.arrow(0, 0, a, -b, C.muted, 1.6);
      p.text(a, -b, 'z̄', C.muted);
      if (r > 0.05) {
        p.angleArc(0, 0, 0, phi, 26, C.q4);
        p.text(0, 0, 'φ', C.q4, 32 * Math.cos(phi / 2), -32 * Math.sin(phi / 2));
      }
    }
    if (mode === 'szorzas') {
      const pr: [number, number] = [a * c - b * d, a * d + b * c];
      p.arrow(0, 0, c, d, C.q1);
      p.handle(c, d, C.q1);
      p.text(c, d, 'w', C.q1);
      p.arrow(0, 0, pr[0], pr[1], C.q3, 2.8);
      p.dot(pr[0], pr[1], C.q3);
      p.text(pr[0], pr[1], 'z·w', C.q3);
    }
    if (mode === 'hatvany') {
      let x = a,
        y = b;
      const pts: [number, number][] = [
        [1, 0],
        [a, b],
      ];
      for (let k = 2; k <= n; k++) {
        [x, y] = [x * a - y * b, x * b + y * a];
        pts.push([x, y]);
      }
      p.polygon(pts, C.q3, 1.3, false, [3, 3]);
      pts.slice(2).forEach(([u, v], i) => {
        p.dot(u, v, C.q3, 4);
        p.text(u, v, `z${sup(i + 2)}`, C.q3);
      });
    }
    if (mode === 'gyok' && r > 1e-9) {
      const R = Math.pow(r, 1 / n);
      p.circle(0, 0, R, C.axis, [4, 4]);
      const pts = Array.from({ length: n }, (_, k) => {
        const t = (phi + 2 * k * Math.PI) / n;
        return [R * Math.cos(t), R * Math.sin(t)] as [number, number];
      });
      p.polygon(pts, C.q3);
      pts.forEach(([x, y], k) => {
        p.dot(x, y, C.q3, 5);
        p.text(x, y, `w${k}`, C.q3, x >= 0 ? 8 : -26, y >= 0 ? -10 : 12);
      });
    }
    p.arrow(0, 0, a, b, C.acc, 2.8);
    p.handle(a, b, C.acc);
    p.text(a, b, 'z', C.acc);
  };

  const snapStep = snap ? 0.5 : 0;
  const points = [
    { get: () => [a, b] as [number, number], set: (x: number, y: number) => (setA(x), setB(y)), active: () => mode !== 'egyseg', snap: snapStep },
    { get: () => [c, d] as [number, number], set: (x: number, y: number) => (setC(x), setD(y)), active: () => mode === 'szorzas', snap: snapStep },
  ];

  const quadrant = r < 1e-9 ? 'origó' : a > 0 && b >= 0 ? 'I.' : a <= 0 && b > 0 ? 'II.' : a < 0 && b <= 0 ? 'III.' : 'IV.';
  let info;
  if (mode === 'egyseg') {
    info = (
      <>
        <p>
          Az 1 = cos 0 + i sin 0 n-edik gyökei: εₖ = cos(2kπ/{n}) + i sin(2kπ/{n}). Szabályos {n}-szöget alkotnak az egységkörön, és
          ε₀ = 1 mindig.
        </p>
        <Kv
          rows={Array.from({ length: n }, (_, k) => {
            const t = (2 * Math.PI * k) / n;
            return [`ε${k}`, <>{complexText(Math.cos(t), Math.sin(t))} <span className="note">szög: {ang(t)}</span></>];
          })}
        />
      </>
    );
  } else {
    const rows: [string, ReactNode][] = [
      ['algebrai alak', `z = ${complexText(a, b)}`],
      ['|z|', `√(${fmt(a)}² + ${fmt(b)}²) = ${absText(a, b)}`],
    ];
    if (r > 1e-9) {
      const phi0 = Math.acos(Math.abs(a) / r);
      rows.push(
        ['síknegyed', quadrant],
        ['φ₀', `cos φ₀ = |a|/|z| ⇒ φ₀ = ${ang(phi0)}`],
        ['φ', <>{ang(phi)} <span className="note">({angleText(phi).degrees})</span></>],
        ['trigonometrikus alak', `${absText(a, b)}·(cos ${ang(phi)} + i·sin ${ang(phi)})`]
      );
    }
    rows.push(['konjugált', `z̄ = ${complexText(a, -b)},  z·z̄ = ${fmt(a * a + b * b)}`]);
    info = <Kv rows={rows} />;
  }

  let extra = null;
  if (mode === 'szorzas') {
    const pr = [a * c - b * d, a * d + b * c];
    const r2 = Math.hypot(c, d),
      p2 = arg(c, d);
    extra = (
      <>
        <p>
          <b>Szorzás</b> w = {complexText(c, d)}-vel:
        </p>
        <div className="line">
          ({fmt(a)}·{fmt(c)} − {fmt(b)}·{fmt(d)}) + ({fmt(a)}·{fmt(d)} + {fmt(b)}·{fmt(c)})i = {complexText(pr[0], pr[1])}
        </div>
        <p>
          Trigonometrikusan: a hosszak szorzódnak ({fmt(r)} · {fmt(r2)} = {fmt(r * r2)}), a szögek összeadódnak ({ang(phi)} + {ang(p2)} ={' '}
          {ang(phi + p2)}).
        </p>
      </>
    );
  }
  if (mode === 'hatvany' && r > 1e-9) {
    const R = r ** n,
      P = phi * n;
    extra = (
      <>
        <p>
          <b>Moivre-képlet</b>: z<sup>{n}</sup> = |z|<sup>{n}</sup>(cos {n}φ + i sin {n}φ)
        </p>
        <div className="line">
          = {fmt(R)}·(cos {ang(P)} + i sin {ang(P)}) = {complexText(R * Math.cos(P), R * Math.sin(P))}
        </div>
        <p className="note">Ha |z| &gt; 1, a hatványok kifelé csavarodnak; ha |z| &lt; 1, befelé; ha |z| = 1, az egységkörön maradnak.</p>
      </>
    );
  }
  if (mode === 'gyok' && r > 1e-9) {
    const R = Math.pow(r, 1 / n);
    extra = (
      <>
        <p>
          <b>{n}-edik gyökök</b>: wₖ = {fmt(R)}·(cos((φ + 2kπ)/{n}) + i sin((φ + 2kπ)/{n})), k = 0…{n - 1}
        </p>
        <Kv
          rows={Array.from({ length: n }, (_, k) => {
            const t = (phi + 2 * k * Math.PI) / n;
            return [`w${k}`, <>{complexText(R * Math.cos(t), R * Math.sin(t))} <span className="note">szög: {ang(t)}</span></>];
          })}
        />
      </>
    );
  }

  return (
    <Bench
      title="A Gauss-féle számsík"
      hint="Húzd a pontokat (rácsra illeszkednek), vagy írj be pontos értékeket. A módok közt váltva látszik a szorzás, a hatványozás és a gyökvonás.">
      {modes.length > 1 ? <Seg options={modes} value={mode} onChange={setMode} /> : null}
      <div className="cols">
        <div className="stack">
          <PlaneCanvas
            label="Komplex számsík"
            options={{ xmin: -4.2, xmax: 4.2, ymin: -3, ymax: 3, aspect: 0.72 }}
            points={points}
            draw={draw}
          />
          <div className="row">
            {mode !== 'egyseg' ? (
              <>
                <NumField label="Re z" value={a} onChange={setA} step={0.1} width="5.5em" />
                <NumField label="Im z" value={b} onChange={setB} step={0.1} width="5.5em" />
              </>
            ) : null}
            {mode === 'szorzas' ? (
              <>
                <NumField label="Re w" value={c} onChange={setC} step={0.1} width="5.5em" />
                <NumField label="Im w" value={d} onChange={setD} step={0.1} width="5.5em" />
              </>
            ) : null}
            {mode === 'hatvany' || mode === 'gyok' || mode === 'egyseg' ? (
              <label className="f" style={{ minWidth: 140 }}>
                n = {n}
                <input type="range" min={2} max={10} value={n} onChange={(e) => setN(Number(e.target.value))} />
              </label>
            ) : null}
            <label className="note">
              <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} /> rácsra illesztés
            </label>
          </div>
        </div>
        <div className="out">
          {info}
          {extra}
        </div>
      </div>
    </Bench>
  );
}
