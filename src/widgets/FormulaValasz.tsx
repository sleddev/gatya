// Type a formula as the answer. Depending on `mod` it is accepted when it is logically equivalent to
// `helyes` (formalization), has the same structure, is fully bracketed, or has as few brackets as possible.
import { useMemo, useState, type ReactNode } from 'react';

import {
  binCount,
  describeModel,
  isPrenex,
  foDifference,
  groupingParens,
  mergeSignatures,
  minimal,
  minimalParens,
  normalFormProblem,
  propDifference,
  shape,
  signature,
} from '@/lib/course';
import { analyseFirstOrder, evaluate, parse, propVars, show, type Formula } from '@/lib/logic';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';
import { FormulaInput, ParseErrorView } from './logic-ui';

type Mode = 'ekv' | 'szerkezet' | 'teljes' | 'minimalis' | 'tiszta' | 'prenex' | 'knf' | 'dnf';

const SOLUTION_TEXT: Record<Mode, string> = {
  ekv: '',
  szerkezet: '',
  teljes: 'Teljesen zárójelezve: ',
  minimalis: 'A lehető legkevesebb zárójellel: ',
  tiszta: 'Egy változóiban tiszta változat: ',
  prenex: 'Egy prenex alak: ',
  knf: 'Egy KNF: ',
  dnf: 'Egy DNF: ',
};

function symbolsOf(f: Formula, firstOrder: boolean): string[] {
  if (!firstOrder) return [...propVars(f)];
  const s = signature(f);
  return [...[...s.preds.keys()], ...[...s.funcs.keys()], ...s.consts];
}

export function FormulaValasz({
  children,
  helyes,
  mod = 'ekv',
  elsorendu = false,
  tipp,
  magyarazat,
  kezdo = '',
}: {
  children?: ReactNode;
  /** the reference answer */
  helyes: string;
  mod?: Mode;
  elsorendu?: boolean;
  /** hint shown after the first wrong answer */
  tipp?: ReactNode;
  magyarazat?: ReactNode;
  /** starting text in the box */
  kezdo?: string;
}) {
  const ex = useExercise();
  const [src, setSrc] = useState(kezdo);
  const [msg, setMsg] = useState<ReactNode>(null);
  const target = useMemo(() => parse(helyes, elsorendu).ast, [helyes, elsorendu]);
  const solution = mod === 'teljes' ? show(target) : minimal(target);

  const check = () => {
    let f: Formula;
    try {
      f = parse(src, elsorendu).ast;
    } catch (e) {
      setMsg(<ParseErrorView error={e} src={src} />);
      return;
    }
    const allowed = symbolsOf(target, elsorendu);
    const unknown = symbolsOf(f, elsorendu).filter((s) => !allowed.includes(s));
    if (unknown.length) {
      setMsg(
        <Feedback kind="no">
          Ismeretlen jel: <b>{unknown.join(', ')}</b>. Ebben a feladatban ezeket használd: {allowed.join(', ')}.
        </Feedback>
      );
      return;
    }

    if (mod === 'tiszta' || mod === 'prenex') {
      if (foDifference(f, target)) return no('Ez már nem ugyanazt jelenti, mint az eredeti formula. Csak megengedett átalakítást végezz!');
      const before = analyseFirstOrder(target).free.sort().join(',');
      const after = analyseFirstOrder(f).free.sort().join(',');
      if (before !== after) return no(`A szabad változóknak (paramétereknek) meg kell maradniuk: {${before}}. Szabad változót nem szabad átnevezni.`);
      if (mod === 'tiszta') {
        const a = analyseFirstOrder(f);
        if (!a.clean)
          return no(
            a.doubleBound.length
              ? `Még két kvantor köti ugyanazt a változót: ${a.doubleBound.join(', ')}.`
              : `Ez a változó szabadon és kötötten is előfordul: ${a.freeAndBound.join(', ')}.`
          );
      } else if (!isPrenex(f)) return no('Még nem prenex: minden kvantornak a formula legelején kell állnia, utánuk már kvantormentes rész jön.');
      return ok();
    }

    if (mod === 'knf' || mod === 'dnf') {
      const row = propDifference(f, target);
      if (row) return no('Ez nem ekvivalens a kiinduló formulával.');
      const problem = normalFormProblem(f, mod);
      return problem ? no(`Ekvivalens, de még nem ${mod.toUpperCase()}. ${problem}`) : ok();
    }

    if (mod === 'ekv') {
      if (!elsorendu) {
        const row = propDifference(f, target);
        if (!row) return ok();
        const vals = Object.entries(row)
          .map(([k, v]) => `${k} = ${v ? 1 : 0}`)
          .join(', ');
        return no(
          <>
            Nem ugyanazt mondja. Például ha <b>{vals}</b>, akkor a te formulád {evalText(f, row)}, a mondat viszont{' '}
            {evalText(target, row)}.
          </>
        );
      }
      const m = foDifference(f, target);
      if (!m) return ok();
      const lines = describeModel(m, mergeSignatures(signature(f), signature(target)));
      return no(
        <>
          Nem ugyanazt mondja. Egy kis világ, ahol eltérnek:
          <code className="model">{lines.join('   ')}</code>
        </>
      );
    }

    if (shape(f) !== shape(target)) {
      const equivalent = elsorendu ? !foDifference(f, target, 400) : !propDifference(f, target);
      return no(
        equivalent
          ? 'Ez ugyanazt jelenti, de más a szerkezete: itt az eredeti formulát kell átírni, nem egy vele egyenértékűt.'
          : 'Ez már egy másik formula: a zárójelek elhagyása vagy kitétele megváltoztatta a szerkezetet. Figyelj a precedenciára!'
      );
    }
    const n = groupingParens(src);
    if (mod === 'teljes') {
      const need = binCount(target);
      if (n < need)
        return no(
          `Még ${need - n} zárójelpár hiányzik. A hivatalos alakban minden kétargumentumú jel (∧ ∨ ⊃ ≡) köré kell egy pár, a legkülsőre is.`
        );
      if (n > need) return no(`${n - need} pár fölösleges: ¬ és kvantor köré nem kell külön zárójel, és egy jelhez csak egy pár tartozik.`);
    }
    if (mod === 'minimalis') {
      const min = minimalParens(target);
      if (n > min) return no(`Jó a szerkezet, de még ${n - min} zárójelpár elhagyható.`);
    }
    ok();
  };

  const ok = () => {
    setMsg(null);
    ex.solve();
  };
  const no = (text: ReactNode) => {
    ex.miss();
    setMsg(<Feedback kind="no">{text}</Feedback>);
  };

  const symbols = elsorendu ? ['¬', '∧', '∨', '⊃', '≡', '∀', '∃', '(', ')', ','] : ['¬', '∧', '∨', '⊃', '≡', '(', ')'];

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      {ex.done ? (
        <div className="answer line">{ex.ok ? src : solution}</div>
      ) : (
        <>
          <FormulaInput value={src} onChange={setSrc} symbols={symbols} label="Válasz" />
          <CheckBar ex={ex} onCheck={check} disabled={!src.trim()} />
        </>
      )}
      {!ex.done ? msg : null}
      {!ex.done && ex.wrong > 0 && tipp ? <Feedback kind="info">{tipp}</Feedback> : null}
      <DoneNote ex={ex}>
        {ex.shown ? (
          <>
            {SOLUTION_TEXT[mod]}
            <span className="line">{solution}</span>.{' '}
          </>
        ) : null}
        {magyarazat}
      </DoneNote>
    </div>
  );
}

const evalText = (f: Formula, row: Record<string, boolean>) => (evaluate(f, row) ? 'igaz (1)' : 'hamis (0)');
