// Fill in a truth table by tapping the cells (empty → 1 → 0). With `sor` it is a single row: the value
// of the formula in one interpretation, computed subformula by subformula.
import { useMemo, useState, type ReactNode } from 'react';

import { minimal } from '@/lib/course';
import { evaluate, parse, propVars, subformulas, valuations, type Formula, type Valuation } from '@/lib/logic';

import { CheckBar, DoneNote, Feedback, useExercise } from './lesson';

function parseRow(sor: string): Valuation {
  const v: Valuation = {};
  for (const part of sor.split(/[,;]/)) {
    const m = /^\s*(\S+)\s*=\s*([01])\s*$/.exec(part);
    if (m) v[m[1]] = m[2] === '1';
  }
  return v;
}

export function TablaKitolto({
  formula,
  sor,
  reszek = true,
  children,
  magyarazat,
}: {
  formula: string;
  /** one interpretation only, e.g. "X=1, Y=0, Z=1" */
  sor?: string;
  /** columns for the subformulas too (default), or only the whole formula */
  reszek?: boolean;
  children?: ReactNode;
  magyarazat?: ReactNode;
}) {
  const ex = useExercise();
  const f = useMemo(() => parse(formula).ast, [formula]);
  const names = useMemo(() => [...propVars(f)].sort(), [f]);
  const rows = useMemo(() => (sor ? [parseRow(sor)] : valuations(names).rows), [sor, names]);
  const cols: Formula[] = useMemo(() => (reszek ? subformulas(f) : [f]), [f, reszek]);
  const [cells, setCells] = useState<(boolean | null)[][]>(() => rows.map(() => cols.map(() => null)));
  const [marked, setMarked] = useState(false);

  const truth = rows.map((r) => cols.map((c) => evaluate(c, r)));
  const shown = ex.shown ? truth : cells;
  const empty = cells.flat().filter((c) => c === null).length;
  const wrongCells = cells.flat().filter((c, i) => c !== null && c !== truth.flat()[i]).length;

  const tap = (r: number, c: number) => {
    if (ex.done) return;
    setMarked(false);
    setCells((all) =>
      all.map((row, i) => (i !== r ? row : row.map((v, j) => (j !== c ? v : v === null ? true : v ? false : null))))
    );
  };

  const check = () => {
    setMarked(true);
    if (empty === 0 && wrongCells === 0) ex.solve();
    else ex.miss();
  };

  return (
    <div className="ex">
      {children ? <div className="ex-q">{children}</div> : null}
      <div className="tablewrap">
        <table className="tt">
          <thead>
            <tr>
              {names.map((n) => (
                <th key={n} className="given">
                  {n}
                </th>
              ))}
              {cols.map((c, j) => (
                <th key={j} className={j === cols.length - 1 ? 'main' : undefined}>
                  {minimal(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {names.map((n) => (
                  <td key={n} className="given">
                    {r[n] ? 1 : 0}
                  </td>
                ))}
                {cols.map((_, j) => {
                  const v = shown[i][j];
                  const bad = marked && !ex.done && v !== null && v !== truth[i][j];
                  return (
                    <td key={j} className={j === cols.length - 1 ? 'main' : undefined}>
                      <button
                        type="button"
                        className={`cell${v === null ? ' empty' : ''}${bad ? ' bad' : ''}${ex.done ? ' locked' : ''}`}
                        onClick={() => tap(i, j)}
                        aria-label={`${i + 1}. sor, ${minimal(cols[j])}`}>
                        {v === null ? '·' : v ? 1 : 0}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!ex.done ? <p className="note">Koppints egy cellára: üres → 1 → 0. A bal oldali, szürke oszlopok adottak.</p> : null}
      <CheckBar ex={ex} onCheck={check} />
      {marked && !ex.done ? (
        <Feedback kind="no">
          {wrongCells ? `${wrongCells} cella rossz (pirossal jelölve). ` : ''}
          {empty ? `${empty} cella még üres.` : ''}
          {wrongCells ? ' Tipp: mindig a közvetlen részformulák oszlopából számolj, ne fejből az egészet.' : ''}
        </Feedback>
      ) : null}
      <DoneNote ex={ex}>{magyarazat}</DoneNote>
    </div>
  );
}
