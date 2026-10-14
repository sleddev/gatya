// Shade a set expression on a Venn diagram of two or three sets by tapping its regions.
import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';

import { regionKey, regions, setCount, shade, type Region } from '@/lib/venn';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

const LAYOUT = {
  2: { w: 300, h: 190, r: 64, c: [[118, 95], [182, 95]] as [number, number][] },
  3: { w: 300, h: 236, r: 60, c: [[122, 88], [178, 88], [150, 146]] as [number, number][] },
};
const NAMES = ['A', 'B', 'C'];

export function VennSzinezo({ children, cel, halmazok, magyarazat }: { children?: ReactNode; cel: string; halmazok?: 2 | 3; magyarazat?: ReactNode }) {
  const n = (halmazok ?? setCount(cel)) as 2 | 3;
  const L = LAYOUT[n];
  // the clip shapes depend only on the layout, so fixed ids are safe (and match the pre-rendered HTML)
  const uid = `venn${n}`;
  const want = useMemo(() => shade(cel, n), [cel, n]);
  const all = useMemo(() => regions(n), [n]);
  const ex = useExercise();
  const [on, setOn] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<ReactNode>(null);
  const [checked, setChecked] = useState(false);

  const regionAt = (x: number, y: number): Region | null => {
    if (x < 4 || y < 4 || x > L.w - 4 || y > L.h - 4) return null;
    return L.c.map(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 < L.r ** 2);
  };

  const onClick = (e: MouseEvent<SVGSVGElement>) => {
    if (ex.done) return;
    const ctm = e.currentTarget.getScreenCTM();
    if (!ctm) return;
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const r = regionAt(q.x, q.y);
    if (!r) return;
    const k = regionKey(r);
    setChecked(false);
    setMsg(null);
    setOn((s) => {
      const nx = new Set(s);
      if (nx.has(k)) nx.delete(k);
      else nx.add(k);
      return nx;
    });
  };

  const check = () => {
    setChecked(true);
    const extra = [...on].filter((k) => !want.has(k)).length;
    const missing = [...want].filter((k) => !on.has(k)).length;
    if (!extra && !missing) {
      setMsg(null);
      return ex.solve();
    }
    ex.miss();
    setMsg(
      <Feedback kind="no">
        {extra ? `${extra} színezett tartomány nem tartozik bele (pirossal jelölve). ` : null}
        {missing ? `${extra ? 'És még' : 'Még'} ${missing} tartomány hiányzik.` : null}
      </Feedback>
    );
  };

  const shownSet = ex.shown ? want : on;

  // one region = the universe clipped to the circles it is in and masked by the ones it is outside of
  const regionShape = (r: Region, cls: string, k: string) => {
    let el: ReactNode = <rect x={4} y={4} width={L.w - 8} height={L.h - 8} className={cls} />;
    r.forEach((inside, i) => {
      el = inside ? (
        <g key={i} clipPath={`url(#${uid}c${i})`}>
          {el}
        </g>
      ) : (
        <g key={i} mask={`url(#${uid}m${i})`}>
          {el}
        </g>
      );
    });
    return <g key={k}>{el}</g>;
  };

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <svg className="venn-pick" viewBox={`0 0 ${L.w} ${L.h}`} onClick={onClick} role="img" aria-label="Venn-diagram: koppints a tartományokra">
        <defs>
          {L.c.map(([cx, cy], i) => (
            <g key={i}>
              <clipPath id={`${uid}c${i}`}>
                <circle cx={cx} cy={cy} r={L.r} />
              </clipPath>
              <mask id={`${uid}m${i}`}>
                <rect x={0} y={0} width={L.w} height={L.h} fill="white" />
                <circle cx={cx} cy={cy} r={L.r} fill="black" />
              </mask>
            </g>
          ))}
        </defs>
        <rect x={4} y={4} width={L.w - 8} height={L.h - 8} className="universe" />
        {all.map((r) => {
          const k = regionKey(r);
          if (!shownSet.has(k)) return null;
          const bad = checked && !ex.done && !want.has(k);
          return regionShape(r, `shaded${bad ? ' bad' : ''}${ex.done ? ' done' : ''}`, k);
        })}
        {L.c.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={L.r} className="ring" />
        ))}
        {L.c.map(([cx, cy], i) => {
          const dx = n === 2 ? (i === 0 ? -1 : 1) : i === 0 ? -0.8 : i === 1 ? 0.8 : 0;
          const dy = n === 2 ? -0.75 : i === 2 ? 1.1 : -0.75;
          return (
            <text key={i} x={cx + dx * L.r * 0.95} y={cy + dy * L.r * 0.95} className="setname">
              {NAMES[i]}
            </text>
          );
        })}
        <text x={14} y={22} className="setname small">
          H
        </text>
      </svg>
      {!ex.done ? <p className="note">Koppints a tartományokra a színezéshez; újabb koppintás törli.</p> : null}
      <CheckBar ex={ex} onCheck={check} />
      {!ex.done ? msg : null}
      <DoneNote ex={ex}>{magyarazat}</DoneNote>
    </div>
  );
}
