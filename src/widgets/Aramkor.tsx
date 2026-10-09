// ∧ and ∨ as switches: in series the lamp lights only if both are on, in parallel if at least one is.
import { useState } from 'react';

import { Bench, Seg } from './ui';

type Mode = 'es' | 'vagy';

function Switch({ x, y, on, label, onClick }: { x: number; y: number; on: boolean; label: string; onClick: () => void }) {
  return (
    <g
      className="node"
      role="button"
      tabIndex={0}
      aria-label={`${label} kapcsoló: ${on ? 'be' : 'ki'}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}>
      <rect x={x - 6} y={y - 30} width={72} height={50} fill="transparent" />
      <circle cx={x} cy={y} r={4} className="wire-dot" />
      <circle cx={x + 60} cy={y} r={4} className="wire-dot" />
      <line x1={x} y1={y} x2={on ? x + 60 : x + 52} y2={on ? y : y - 26} className={`lever${on ? ' on' : ''}`} />
      <text x={x + 30} y={y + 26} textAnchor="middle" className="set">
        {label} = {on ? 1 : 0}
      </text>
    </g>
  );
}

export function Aramkor({ mod = 'es' }: { mod?: Mode }) {
  const [mode, setMode] = useState<Mode>(mod);
  const [p, setP] = useState(false);
  const [q, setQ] = useState(false);
  const lit = mode === 'es' ? p && q : p || q;
  const wire = (on: boolean) => `wire${on ? ' live' : ''}`;
  // current flows (and a wire is highlighted) only along a closed loop
  return (
    <Bench
      title={mode === 'es' ? 'Soros kapcsolás: ∧' : 'Párhuzamos kapcsolás: ∨'}
      hint="Koppints a kapcsolókra. A kapcsoló a betű értéke: zárva 1, nyitva 0. A lámpa a formula értéke.">
      <Seg
        options={[
          ['es', 'soros: p ∧ q'],
          ['vagy', 'párhuzamos: p ∨ q'],
        ]}
        value={mode}
        onChange={setMode}
      />
      <svg className="diagram circuit" viewBox="0 0 340 200" role="group" aria-label={`Áramkör, a lámpa ${lit ? 'világít' : 'nem világít'}`}>
        {/* battery on the left, lamp on the right, return wire at the bottom */}
        <line x1={30} y1={150} x2={310} y2={150} className={wire(lit)} />
        <line x1={30} y1={70} x2={30} y2={150} className={wire(lit)} />
        <line x1={310} y1={70} x2={310} y2={112} className={wire(lit)} />
        <line x1={310} y1={136} x2={310} y2={150} className={wire(lit)} />
        <line x1={18} y1={104} x2={42} y2={104} className="battery" />
        <line x1={24} y1={114} x2={36} y2={114} className="battery" />
        <circle cx={310} cy={124} r={14} className={`lamp${lit ? ' on' : ''}`} />
        <text x={310} y={129} textAnchor="middle" style={{ fontSize: 14 }}>
          {lit ? '💡' : ''}
        </text>
        {mode === 'es' ? (
          <>
            <line x1={30} y1={70} x2={70} y2={70} className={wire(lit)} />
            <Switch x={70} y={70} on={p} label="p" onClick={() => setP(!p)} />
            <line x1={130} y1={70} x2={180} y2={70} className={wire(lit)} />
            <Switch x={180} y={70} on={q} label="q" onClick={() => setQ(!q)} />
            <line x1={240} y1={70} x2={310} y2={70} className={wire(lit)} />
          </>
        ) : (
          <>
            <line x1={30} y1={70} x2={60} y2={70} className={wire(p || q)} />
            <line x1={60} y1={40} x2={60} y2={100} className={wire(p || q)} />
            <line x1={60} y1={40} x2={130} y2={40} className={wire(p)} />
            <line x1={60} y1={100} x2={130} y2={100} className={wire(q)} />
            <Switch x={130} y={40} on={p} label="p" onClick={() => setP(!p)} />
            <Switch x={130} y={100} on={q} label="q" onClick={() => setQ(!q)} />
            <line x1={190} y1={40} x2={250} y2={40} className={wire(p)} />
            <line x1={190} y1={100} x2={250} y2={100} className={wire(q)} />
            <line x1={250} y1={40} x2={250} y2={100} className={wire(lit)} />
            <line x1={250} y1={70} x2={310} y2={70} className={wire(lit)} />
          </>
        )}
      </svg>
      <p className="out" style={{ margin: 0 }}>
        <span className="line">
          {mode === 'es' ? 'p ∧ q' : 'p ∨ q'} = {p ? 1 : 0} {mode === 'es' ? '∧' : '∨'} {q ? 1 : 0} = <b>{lit ? 1 : 0}</b>
        </span>
        <span className="note">
          {' '}
          {mode === 'es'
            ? 'Sorosan az áram mindkét kapcsolón átmegy: elég egy nyitott, és sötét van.'
            : 'Párhuzamosan két út van: elég, ha az egyik zárva van.'}
        </span>
      </p>
    </Bench>
  );
}
