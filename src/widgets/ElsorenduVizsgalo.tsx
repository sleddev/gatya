import { useState, type ReactNode } from 'react';

import { analyseFirstOrder, children, degree, nodeLabel, parse, show, type Formula, type Token } from '@/lib/logic';

import { Examples, FormulaInput, ParseErrorView, StructureTree } from './logic-ui';
import { Bench, Chip, Kv } from './ui';

const QCOLORS = ['--q1', '--q2', '--q3', '--q4', '--q5'];

const DEFAULT_EXAMPLES: [string, string][] = [
  ['∀y ¬∃x(P(f(x)) ∨ Q(x,y))', '∀y ¬∃x(P(f(x)) ∨ Q(x,y))'],
  ['∀y(¬∃x P(f(x)) ∨ Q(x,y))', '∀y(¬∃x P(f(x)) ∨ Q(x,y))'],
  ['∀x P(x) ∨ Q(x)', '∀x P(x) ∨ Q(x)'],
  ['∀x ¬P(f(x),u)', '∀x ¬P(f(x),u)'],
  ['∃y ∀x ¬R(x,y,f(z))', '∃y ∀x ¬R(x,y,f(z))'],
  ['∀x(P(x) ⊃ ∃x Q(x))', '∀x(P(x) ⊃ ∃x Q(x))'],
];

/** First-order formula inspector: colours each quantifier and the occurrences it binds; free ones in red. */
export function ElsorenduVizsgalo({
  formula = '∀y(¬∃x P(f(x)) ∨ Q(x,y))',
  peldak = DEFAULT_EXAMPLES,
}: {
  formula?: string;
  peldak?: [string, string][];
}) {
  const [src, setSrc] = useState(formula);
  const [hover, setHover] = useState<number | null>(null);
  let parsed: { ast: Formula; tokens: Token[] } | null = null;
  let error: unknown = null;
  try {
    parsed = parse(src, true);
  } catch (e) {
    error = e;
  }

  let body: ReactNode = null;
  if (parsed) {
    const { ast, tokens } = parsed;
    const an = analyseFirstOrder(ast);
    // token index -> quantifier id (or null = free occurrence)
    const tag = new Map<number, number | null>();
    an.quantifiers.forEach((q) => {
      tag.set(q.qtok, q.id);
      tag.set(q.vtok, q.id);
    });
    an.occurrences.forEach((o) => tag.set(o.token, o.boundBy));
    const pieces: ReactNode[] = [];
    let last = 0;
    tokens.forEach((t, i) => {
      if (t.i > last) pieces.push(src.slice(last, t.i));
      const text = t.k === 'op' ? t.v : src.slice(t.i, t.i + t.len);
      if (tag.has(i)) {
        const q = tag.get(i);
        if (q === null || q === undefined)
          pieces.push(
            <span key={i} className="occ free" title="szabad előfordulás">
              {text}
            </span>
          );
        else {
          const col = `var(${QCOLORS[q % QCOLORS.length]})`;
          pieces.push(
            <span
              key={i}
              className={`occ${hover !== null && hover !== q ? ' dim' : ''}`}
              style={{ color: col, background: `color-mix(in srgb, ${col} 14%, transparent)` }}
              onMouseEnter={() => setHover(q)}
              onMouseLeave={() => setHover(null)}>
              {text}
            </span>
          );
        }
      } else pieces.push(<span key={i}>{text}</span>);
      last = t.i + t.len;
    });
    pieces.push(src.slice(last));
    const reasons = [
      an.freeAndBound.length ? `${an.freeAndBound.join(', ')} szabadon és kötötten is előfordul` : '',
      an.doubleBound.length ? `több kvantor is köti: ${an.doubleBound.join(', ')}` : '',
    ].filter(Boolean);
    body = (
      <>
        <div className="fol">{pieces}</div>
        <div className="cols">
          <Kv
            rows={[
              ['nyitott / zárt', an.closed ? <Chip kind="ok">zárt</Chip> : <Chip kind="mid">nyitott</Chip>],
              ['szabad változók', an.free.length ? an.free.join(', ') : 'nincs'],
              ['kötött változók', an.bound.length ? an.bound.join(', ') : 'nincs'],
              [
                'változóiban tiszta?',
                an.clean ? (
                  <Chip kind="ok">igen</Chip>
                ) : (
                  <>
                    <Chip kind="no">nem</Chip> <span className="note">{reasons.join('; ')}. Nevezd át a kötött változókat!</span>
                  </>
                ),
              ],
              ['fő logikai jel', ast.t === 'atom' ? 'nincs (atomi)' : nodeLabel(ast)],
              ['közvetlen részformulák', children(ast).map(show).join('  és  ') || 'nincs'],
              ['összetettség', String(degree(ast))],
            ]}
          />
          <StructureTree f={ast} />
        </div>
      </>
    );
  }

  return (
    <Bench
      title="Elsőrendű formula vizsgálata"
      hint={
        <>
          Minden kvantor saját színt kap, és az általa kötött változók is ezt a színt viselik; a szabad előfordulás piros. Változók:{' '}
          <code>x y z v w</code> (számmal is), más kisbetűs szó név (pl. <code>u</code>), kisbetű + <code>(</code> függvény, nagybetű predikátum.
          Írhatsz <code>forall x</code> / <code>exists x</code>-et is.
        </>
      }>
      <FormulaInput value={src} onChange={setSrc} symbols={['∀', '∃', '¬', '∧', '∨', '⊃', '≡', '(', ')']} label="Elsőrendű formula" />
      <Examples items={peldak} onPick={setSrc} />
      {error ? <ParseErrorView error={error} src={src} /> : null}
      {body}
    </Bench>
  );
}
