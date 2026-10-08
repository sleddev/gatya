import { useState } from 'react';

import { diophantine, sgn } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';

import { Bench, Chip, NumField, PlaneCanvas } from './ui';

const par = (x: number) => (x < 0 ? `(${sgn(x)})` : String(x));

/**
 * The line a·x + b·y = c on the integer grid: the solutions are exactly the grid points on it,
 * one step (b/d, −a/d) apart.
 */
export function DiofantikusRacs({ a: a0 = 7, b: b0 = 8, c: c0 = 284 }: { a?: number; b?: number; c?: number }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [c, setC] = useState(c0);
  const A = Math.trunc(a),
    B = Math.trunc(b),
    C = Math.trunc(c);
  const ok = A !== 0 && B !== 0 && Math.max(Math.abs(A), Math.abs(B), Math.abs(C)) <= 100000;
  const r = ok ? diophantine(A, B, C) : null;

  // Window: the first quadrant segment when it exists, otherwise a few steps around one solution.
  let win = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };
  const positive = A > 0 && B > 0 && C > 0;
  if (r?.solvable) {
    if (positive && C / A <= 120 && C / B <= 120) {
      const m = Math.max(C / A, C / B);
      win = { xmin: -m * 0.08, xmax: m * 1.08, ymin: -m * 0.08, ymax: m * 1.08 };
    } else {
      const span = Math.max(Math.abs(r.dx), Math.abs(r.dy)) * 2.5 + 3;
      win = { xmin: r.x - span, xmax: r.x + span, ymin: r.y - span, ymax: r.y + span };
    }
  }

  const sols: [number, number][] = [];
  if (r?.solvable) {
    const lo = Math.floor(Math.min((win.xmin - r.x) / r.dx, (win.xmax - r.x) / r.dx)) - 1;
    const hi = Math.ceil(Math.max((win.xmin - r.x) / r.dx, (win.xmax - r.x) / r.dx)) + 1;
    for (let t = lo; t <= hi && sols.length < 400; t++) sols.push([r.x + r.dx * t, r.y - r.dy * t]);
  }
  const inQ = sols.filter(([x, y]) => x >= 0 && y >= 0);

  const draw = (p: Plane) => {
    const col = p.col;
    if (win.xmax - win.xmin <= 24) {
      for (let x = Math.ceil(win.xmin); x <= win.xmax; x++)
        for (let y = Math.ceil(win.ymin); y <= win.ymax; y++) p.dot(x, y, col.grid, 1.6, false);
    }
    p.fn((x) => (C - A * x) / B, col.acc, 2.2);
    if (!r?.solvable) return;
    sols.forEach(([x, y]) => p.dot(x, y, x >= 0 && y >= 0 && positive ? col.good : col.q1, 4.5));
    const [x1, y1] = [r.x, r.y];
    const [x2, y2] = [r.x + r.dx, r.y - r.dy];
    p.arrow(x1, y1, x2, y2, col.q4, 2);
    p.line(x1, y1, x2, y1, col.q4, 1.2, [4, 3]);
    p.line(x2, y1, x2, y2, col.q4, 1.2, [4, 3]);
    p.text((x1 + x2) / 2, y1, `${sgn(r.dx)}`, col.q4, 0, r.dy > 0 ? 12 : -12, 'center');
    p.text(x2, (y1 + y2) / 2, `${sgn(-r.dy)}`, col.q4, 8, 0);
  };

  return (
    <Bench
      title="Megoldások a rácson"
      hint="Az ax + by = c egyenes pontjai közül azok a megoldások, amelyek rácspontok (mindkét koordináta egész). Ezek egyforma lépésekkel követik egymást.">
      <div className="row">
        <NumField label="a" value={a} onChange={setA} />
        <NumField label="b" value={b} onChange={setB} />
        <NumField label="c" value={c} onChange={setC} />
      </div>
      {!ok ? (
        <p className="err">a és b ne legyen 0, és a számok legyenek legfeljebb 100 000.</p>
      ) : (
        <>
          <PlaneCanvas
            key={`${A},${B},${C}`}
            label={`A ${A}x + ${B}y = ${C} egyenes és egész pontjai`}
            options={{ ...win, equal: true, aspect: 1 }}
            draw={draw}
          />
          <div className="out">
            {!r?.solvable ? (
              <p>
                <Chip kind="no">nincs egész megoldás</Chip> ({A}, {B}) = {r?.g}, és {r?.g} ∤ {sgn(C)}. Az egyenes egyetlen rácsponton sem megy át.
              </p>
            ) : (
              <>
                <p>
                  <Chip kind="ok">van megoldás</Chip> d = ({A}, {B}) = {r.g}, és {r.g} | {sgn(C)}. Egy megoldás: ({sgn(r.x)}, {sgn(r.y)}).
                </p>
                <p>
                  A szomszédos rácspontok között a lépés mindig ugyanaz:{' '}
                  <b style={{ color: 'var(--q4)' }}>
                    Δx = {sgn(r.dx)}, Δy = {sgn(-r.dy)}
                  </b>{' '}
                  (b/d és −a/d). Ennél kisebb lépés nincs: ennyi kell ahhoz, hogy {par(A)}·Δx és {par(B)}·Δy kiejtse egymást.
                </p>
                <p className="line">
                  x = {sgn(r.x)} + {par(r.dx)}t, y = {sgn(r.y)} − {par(r.dy)}t, t ∈ ℤ
                </p>
                {positive ? (
                  <p>
                    Nemnegatív megoldások (zöld pontok): {inQ.length ? inQ.map(([x, y]) => `(${x}, ${y})`).join(', ') : 'nincs'}.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </Bench>
  );
}
