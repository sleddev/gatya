import { useState } from 'react';

import { frac, sgn, sup } from '@/lib/numbers';
import type { Plane } from '@/lib/plane';
import { fitPolynomial, horner, polyString } from '@/lib/poly';

import { Bench, PlaneCanvas } from './ui';

const LETTERS = 'ABCDEF';

/** Drag points and see the unique polynomial through them, with its system of equations (FitPoly by hand). */
export function PolinomIllesztes({
  pontok = [
    [2, 3],
    [8, 5],
  ],
}: {
  pontok?: [number, number][];
}) {
  const [pts, setPts] = useState<[number, number][]>(pontok.map((p) => [...p] as [number, number]));
  const n = pts.length;
  const sameX = new Set(pts.map((p) => p[0])).size < n;
  const co = sameX ? null : fitPolynomial(pts);
  const names = 'abcde'.slice(0, n).split('');
  const general = names
    .map((k, i) => {
      const p = n - 1 - i;
      return k + (p ? `x${p > 1 ? sup(p) : ''}` : '');
    })
    .join(' + ');

  const draw = (p: Plane) => {
    const C = p.col;
    if (co) p.fn((x) => horner(co, x), C.acc, 2.6);
    pts.forEach(([x, y], i) => {
      p.handle(x, y, C.q1);
      p.text(x, y, `${LETTERS[i]}(${sgn(x)}, ${sgn(y)})`, C.ink);
    });
  };

  const update = (i: number, x: number, y: number) => setPts(pts.map((q, j) => (j === i ? [x, y] : q)));

  return (
    <Bench title="Polinom illesztése pontokra" hint="Húzd a pontokat (egész koordinátákra illeszkednek). Új ponttal eggyel nő a fokszám.">
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={n >= 5}
          onClick={() => {
            let x = 0;
            while (pts.some((p) => p[0] === x)) x++;
            setPts([...pts, [x, Math.round(co ? horner(co, x) : 0)]]);
          }}>
          Új pont
        </button>
        <button type="button" className="btn" disabled={n <= 2} onClick={() => setPts(pts.slice(0, -1))}>
          Pont törlése
        </button>
        <button type="button" className="btn" onClick={() => setPts(pontok.map((p) => [...p] as [number, number]))}>
          Alaphelyzet
        </button>
      </div>
      <div className="cols">
        <PlaneCanvas
          label="Illesztett polinom"
          options={{ xmin: -2, xmax: 11, ymin: -2, ymax: 9, aspect: 0.75, snap: 1 }}
          points={pts.map((p, i) => ({ get: () => p, set: (x: number, y: number) => update(i, x, y) }))}
          draw={draw}
        />
        <div className="out">
          {sameX ? (
            <p className="err">Két pontnak azonos az x-koordinátája. Ilyen pontokon függvény nem mehet át (egy x-hez csak egy y tartozhat), ezért mozgasd el az egyiket.</p>
          ) : (
            <>
              <p>
                {n} pont → legfeljebb {n - 1}-ed fokú: <span className="line">f(x) = {general}</span>
              </p>
              <p>Minden pont egy egyenlet:</p>
              <div className="line">
                {pts.map(([x, y], i) => (
                  <div key={i}>
                    {sgn(y)} ={' '}
                    {names
                      .map((k, j) => {
                        const p = n - 1 - j;
                        return p ? `${k}·${x < 0 ? `(${sgn(x)})` : x}${p > 1 ? sup(p) : ''}` : k;
                      })
                      .join(' + ')}
                  </div>
                ))}
              </div>
              {co ? (
                <>
                  <p>
                    Megoldás:{' '}
                    {names.map((k, i) => (
                      <span key={k} className="line">
                        {k} = {frac(co[i])}
                        {i < names.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                  <div className="line">f(x) = {polyString(co)}</div>
                  <p className="note">
                    GeoGebra: <code>FitPoly({'{'}{pts.map((_, i) => LETTERS[i]).join(', ')}{'}'}, {n - 1})</code>
                  </p>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Bench>
  );
}
