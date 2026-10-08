import { useState } from 'react';

import { children, classify, degree, evaluate, nodeLabel, parse, propVars, show, subformulas, valuations, type Formula } from '@/lib/logic';

import { b01, Examples, FormulaInput, ParseErrorView, StructureTree } from './logic-ui';
import { Bench, Chip, Kv } from './ui';

const DEFAULT_EXAMPLES: [string, string][] = [
  ['előadás: szerkezeti fa', '(¬r ∧ p) ⊃ (p ∨ ¬r)'],
  ['igazságtábla-dia', '¬p ∧ (q ⊃ r)'],
  ['p ⊃ q ⊃ r', 'p ⊃ q ⊃ r'],
  ['p ∨ q ∧ r ∨ s', 'p ∨ q ∧ r ∨ s'],
  ['kizárt harmadik', 'p ∨ ¬p'],
  ['ellentmondás', 'p ∧ ¬p'],
  ['(A ∧ B) ⊃ B', '(A ∧ B) ⊃ B'],
];

/** Propositional workbench: structure tree, truth table with every subformula, classification. */
export function FormulaMuhely({
  formula = '(¬r ∧ p) ⊃ (p ∨ ¬r)',
  peldak = DEFAULT_EXAMPLES,
  fa = true,
  tabla = true,
}: {
  formula?: string;
  peldak?: [string, string][];
  fa?: boolean;
  tabla?: boolean;
}) {
  const [src, setSrc] = useState(formula);
  let ast: Formula | null = null;
  let error: unknown = null;
  try {
    ast = parse(src).ast;
  } catch (e) {
    error = e;
  }
  const vars = ast ? propVars(ast) : new Set<string>();
  const tooMany = vars.size > 6;

  return (
    <Bench
      title="Formulaműhely"
      hint={
        <>
          Írj be egy ítéletlogikai formulát. ASCII is jó: <code>~</code> = ¬, <code>&amp;</code> = ∧, <code>|</code> = ∨, <code>-&gt;</code> = ⊃,{' '}
          <code>&lt;-&gt;</code> = ≡.
        </>
      }>
      <FormulaInput value={src} onChange={setSrc} label="Formula" />
      <Examples items={peldak} onPick={setSrc} />
      {error ? <ParseErrorView error={error} src={src} /> : null}
      {tooMany ? <p className="err">Legfeljebb 6 különböző betűt használj (2⁶ = 64 sor).</p> : null}
      {ast && !tooMany ? <Analysis f={ast} fa={fa} tabla={tabla} /> : null}
    </Bench>
  );
}

function Analysis({ f, fa, tabla }: { f: Formula; fa: boolean; tabla: boolean }) {
  const { names, rows } = valuations(propVars(f));
  const sub = subformulas(f);
  const cols = sub.length ? sub : [f];
  const c = classify(f);
  const imm = children(f);
  const verdict =
    c.kind === 'valid' ? (
      <>
        <Chip kind="ok">érvényes (logikai törvény)</Chip> <span className="note">mind a {c.rows} sorban igaz</span>
      </>
    ) : c.kind === 'unsatisfiable' ? (
      <>
        <Chip kind="no">kielégíthetetlen (ellentmondás)</Chip> <span className="note">minden sorban hamis</span>
      </>
    ) : (
      <>
        <Chip kind="mid">kielégíthető és cáfolható</Chip>{' '}
        <span className="note">
          {c.rows} sorból {c.trueRows}-ben igaz
        </span>
      </>
    );
  return (
    <div className="cols">
      <div className="stack">
        {fa ? <StructureTree f={f} /> : null}
        <Kv
          rows={[
            ['teljesen zárójelezve', show(f)],
            ['fő logikai jel', f.t === 'var' ? 'nincs (atomi)' : nodeLabel(f)],
            ['közvetlen részformulák', imm.length ? imm.map(show).join('  és  ') : 'nincs'],
            ['összetettség', String(degree(f))],
          ]}
        />
      </div>
      <div className="stack">
        <div>{verdict}</div>
        {tabla ? (
          <div className="tablewrap">
            <table className="tt">
              <thead>
                <tr>
                  {names.map((n) => (
                    <th key={n}>{n}</th>
                  ))}
                  {cols.map((s, i) => (
                    <th key={i} className={`${i === 0 ? 'sep ' : ''}${s === f ? 'main' : ''}`}>
                      {show(s)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri}>
                    {names.map((n) => (
                      <td key={n} className={`v${b01(r[n])}`}>
                        {b01(r[n])}
                      </td>
                    ))}
                    {cols.map((s, i) => {
                      const x = b01(evaluate(s, r));
                      return (
                        <td key={i} className={`${i === 0 ? 'sep ' : ''}${s === f ? 'main ' : ''}v${x}`}>
                          {x}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
