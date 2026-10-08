// Shared pieces for the logic widgets.
import { useRef } from 'react';

import { children, nodeLabel, ParseError, type Formula } from '@/lib/logic';

import { insertAtCaret } from './ui';

/** SVG structure tree (szerkezeti fa) of a formula. */
export function StructureTree({ f }: { f: Formula }) {
  let leaf = 0;
  let maxDepth = 0;
  const nodes: { x: number; d: number; label: string; leaf: boolean }[] = [];
  const edges: [number, number, number, number][] = [];
  const lay = (g: Formula, d: number): { x: number; d: number } => {
    maxDepth = Math.max(maxDepth, d);
    const ch = children(g);
    let x: number;
    if (!ch.length) x = leaf++;
    else {
      const cs = ch.map((c) => lay(c, d + 1));
      x = (cs[0].x + cs[cs.length - 1].x) / 2;
      cs.forEach((c) => edges.push([x, d, c.x, c.d]));
    }
    nodes.push({ x, d, label: nodeLabel(g), leaf: !ch.length });
    return { x, d };
  };
  lay(f, 0);
  const maxL = Math.max(2, ...nodes.filter((n) => n.leaf).map((n) => n.label.length));
  const dx = Math.max(54, maxL * 8.5 + 18);
  const dy = 58;
  const W = Math.max(1, leaf) * dx;
  const H = (maxDepth + 1) * dy + 20;
  const X = (x: number) => x * dx + dx / 2;
  const Y = (d: number) => d * dy + 22;
  return (
    <div className="treebox">
      <svg className="tree" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Szerkezeti fa">
        {edges.map(([x1, d1, x2, d2], i) => (
          <line key={i} x1={X(x1)} y1={Y(d1)} x2={X(x2)} y2={Y(d2)} />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle className={n.leaf ? 'leaf' : ''} cx={X(n.x)} cy={Y(n.d)} r={n.leaf ? 4 : 5} />
            {n.leaf ? (
              <text x={X(n.x)} y={Y(n.d) + 21} textAnchor="middle">
                {n.label}
              </text>
            ) : (
              <text x={X(n.x) + 9} y={Y(n.d) - 6}>
                {n.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Text input for formulas with a row of symbol buttons. */
export function FormulaInput({
  value,
  onChange,
  symbols = ['¬', '∧', '∨', '⊃', '≡', '(', ')'],
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  symbols?: string[];
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="stack">
      <div className="row">
        {symbols.map((s) => (
          <button key={s} type="button" className="btn sym" onClick={() => insertAtCaret(ref.current, s, onChange)}>
            {s}
          </button>
        ))}
      </div>
      <input
        ref={ref}
        type="text"
        className="formula"
        aria-label={label}
        value={value}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Examples({ items, onPick }: { items: [string, string][]; onPick: (v: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="row">
      <span className="note">Példák:</span>
      {items.map(([label, v]) => (
        <button key={label} type="button" className="btn" onClick={() => onPick(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function ParseErrorView({ error, src }: { error: unknown; src: string }) {
  if (error instanceof ParseError) {
    const pos = Math.min(error.pos, src.length);
    return (
      <div className="err">
        {error.message}
        <pre style={{ margin: '4px 0 0', background: 'none', padding: 0 }}>
          {src}
          {'\n'}
          {' '.repeat(pos)}^
        </pre>
      </div>
    );
  }
  return <p className="err">Nem sikerült értelmezni a formulát.</p>;
}

export const b01 = (x: boolean) => (x ? 1 : 0);
