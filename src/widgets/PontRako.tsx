// Tap a lattice point on a coordinate grid (or the Gauss plane with `komplex`). With `kezdo`, the
// answer is drawn as an arrow from that point, so it works for "draw the vector u + v" as well.
import { useState, type MouseEvent, type ReactNode } from 'react';

import { sgn } from '@/lib/numbers';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

type P = [number, number];
type Mark = { p: P; cimke?: string };
type Arrow = { a: P; b: P; cimke?: string };

const show = (p: P, komplex: boolean) => {
  if (!komplex) return `(${sgn(p[0])}; ${sgn(p[1])})`;
  const [a, b] = p;
  if (b === 0) return sgn(a);
  const im = Math.abs(b) === 1 ? 'i' : `${Math.abs(b)}i`;
  if (a === 0) return (b < 0 ? '−' : '') + im;
  return `${sgn(a)} ${b < 0 ? '−' : '+'} ${im}`;
};

export function PontRako({
  children,
  cel,
  meret = 5,
  komplex = false,
  kezdo,
  pontok = [],
  nyilak = [],
  hibak = {},
  magyarazat,
}: {
  children?: ReactNode;
  /** the point to find */
  cel: P;
  /** the grid runs from −meret to meret on both axes */
  meret?: number;
  /** Gauss plane: axes Re / Im, points read as a + bi */
  komplex?: boolean;
  /** draw the answer as an arrow starting here */
  kezdo?: P;
  /** fixed labelled points to show */
  pontok?: Mark[];
  /** fixed labelled arrows to show */
  nyilak?: Arrow[];
  /** typical wrong points ("x;y") → what went wrong */
  hibak?: Record<string, string>;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const [pt, setPt] = useState<P | null>(null);
  const [msg, setMsg] = useState<ReactNode>(null);
  const m = meret;
  const pad = 0.7;
  const size = 2 * m + 2 * pad;
  // svg coordinates: x right, y down
  const X = (x: number) => x + m + pad;
  const Y = (y: number) => m + pad - y;
  const shown: P | null = ex.shown ? cel : pt;

  const onClick = (e: MouseEvent<SVGSVGElement>) => {
    if (ex.done) return;
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const x = Math.round(q.x - m - pad);
    const y = Math.round(m + pad - q.y);
    if (Math.abs(x) > m || Math.abs(y) > m) return;
    setPt([x, y]);
    setMsg(null);
  };

  const check = () => {
    if (!pt) return;
    if (pt[0] === cel[0] && pt[1] === cel[1]) {
      setMsg(null);
      return ex.solve();
    }
    ex.miss();
    const hint = hibak[`${pt[0]};${pt[1]}`];
    const which =
      pt[0] === cel[0] ? (komplex ? 'A valós rész jó, a képzetes nem.' : 'Az x jó, az y nem.') : pt[1] === cel[1] ? (komplex ? 'A képzetes rész jó, a valós nem.' : 'Az y jó, az x nem.') : '';
    setMsg(
      <Feedback kind="no">
        Ez a(z) <b className="num">{show(pt, komplex)}</b> {komplex ? 'szám' : 'pont'}. {hint ?? which}
      </Feedback>
    );
  };

  const ticks = Array.from({ length: 2 * m + 1 }, (_, i) => i - m);
  const arrow = (a: P, b: P, cls: string, key: string, label?: string) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) return null;
    const ux = dx / len;
    const uy = dy / len;
    const h = 0.38;
    const tip: P = [b[0], b[1]];
    const l: P = [b[0] - ux * h - uy * h * 0.55, b[1] - uy * h + ux * h * 0.55];
    const r: P = [b[0] - ux * h + uy * h * 0.55, b[1] - uy * h - ux * h * 0.55];
    return (
      <g key={key} className={cls}>
        <line x1={X(a[0])} y1={Y(a[1])} x2={X(b[0] - ux * h * 0.7)} y2={Y(b[1] - uy * h * 0.7)} />
        <polygon points={[tip, l, r].map((q) => `${X(q[0])},${Y(q[1])}`).join(' ')} />
        {label ? (
          <text x={X((a[0] + b[0]) / 2) - uy * 0.45} y={Y((a[1] + b[1]) / 2) - ux * 0.45} className="lbl">
            {label}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <svg className="pickgrid" viewBox={`0 0 ${size} ${size}`} onClick={onClick} role="img" aria-label="Koordináta-rács: koppints egy rácspontra">
        {ticks.map((t) => (
          <g key={t} className="gl">
            <line x1={X(t)} y1={Y(-m)} x2={X(t)} y2={Y(m)} />
            <line x1={X(-m)} y1={Y(t)} x2={X(m)} y2={Y(t)} />
          </g>
        ))}
        <g className="ax">
          <line x1={X(-m - 0.4)} y1={Y(0)} x2={X(m + 0.4)} y2={Y(0)} />
          <line x1={X(0)} y1={Y(-m - 0.4)} x2={X(0)} y2={Y(m + 0.4)} />
        </g>
        {ticks
          .filter((t) => t !== 0 && (m <= 6 || t % 2 === 0))
          .map((t) => (
            <g key={`n${t}`} className="tick">
              <text x={X(t)} y={Y(0) + 0.42}>
                {sgn(t)}
              </text>
              <text x={X(0) - 0.22} y={Y(t) + 0.12} textAnchor="end">
                {komplex ? `${t === 1 ? '' : t === -1 ? '−' : sgn(t)}i` : sgn(t)}
              </text>
            </g>
          ))}
        <text className="axl" x={X(m + 0.4)} y={Y(0) - 0.25} textAnchor="end">
          {komplex ? 'Re' : 'x'}
        </text>
        <text className="axl" x={X(0) + 0.2} y={Y(m + 0.25)}>
          {komplex ? 'Im' : 'y'}
        </text>
        {nyilak.map((n, i) => arrow(n.a, n.b, 'given', `a${i}`, n.cimke))}
        {pontok.map((q, i) => (
          <g key={`p${i}`} className="given">
            <circle cx={X(q.p[0])} cy={Y(q.p[1])} r={0.17} />
            {q.cimke ? (
              <text x={X(q.p[0]) + 0.25} y={Y(q.p[1]) - 0.22} className="lbl">
                {q.cimke}
              </text>
            ) : null}
          </g>
        ))}
        {shown && kezdo ? arrow(kezdo, shown, `mine${ex.done ? ' done' : ''}`, 'mine') : null}
        {shown ? <circle className={`pick${ex.done ? ' done' : ''}`} cx={X(shown[0])} cy={Y(shown[1])} r={0.24} /> : null}
      </svg>
      {!ex.done ? (
        <p className="note">{pt ? `Kiválasztva: ${show(pt, komplex)}` : 'Koppints egy rácspontra.'}</p>
      ) : null}
      <CheckBar ex={ex} onCheck={check} disabled={!pt} />
      {!ex.done ? msg : null}
      <DoneNote ex={ex}>
        {ex.shown ? <span className="num">{show(cel, komplex)}. </span> : null}
        {magyarazat}
      </DoneNote>
    </div>
  );
}
