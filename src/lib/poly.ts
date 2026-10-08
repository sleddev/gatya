// Polynomials as coefficient arrays, highest degree first: [a, b, c] = a·x² + b·x + c.
import { frac, MINUS, sup } from './numbers.ts';

export const horner = (c: number[], x: number) => c.reduce((s, a) => s * x + a, 0);
export const derivative = (c: number[]) => c.slice(0, -1).map((a, i) => a * (c.length - 1 - i));

/** Real roots in [lo, hi] by sign changes + bisection (simple roots only). */
export function signChangeRoots(c: number[], lo = -12, hi = 12): number[] {
  const f = (x: number) => horner(c, x);
  const out: number[] = [];
  const N = 4800;
  const h = (hi - lo) / N;
  let x0 = lo;
  let f0 = f(x0);
  for (let i = 1; i <= N; i++) {
    const x1 = lo + i * h;
    const f1 = f(x1);
    if (f0 === 0) out.push(x0);
    else if (f0 * f1 < 0) {
      let a = x0,
        b = x1,
        fa = f0;
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2;
        const fm = f(m);
        if (fa * fm <= 0) b = m;
        else {
          a = m;
          fa = fm;
        }
      }
      out.push((a + b) / 2);
    }
    x0 = x1;
    f0 = f1;
  }
  return out.filter((r, i) => i === 0 || Math.abs(r - out[i - 1]) > 1e-6);
}

export interface Extremum {
  x: number;
  y: number;
  kind: 'max' | 'min';
}

/** Local extrema: where f′ changes sign. */
export function extrema(c: number[]): Extremum[] {
  const d = derivative(c);
  const dd = derivative(d);
  return signChangeRoots(d)
    .filter((x) => horner(d, x - 1e-4) * horner(d, x + 1e-4) < 0)
    .map((x) => ({ x, y: horner(c, x), kind: horner(dd, x) < 0 ? 'max' : 'min' }));
}

/** Real roots including touching (double) roots that sit on an extremum. */
export function roots(c: number[]): number[] {
  const rs = signChangeRoots(c);
  for (const e of extrema(c)) if (Math.abs(e.y) < 1e-7 && !rs.some((r) => Math.abs(r - e.x) < 1e-4)) rs.push(e.x);
  return rs.sort((a, b) => a - b);
}

/** Pretty polynomial: [1/3, 7/3] -> "1/3x + 7/3". */
export function polyString(c: number[], v = 'x', exact = true): string {
  const n = c.length - 1;
  let s = '';
  c.forEach((a, i) => {
    const p = n - i;
    if (Math.abs(a) < 1e-12) return;
    const neg = a < 0;
    const abs = Math.abs(a);
    const num = abs === 1 && p > 0 ? '' : exact ? frac(abs) : String(+abs.toFixed(2));
    const term = num + (p > 0 ? v + (p > 1 ? sup(p) : '') : '');
    s += s ? (neg ? ` ${MINUS} ` : ' + ') + term : (neg ? MINUS : '') + term;
  });
  return s || '0';
}

/** Gaussian elimination with partial pivoting. Returns null for singular systems. */
export function solveLinear(M: number[][], y: number[]): number[] | null {
  const n = y.length;
  const A = M.map((r, i) => [...r, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((r, i) => r[n] / r[i]);
}

/** Coefficients of the unique polynomial of degree ≤ n−1 through n points with distinct x. */
export function fitPolynomial(points: [number, number][]): number[] | null {
  const n = points.length;
  const M = points.map(([x]) => Array.from({ length: n }, (_, i) => x ** (n - 1 - i)));
  return solveLinear(
    M,
    points.map((p) => p[1])
  );
}
