import { useState, type KeyboardEvent } from 'react';

import { divRem, gcd, powerCycle, sgn, sup } from '@/lib/numbers';

import { Bench, NumField, Seg } from './ui';

type Mode = 'osztalyok' | 'hatvany' | 'redukalt';

const MODES: Record<Mode, string> = {
  osztalyok: 'maradékosztályok',
  hatvany: 'hatványok',
  redukalt: 'redukált osztályok',
};

/** Arithmetic mod m on a clock face: residue classes, powers going round in a cycle, φ(m). */
export function MaradekOra({
  m: m0 = 12,
  a: a0 = 14,
  mod: mode0 = 'osztalyok',
  modok,
}: {
  m?: number;
  a?: number;
  mod?: Mode;
  modok?: Mode[];
}) {
  const modes = (modok ?? (Object.keys(MODES) as Mode[])).filter((k) => MODES[k]);
  const [mode, setMode] = useState<Mode>(MODES[mode0] ? mode0 : modes[0]);
  const [m, setM] = useState(m0);
  const [a, setA] = useState(a0);
  const M = Math.trunc(m);
  const A = Math.trunc(a);
  const ok = M >= 2 && M <= 36;

  const S = 340;
  const c = S / 2;
  const R = 128;
  const nodeR = M > 24 ? 9 : M > 16 ? 11 : 14;
  const pos = (i: number): [number, number] => {
    const t = (2 * Math.PI * i) / M - Math.PI / 2;
    return [c + R * Math.cos(t), c + R * Math.sin(t)];
  };

  const { q, r } = ok ? divRem(A, M) : { q: 0, r: 0 };
  const cyc = ok && mode === 'hatvany' ? powerCycle(A, M) : null;
  const coprime = ok ? Array.from({ length: M }, (_, i) => gcd(i, M) === 1) : [];
  const phi = coprime.filter(Boolean).length;

  const fill = (i: number) => {
    if (mode === 'osztalyok') return i === r ? 'var(--acc)' : 'var(--surface)';
    if (mode === 'redukalt') return coprime[i] ? 'var(--acc)' : 'var(--surface)';
    return cyc?.seq.includes(i) ? 'var(--q1)' : 'var(--surface)';
  };
  const onNode = (i: number) => {
    if (mode === 'osztalyok') setA(i);
    if (mode === 'hatvany') setA(i);
  };
  const key = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNode(i);
    }
  };

  const chord = (from: number, to: number, color: string, k: number) => {
    const [x1, y1] = pos(from);
    const [x2, y2] = pos(to);
    if (from === to) {
      // a fixed point: a small loop outside the clock
      const [ox, oy] = [x1 + ((x1 - c) / R) * 24, y1 + ((y1 - c) / R) * 24];
      return <circle key={k} cx={ox} cy={oy} r={10} fill="none" stroke={color} strokeWidth={2} />;
    }
    // curve slightly towards the centre so arrows in opposite directions don't overlap
    const mx = (x1 + x2) / 2 + (c - (x1 + x2) / 2) * 0.25;
    const my = (y1 + y2) / 2 + (c - (y1 + y2) / 2) * 0.25;
    const L = Math.hypot(x2 - mx, y2 - my);
    const ux = (x2 - mx) / L,
      uy = (y2 - my) / L;
    const ex = x2 - ux * (nodeR + 2),
      ey = y2 - uy * (nodeR + 2);
    return (
      <g key={k}>
        <path d={`M ${x1} ${y1} Q ${mx} ${my} ${ex - ux * 6} ${ey - uy * 6}`} fill="none" stroke={color} strokeWidth={2} />
        <polygon points={`${ex},${ey} ${ex - ux * 10 - uy * 5},${ey - uy * 10 + ux * 5} ${ex - ux * 10 + uy * 5},${ey - uy * 10 - ux * 5}`} fill={color} />
      </g>
    );
  };

  return (
    <Bench title="Maradékóra" hint="Mod m a számok körbe érnek, mint az órán: m lépés után újra ugyanott vagyunk. Koppints egy számra az órán!">
      {modes.length > 1 ? <Seg options={modes.map((k) => [k, MODES[k]] as const)} value={mode} onChange={setMode} /> : null}
      <div className="row">
        <NumField label="m (modulus)" value={m} onChange={setM} min={2} max={36} />
        {mode !== 'redukalt' ? <NumField label={mode === 'hatvany' ? 'a (alap)' : 'a'} value={a} onChange={setA} /> : null}
      </div>
      {!ok ? (
        <p className="err">A modulus 2 és 36 között legyen.</p>
      ) : (
        <>
          <svg className="diagram" viewBox={`0 0 ${S} ${S}`} role="group" aria-label={`Maradékóra modulo ${M}`} style={{ maxWidth: 380 }}>
            <circle cx={c} cy={c} r={R} fill="none" stroke="var(--line)" strokeWidth={2} />
            {mode === 'osztalyok'
              ? (() => {
                  const [x, y] = pos(r);
                  return <line x1={c} y1={c} x2={c + (x - c) * 0.78} y2={c + (y - c) * 0.78} stroke="var(--acc)" strokeWidth={3} strokeLinecap="round" />;
                })()
              : null}
            {cyc
              ? cyc.seq.map((v, i) => {
                  const next = i + 1 < cyc.seq.length ? cyc.seq[i + 1] : cyc.seq[cyc.start];
                  return chord(v, next, i + 1 < cyc.seq.length ? 'var(--q1)' : 'var(--q4)', i);
                })
              : null}
            <circle cx={c} cy={c} r={4} fill="var(--ink)" />
            {Array.from({ length: M }, (_, i) => {
              const [x, y] = pos(i);
              const f = fill(i);
              const on = f !== 'var(--surface)';
              const clickable = mode !== 'redukalt';
              return (
                <g
                  key={i}
                  className={clickable ? 'node' : undefined}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? `${i}` : undefined}
                  onClick={clickable ? () => onNode(i) : undefined}
                  onKeyDown={clickable ? key(i) : undefined}>
                  <circle cx={x} cy={y} r={nodeR} fill={f} stroke={on ? f : 'var(--ink)'} strokeWidth={1.4} />
                  <text x={x} y={y + (nodeR > 11 ? 5 : 4)} textAnchor="middle" style={{ fill: on ? 'var(--surface)' : 'var(--ink)', fontSize: nodeR > 11 ? 14 : 11 }}>
                    {i}
                  </text>
                </g>
              );
            })}
            {mode === 'osztalyok' ? (
              <text x={c} y={c + 34} textAnchor="middle" className="small">
                {sgn(A)} → {r}
              </text>
            ) : null}
            {mode === 'redukalt' ? (
              <text x={c} y={c + 34} textAnchor="middle" className="small">
                φ({M}) = {phi}
              </text>
            ) : null}
          </svg>
          <div className="out">
            {mode === 'osztalyok' ? (
              <>
                <p className="line">
                  {sgn(A)} = {M} · {q < 0 ? `(${sgn(q)})` : q} + {r}, tehát {sgn(A)} ≡ {r} (mod {M})
                </p>
                <p>
                  {q >= 0 ? `0-tól ${q} teljes kört teszünk meg előre` : `0-tól ${-q} teljes kört teszünk meg visszafelé`}, aztán még {r} lépést előre. Ugyanide
                  jut minden szám, amely ettől a modulus többszörösével tér el. Ez egy <b>maradékosztály</b>:
                </p>
                <p className="line">
                  {'{'} …, {[-2, -1, 0, 1, 2, 3].map((k) => sgn(r + k * M)).join(', ')}, … {'}'}
                </p>
              </>
            ) : null}
            {mode === 'hatvany' && cyc ? (
              <>
                <p className="line" style={{ whiteSpace: 'normal' }}>
                  {cyc.seq.map((v, i) => `${A}${sup(i + 1)} ≡ ${v}`).join(',  ')},  {A}
                  {sup(cyc.seq.length + 1)} ≡ {cyc.seq[cyc.start]}, …
                </p>
                <p>
                  A hatványok {cyc.seq.length - cyc.start} hosszú körben ismétlődnek
                  {cyc.start > 0 ? ` (az első ${cyc.start} lépés után)` : ''}. A narancs nyíl zárja a kört.
                </p>
                {gcd(A, M) === 1 ? (
                  <p className="note">
                    ({A}, {M}) = 1, ezért a kör az 1-en is átmegy, és a hossza osztója φ(m)-nek: {cyc.seq.length} | φ({M}) = {phi}. Ez az Euler–Fermat-tétel:{' '}
                    {A}
                    {sup(phi)} ≡ 1 (mod {M}).
                  </p>
                ) : (
                  <p className="note">
                    ({A}, {M}) = {gcd(A, M)} ≠ 1, ezért a hatványok sosem érik el az 1-et: az Euler–Fermat-tétel itt nem használható.
                  </p>
                )}
              </>
            ) : null}
            {mode === 'redukalt' ? (
              <p>
                A színes számok relatív prímek a modulushoz: {coprime.flatMap((on, i) => (on ? [i] : [])).join(', ')}. Ők a redukált maradékosztályok reprezentánsai, a
                számuk φ({M}) = {phi}.
              </p>
            ) : null}
          </div>
        </>
      )}
    </Bench>
  );
}
