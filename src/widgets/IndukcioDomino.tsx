import { useEffect, useState } from 'react';

import { Bench, Chip } from './ui';

const N = 12;

/** Dominoes as a picture of induction: base case = push the first, step = each one knocks over the next. */
export function IndukcioDomino() {
  const [base, setBase] = useState(true);
  const [stepOk, setStepOk] = useState(true);
  const [gap, setGap] = useState(6); // the step fails between domino `gap` and `gap + 1`
  const [fallen, setFallen] = useState(0);
  const [running, setRunning] = useState(false);
  const target = !base ? 0 : stepOk ? N : gap;

  useEffect(() => {
    if (!running) return;
    if (fallen >= target) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setFallen((f) => f + 1), 140);
    return () => clearTimeout(t);
  }, [running, fallen, target]);

  const reset = () => {
    setFallen(0);
    setRunning(false);
  };
  const W = 36;
  return (
    <Bench
      title="Dominóelv"
      hint="A teljes indukció két lépése: (1) az első dominó eldől, (2) bármelyik dominó eldőlése magával rántja a következőt. Kapcsold ki valamelyiket, és nézd meg, mi történik.">
      <div className="row">
        <label className="note">
          <input type="checkbox" checked={base} onChange={(e) => (setBase(e.target.checked), reset())} /> (1) kezdőlépés: n = 1 igaz
        </label>
        <label className="note">
          <input type="checkbox" checked={stepOk} onChange={(e) => (setStepOk(e.target.checked), reset())} /> (2) indukciós lépés: k → k+1 mindig működik
        </label>
        {!stepOk ? (
          <label className="f" style={{ minWidth: 160 }}>
            a lánc elakad {gap} és {gap + 1} között
            <input type="range" min={1} max={N - 1} value={gap} onChange={(e) => (setGap(Number(e.target.value)), reset())} />
          </label>
        ) : null}
      </div>
      <div className="tablewrap">
        <svg width={N * W + 20} height={110} viewBox={`0 0 ${N * W + 20} 110`} role="img" aria-label={`${fallen} dominó dőlt el`}>
          <line x1={0} y1={96} x2={N * W + 20} y2={96} stroke="var(--axis)" strokeWidth={2} />
          {Array.from({ length: N }, (_, i) => {
            const down = i < fallen;
            const x = 14 + i * W;
            return (
              <g key={i} transform={`rotate(${down ? 62 : 0} ${x + 8} 96)`} style={{ transition: 'transform .18s ease-in' }}>
                <rect
                  x={x}
                  y={40}
                  width={10}
                  height={56}
                  rx={2}
                  fill={down ? 'var(--acc)' : 'var(--surface)'}
                  stroke={!stepOk && i === gap - 1 ? 'var(--bad)' : 'var(--ink)'}
                  strokeWidth={1.5}
                />
                <text x={x + 5} y={34} textAnchor="middle" fontSize={11} fill="var(--muted)">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="row">
        <button
          type="button"
          className="btn on"
          onClick={() => {
            setFallen(0);
            setRunning(true);
          }}>
          Lökd meg!
        </button>
        <button type="button" className="btn" onClick={reset}>
          Visszaállít
        </button>
        {!running && fallen === target && fallen > 0 ? (
          target === N ? (
            <Chip kind="ok">mind eldőlt: az állítás minden n-re igaz</Chip>
          ) : (
            <Chip kind="no">csak az első {fallen} dőlt el</Chip>
          )
        ) : null}
        {!running && !base && fallen === 0 ? <Chip kind="no">kezdőlépés nélkül egyik sem dől el</Chip> : null}
      </div>
    </Bench>
  );
}
