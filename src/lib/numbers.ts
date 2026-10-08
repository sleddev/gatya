// Number theory and formatting helpers shared by the widgets. Pure functions, no DOM.

export const MINUS = '−';

/** Round to `d` decimals, print with a real minus sign, never "-0". */
export function fmt(x: number, d = 3): string {
  if (!Number.isFinite(x)) return String(x);
  let r = Math.round(x * 10 ** d) / 10 ** d;
  if (Object.is(r, -0)) r = 0;
  return String(r).replace('-', MINUS);
}

export const sgn = (x: number | bigint | string) => String(x).replace('-', MINUS);

/** Wrap negative numbers in brackets: 3 -> "3", -3 -> "(−3)". */
export const par = (x: number) => (x < 0 ? `(${sgn(x)})` : String(x));

export const mod = (a: number, m: number) => ((a % m) + m) % m;

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n: number | string) =>
  String(n)
    .split('')
    .map((d) => (d === '-' ? '⁻' : SUP[+d] ?? d))
    .join('');

export interface EuclidStep {
  a: number;
  b: number;
  q: number;
  r: number;
}

/** Extended Euclidean algorithm on |a|, |b|: returns g and s, t with |a|·s + |b|·t = g. */
export function euclid(a: number, b: number): { g: number; s: number; t: number; steps: EuclidStep[] } {
  let r0 = Math.abs(a);
  let r1 = Math.abs(b);
  let s0 = 1,
    s1 = 0,
    t0 = 0,
    t1 = 1;
  const steps: EuclidStep[] = [];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    const r = r0 - q * r1;
    steps.push({ a: r0, b: r1, q, r });
    [r0, r1] = [r1, r];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  return { g: r0, s: s0, t: t0, steps };
}

export const gcd = (a: number, b: number) => euclid(a, b).g;

/** Bézout coefficients for the signed inputs: a·x + b·y = gcd(a, b). */
export function bezout(a: number, b: number) {
  const e = euclid(a, b);
  return { g: e.g, x: e.s * (a < 0 ? -1 : 1), y: e.t * (b < 0 ? -1 : 1), steps: e.steps };
}

export type Diophantine =
  | { solvable: false; g: number }
  | {
      solvable: true;
      g: number;
      /** particular solution straight from Bézout × c/g */
      x0: number;
      y0: number;
      /** the solution with the smallest non-negative x */
      x: number;
      y: number;
      /** general solution: x + dx·t, y − dy·t */
      dx: number;
      dy: number;
    };

/** Solve a·x + b·y = c over the integers. */
export function diophantine(a: number, b: number, c: number): Diophantine {
  const { g, x: bx, y: by } = bezout(a, b);
  if (g === 0 || c % g !== 0) return { solvable: false, g };
  const k = c / g;
  const x0 = bx * k;
  const y0 = by * k;
  const dx = b / g;
  const dy = a / g;
  let x = x0;
  let y = y0;
  if (dx !== 0) {
    x = mod(x0, Math.abs(dx));
    const t = (x - x0) / dx;
    y = y0 - dy * t;
  }
  return { solvable: true, g, x0, y0, x, y, dx, dy };
}

/** Prime factorization by trial division, as [prime, exponent] pairs. */
export function factor(n: number): [number, number][] {
  const out: [number, number][] = [];
  let m = n;
  for (let p = 2; p * p <= m; p += p === 2 ? 1 : 2) {
    let e = 0;
    while (m % p === 0) {
      m /= p;
      e++;
    }
    if (e) out.push([p, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

export const canon = (f: [number, number][]) => f.map(([p, e]) => (e > 1 ? `${p}${sup(e)}` : String(p))).join(' · ');
export const divisorCount = (f: [number, number][]) => f.reduce((a, [, e]) => a * (e + 1), 1);
export const eulerPhi = (f: [number, number][]) => f.reduce((a, [p, e]) => a * (p - 1) * p ** (e - 1), 1);

/** a^k mod m with BigInt (exact for any size). */
export function modPow(a: bigint, k: bigint, m: bigint): bigint {
  let r = 1n;
  let b = ((a % m) + m) % m;
  let e = k;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r % m;
}

export type Congruence =
  | { solvable: false; d: number }
  | { solvable: true; d: number; a1: number; b1: number; m1: number; inv: number; x0: number; all: number[] };

/** Solve a·x ≡ b (mod m) the way the lecture does: divide by d = (a, m), then invert. */
export function linearCongruence(a: number, b: number, m: number): Congruence {
  const d = gcd(a, m);
  if (d === 0 || mod(b, d) !== 0) return { solvable: false, d };
  const a1 = a / d;
  const b1 = b / d;
  const m1 = m / d;
  if (m1 === 1) return { solvable: true, d, a1, b1, m1, inv: 0, x0: 0, all: Array.from({ length: Math.min(d, 20) }, (_, k) => k) };
  const inv = mod(euclid(mod(a1, m1), m1).s, m1);
  const x0 = Number((BigInt(inv) * BigInt(mod(b1, m1))) % BigInt(m1));
  return { solvable: true, d, a1, b1, m1, inv, x0, all: Array.from({ length: Math.min(d, 20) }, (_, k) => x0 + k * m1) };
}

export interface DivRule {
  by: number;
  looksAt: string;
  ok: boolean;
}

/** The divisibility rules from the lecture, applied to n ≥ 1. */
export function divisibilityRules(n: number): DivRule[] {
  const s = String(n);
  const d = s.split('').reverse().map(Number);
  const digitSum = d.reduce((a, b) => a + b, 0);
  const alt = d.reduce((a, x, i) => a + (i % 2 ? -x : x), 0);
  const last = (k: number) => Number(s.slice(-k));
  return [
    { by: 2, looksAt: `utolsó jegy: ${d[0]}`, ok: d[0] % 2 === 0 },
    { by: 5, looksAt: `utolsó jegy: ${d[0]}`, ok: d[0] % 5 === 0 },
    { by: 4, looksAt: `utolsó két jegy: ${last(2)}`, ok: last(2) % 4 === 0 },
    { by: 25, looksAt: `utolsó két jegy: ${last(2)}`, ok: last(2) % 25 === 0 },
    { by: 8, looksAt: `utolsó három jegy: ${last(3)}`, ok: last(3) % 8 === 0 },
    { by: 3, looksAt: `számjegyösszeg: ${digitSum}`, ok: digitSum % 3 === 0 },
    { by: 9, looksAt: `számjegyösszeg: ${digitSum}`, ok: digitSum % 9 === 0 },
    { by: 11, looksAt: `váltakozó összeg a₀ − a₁ + a₂ − …: ${sgn(alt)}`, ok: alt % 11 === 0 },
  ];
}

/** Best small-denominator fraction for x, e.g. 2.3333333 -> "7/3". */
export function frac(x: number, maxDen = 2000): string {
  if (Math.abs(x - Math.round(x)) < 1e-9) return sgn(Math.round(x));
  for (let d = 2; d <= maxDen; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9 * Math.max(1, Math.abs(x))) return `${sgn(n)}/${d}`;
  }
  return fmt(x, 4);
}

/** Parse "1, 2, 3" / "a b c" into a de-duplicated list of trimmed strings. */
export const parseList = (s: string) => [...new Set(s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean))];

export const sortItems = (a: string[]) =>
  a.every((x) => !Number.isNaN(Number(x))) ? [...a].sort((x, y) => Number(x) - Number(y)) : [...a].sort();

export const showSet = (a: string[]) => (a.length ? `{${sortItems(a).map(sgn).join(', ')}}` : '∅');
