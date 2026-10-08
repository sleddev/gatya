// Formatting helpers for complex numbers.
import { fmt, gcd, MINUS, mod } from './numbers.ts';

export const arg = (a: number, b: number) => mod(Math.atan2(b, a), 2 * Math.PI);

/** Angle as a multiple of π when it is a multiple of π/12, otherwise in radians. */
export function angleText(phi: number): { text: string; degrees: string } {
  let p = mod(phi, 2 * Math.PI);
  if (Math.abs(p - 2 * Math.PI) < 1e-9) p = 0;
  const degrees = `${fmt((p * 180) / Math.PI, 2)}°`;
  const k = p / (Math.PI / 12);
  if (Math.abs(k - Math.round(k)) < 0.03) {
    let n = Math.round(k) % 24;
    let d = 12;
    if (n === 0) return { text: '0', degrees };
    const g = gcd(n, d);
    n /= g;
    d /= g;
    return { text: `${n === 1 ? '' : n}π${d === 1 ? '' : `/${d}`}`, degrees };
  }
  return { text: `${fmt(p, 4)} rad`, degrees };
}

/** √(a²+b²) written exactly when a²+b² is (close to) an integer: 2, √2, 2√2, … */
export function absText(a: number, b: number): string {
  const s = a * a + b * b;
  const r = Math.round(s);
  if (Math.abs(s - r) < 1e-3) {
    const q = Math.round(Math.sqrt(r));
    if (q * q === r) return String(q);
    for (let k = Math.floor(Math.sqrt(r)); k > 1; k--) if (r % (k * k) === 0) return `${k}√${r / (k * k)}`;
    return `√${r}`;
  }
  return fmt(Math.sqrt(s));
}

/** "a + bi" with real minus signs and the usual simplifications. */
export function complexText(a: number, b: number): string {
  const A = Number(fmt(a).replace(MINUS, '-'));
  const B = Number(fmt(b).replace(MINUS, '-'));
  if (!B) return fmt(A);
  const bi = `${Math.abs(B) === 1 ? '' : fmt(Math.abs(B))}i`;
  if (!A) return (B < 0 ? MINUS : '') + bi;
  return `${fmt(A)} ${B < 0 ? MINUS : '+'} ${bi}`;
}
