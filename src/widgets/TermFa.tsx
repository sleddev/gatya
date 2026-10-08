import { useState } from 'react';

import { typeExpression, type Kind, type Signature, type TypedNode } from '@/lib/terms';

import { Examples, FormulaInput, ParseErrorView } from './logic-ui';
import { Bench, Chip } from './ui';

const LECTURE: Signature = {
  nevek: ['Péter', 'én'],
  fuggvenyek: { édesanyja: 1 },
  predikatumok: { özvegy: 1, munkatársak: 2, havazik: 0 },
};

const EXAMPLES: [string, string][] = [
  ['nagyanyja', 'édesanyja(édesanyja(Péter))'],
  ['özvegy', 'özvegy(édesanyja(édesanyja(Péter)))'],
  ['munkatárs', 'munkatársak(édesanyja(Péter), én)'],
  ['kvantorral', '∀x (özvegy(x) ⊃ ¬havazik)'],
  ['hibás 1', 'édesanyja(özvegy(Péter))'],
  ['hibás 2', 'havazik ∧ Péter'],
];

const COLOR: Record<Kind, string> = { formula: 'var(--q2)', term: 'var(--q1)', hiba: 'var(--bad)' };

/** Builds the expression's tree and colours every node: term (names something) or formula (states something). */
export function TermFa({ kifejezes = 'özvegy(édesanyja(édesanyja(Péter)))' }: { kifejezes?: string }) {
  const [src, setSrc] = useState(kifejezes);
  const r = typeExpression(src, LECTURE);

  return (
    <Bench
      title="Term vagy formula?"
      hint="Írj be egy kifejezést. A fa minden csúcsa megmutatja, hogy az a rész term (valamit megnevez) vagy formula (valamit állít).">
      <p className="note" style={{ margin: 0 }}>
        Nevek: Péter, én · függvényjel: édesanyja(·) · predikátumok: özvegy(·), munkatársak(·, ·) · állításjel: havazik · változók: x, y, z
      </p>
      <Examples items={EXAMPLES} onPick={setSrc} />
      <FormulaInput value={src} onChange={setSrc} label="Kifejezés" symbols={['¬', '∧', '∨', '⊃', '≡', '∀', '∃', '(', ')', ',']} />
      {!r.ok ? (
        <ParseErrorView error={r.error} src={src} />
      ) : (
        <>
          <Tree root={r.tree} />
          <div className="legend">
            <span style={{ ['--c' as string]: COLOR.term }}>term</span>
            <span style={{ ['--c' as string]: COLOR.formula }}>formula</span>
            <span style={{ ['--c' as string]: COLOR.hiba }}>hibás</span>
          </div>
          <div className="out">
            <p>
              {r.kind === 'term' ? (
                <>
                  <Chip kind="ok">term</Chip> Az egész kifejezés megnevez valamit (valakit), de nem állít semmit: nem igaz és nem hamis.
                </>
              ) : r.kind === 'formula' ? (
                <>
                  <Chip kind="ok">formula</Chip> Az egész kifejezés állít valamit: egy interpretációban igaz vagy hamis.
                </>
              ) : (
                <>
                  <Chip kind="no">egyik sem</Chip> A kifejezés nem jól formált.
                </>
              )}
            </p>
            {r.errors.map((e, i) => (
              <p key={i} className="err">
                {e}
              </p>
            ))}
          </div>
        </>
      )}
    </Bench>
  );
}

function Tree({ root }: { root: TypedNode }) {
  type Placed = { n: TypedNode; x: number; d: number };
  const placed: Placed[] = [];
  const edges: [number, number, number, number][] = [];
  let leaf = 0;
  let depth = 0;
  const lay = (n: TypedNode, d: number): { x: number; d: number } => {
    depth = Math.max(depth, d);
    let x: number;
    if (!n.children.length) x = leaf++;
    else {
      const cs = n.children.map((c) => lay(c, d + 1));
      x = (cs[0].x + cs[cs.length - 1].x) / 2;
      cs.forEach((c) => edges.push([x, d, c.x, c.d]));
    }
    placed.push({ n, x, d });
    return { x, d };
  };
  lay(root, 0);
  const box = (s: string) => Math.max(34, s.length * 8.6 + 18);
  const dx = Math.max(78, ...placed.map((p) => box(p.n.label) + 12));
  const dy = 64;
  const W = Math.max(1, leaf) * dx;
  const H = (depth + 1) * dy + 8;
  const X = (x: number) => x * dx + dx / 2;
  const Y = (d: number) => d * dy + 18;
  return (
    <div className="treebox">
      <svg className="tree" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A kifejezés fája">
        {edges.map(([x1, d1, x2, d2], i) => (
          <line key={i} x1={X(x1)} y1={Y(d1) + 33} x2={X(x2)} y2={Y(d2) - 14} />
        ))}
        {placed.map(({ n, x, d }, i) => {
          const w = box(n.label);
          return (
            <g key={i}>
              <rect
                x={X(x) - w / 2}
                y={Y(d) - 14}
                width={w}
                height={28}
                rx={7}
                fill={`color-mix(in srgb, ${COLOR[n.kind]} 16%, var(--surface))`}
                stroke={COLOR[n.kind]}
                strokeWidth={1.6}
              />
              <text x={X(x)} y={Y(d) + 5} textAnchor="middle" style={{ fill: 'var(--ink)', fontWeight: 600 }}>
                {n.label}
              </text>
              <text x={X(x)} y={Y(d) + 27} textAnchor="middle" style={{ fill: COLOR[n.kind], fontSize: 10.5 }}>
                {n.role}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
