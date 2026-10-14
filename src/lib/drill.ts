// Random routine tasks for the DiMat and SzMV practice pages. Each task carries its own answer key
// (checked by value through expr.ts) and a short worked solution. Pure, seeded, no DOM.
import { rng } from './course.ts';
import { canon, divisorCount, divRem, euclid, eulerPhi, factor, frac, linearCongruence, MINUS, modPow, sgn, sup } from './numbers.ts';
import { polyString } from './poly.ts';

export type DrillKind =
  | 'lnko'
  | 'maradek'
  | 'osztoszam'
  | 'phi'
  | 'hatvanymod'
  | 'linkong'
  | 'komplex'
  | 'ihatvany'
  | 'trig'
  | 'vektor'
  | 'skalaris'
  | 'meroleges'
  | 'kereszt'
  | 'vegyes'
  | 'derivalt'
  | 'erinto'
  | 'egyenes'
  | 'csucs';

export const DRILL_LABEL: Record<DrillKind, string> = {
  lnko: 'lnko',
  maradek: 'Maradékos osztás',
  osztoszam: 'Osztók száma',
  phi: 'φ(m)',
  hatvanymod: 'Hatvány maradéka',
  linkong: 'Lineáris kongruencia',
  komplex: 'Komplex műveletek',
  ihatvany: 'i hatványai',
  trig: 'Trigonometrikus alak',
  vektor: 'Vektorműveletek',
  skalaris: 'Skaláris szorzat',
  meroleges: 'Merőlegesség',
  kereszt: 'Vektoriális szorzat',
  vegyes: 'Vegyes szorzat',
  derivalt: 'Deriválás',
  erinto: 'Érintő',
  egyenes: 'Egyenes két ponton át',
  csucs: 'Szélsőérték',
};

export interface DrillTask {
  /** question text (Unicode math, no LaTeX) */
  kerdes: string;
  helyes: string[];
  mezok?: string[];
  forma?: 'mezok' | 'vektor' | 'halmaz';
  valtozok?: string[];
  modulo?: number;
  gombok?: string[];
  megoldas: string;
}

type R = () => number;
const int = (r: R, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: R, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const nz = (r: R, lo: number, hi: number) => {
  let v = 0;
  while (v === 0) v = int(r, lo, hi);
  return v;
};
const gcd = (a: number, b: number) => euclid(a, b).g;
const p = (x: number) => (x < 0 ? `(${sgn(x)})` : String(x));

/** "a + bi" with a real minus sign and no "1i"/"+ −". */
export function cx(a: number, b: number): string {
  const im = (v: number) => (Math.abs(v) === 1 ? 'i' : `${frac(Math.abs(v))}i`);
  if (b === 0) return frac(a);
  if (a === 0) return (b < 0 ? MINUS : '') + im(b);
  return `${frac(a)} ${b < 0 ? MINUS : '+'} ${im(b)}`;
}

const vec = (v: number[]) => `(${v.map(sgn).join('; ')})`;

function lnko(r: R): DrillTask {
  const g = pick(r, [1, 2, 3, 4, 6, 7, 9, 12, 13, 14, 18, 21]);
  let a = 0,
    b = 0;
  do {
    a = g * int(r, 4, 60);
    b = g * int(r, 3, 40);
  } while (a === b || gcd(a, b) !== g || euclid(a, b).steps.length < 3);
  if (a < b) [a, b] = [b, a];
  const e = euclid(a, b);
  return {
    kerdes: `Mennyi (${a}, ${b})?`,
    helyes: [String(e.g)],
    megoldas: e.steps.map((s) => `${s.a} = ${s.b}·${s.q} + ${s.r}`).join(';  ') + `. Az utolsó nem nulla maradék: ${e.g}.`,
  };
}

function maradek(r: R): DrillTask {
  const b = int(r, 3, 13);
  const a = nz(r, -99, 99);
  const { q, r: rr } = divRem(a, b);
  return {
    kerdes: `Írd fel maradékosan: ${sgn(a)} = ${b} · q + r, ahol 0 ≤ r < ${b}.`,
    helyes: [String(q), String(rr)],
    mezok: ['q =', 'r ='],
    megoldas: `${sgn(a)} = ${b} · ${p(q)} + ${rr}. A maradék sosem negatív${a < 0 ? ': negatív számnál lefelé kerekített hányadossal dolgozunk' : ''}.`,
  };
}

function osztoszam(r: R): DrillTask {
  const primes = [2, 3, 5, 7, 11];
  let n = 1;
  while (n < 30 || n > 5000) {
    n = 1;
    for (const q of primes) if (r() < 0.55) n *= q ** int(r, 1, q < 5 ? 4 : 2);
  }
  const f = factor(n);
  return {
    kerdes: `Hány pozitív osztója van a ${n} számnak?`,
    helyes: [String(divisorCount(f))],
    megoldas: `${n} = ${canon(f)}, így d(${n}) = ${f.map(([, e]) => `(${e}+1)`).join('·')} = ${divisorCount(f)}.`,
  };
}

function phi(r: R): DrillTask {
  const m = pick(r, [9, 12, 15, 16, 18, 20, 21, 24, 25, 27, 28, 30, 35, 36, 40, 45, 49, 50, 60, 63, 72, 100, 13, 17, 29]);
  const f = factor(m);
  return {
    kerdes: `Mennyi φ(${m})?`,
    helyes: [String(eulerPhi(f))],
    megoldas:
      f.length === 1 && f[0][1] === 1
        ? `${m} prím, így φ(${m}) = ${m} − 1 = ${m - 1}.`
        : `${m} = ${canon(f)}, így φ(${m}) = ${m}·${f.map(([q]) => `(1 − 1/${q})`).join('·')} = ${eulerPhi(f)}.`,
  };
}

function hatvanymod(r: R): DrillTask {
  let m = 0,
    a = 0;
  do {
    m = pick(r, [7, 9, 10, 11, 13, 15, 16, 17, 19, 20, 21, 23, 25, 29]);
    a = int(r, 2, 12);
  } while (gcd(a, m) !== 1 || a % m === 1);
  const ph = eulerPhi(factor(m));
  const k = int(r, 3, 60) * ph + int(r, 1, ph - 1);
  const res = Number(modPow(BigInt(a), BigInt(k), BigInt(m)));
  const rem = k % ph;
  return {
    kerdes: `Mennyi maradékot ad ${a}${sup(k)} ${m}-mal osztva?`,
    helyes: [String(res)],
    megoldas: `(${a}, ${m}) = 1 és φ(${m}) = ${ph}. ${k} = ${ph}·${(k - rem) / ph} + ${rem}, így ${a}${sup(k)} ≡ ${a}${sup(rem)} ≡ ${res} (mod ${m}).`,
  };
}

function linkong(r: R): DrillTask {
  for (;;) {
    const m = int(r, 5, 30);
    const a = int(r, 2, m - 1);
    const b = int(r, 1, m - 1);
    const c = linearCongruence(a, b, m);
    if (!c.solvable) continue;
    const d = gcd(a, m);
    if (d > 4) continue;
    if (d === 1) {
      return {
        kerdes: `Oldd meg: ${a}x ≡ ${b} (mod ${m}). (Elég egy megoldás; mod ${m} egyértelmű.)`,
        helyes: [String(c.x0)],
        mezok: ['x ≡'],
        modulo: m,
        megoldas: `(${a}, ${m}) = 1, tehát egy megoldásosztály van: x ≡ ${c.x0} (mod ${m}). Ellenőrzés: ${a}·${c.x0} = ${a * c.x0} ≡ ${b}.`,
      };
    }
    const sols = Array.from({ length: d }, (_, i) => c.x0 + (i * m) / d);
    return {
      kerdes: `Oldd meg: ${a}x ≡ ${b} (mod ${m}). Add meg az összes megoldást 0 és ${m - 1} között!`,
      helyes: [sols.join(', ')],
      forma: 'halmaz',
      megoldas: `(${a}, ${m}) = ${d} | ${b}. Osztva: ${a / d}x ≡ ${b / d} (mod ${m / d}), ebből x ≡ ${c.x0} (mod ${m / d}). Mod ${m}: ${sols.join(', ')}.`,
    };
  }
}

function komplex(r: R): DrillTask {
  const z = [nz(r, -6, 6), nz(r, -6, 6)];
  const w = [nz(r, -5, 5), nz(r, -5, 5)];
  const op = pick(r, ['+', '−', '·', '·', '/', '/'] as const);
  const Z = cx(z[0], z[1]);
  const W = cx(w[0], w[1]);
  if (op === '+' || op === '−') {
    const s = op === '+' ? 1 : -1;
    const res = cx(z[0] + s * w[0], z[1] + s * w[1]);
    return { kerdes: `(${Z}) ${op} (${W}) = ?`, helyes: [res], gombok: ['i'], megoldas: `Valós rész a valós résszel, képzetes a képzetessel: ${res}.` };
  }
  if (op === '·') {
    const re = z[0] * w[0] - z[1] * w[1];
    const im = z[0] * w[1] + z[1] * w[0];
    return {
      kerdes: `(${Z}) · (${W}) = ?`,
      helyes: [cx(re, im)],
      gombok: ['i'],
      megoldas: `Tagonként szorzunk, i² = −1: (${p(z[0])}·${p(w[0])} − ${p(z[1])}·${p(w[1])}) + (${p(z[0])}·${p(w[1])} + ${p(z[1])}·${p(w[0])})i = ${cx(re, im)}.`,
    };
  }
  // division: pick the result first so it comes out nice
  const q = [nz(r, -4, 4), int(r, -4, 4)];
  const num = [q[0] * w[0] - q[1] * w[1], q[0] * w[1] + q[1] * w[0]];
  const N = cx(num[0], num[1]);
  const n2 = w[0] ** 2 + w[1] ** 2;
  return {
    kerdes: `(${N}) / (${W}) = ?`,
    helyes: [cx(q[0], q[1])],
    gombok: ['i'],
    megoldas: `Bővítünk a nevező konjugáltjával, ${cx(w[0], -w[1])}-vel. A nevező |w|² = ${n2} lesz; az eredmény ${cx(q[0], q[1])}.`,
  };
}

function ihatvany(r: R): DrillTask {
  const n = int(r, 5, 2030);
  const vals = ['1', 'i', `${MINUS}1`, `${MINUS}i`];
  return {
    kerdes: `Mennyi i${sup(n)}?`,
    helyes: [vals[n % 4]],
    gombok: ['i'],
    megoldas: `${n} = 4·${Math.floor(n / 4)} + ${n % 4}, és i⁴ = 1, így i${sup(n)} = i${sup(n % 4)} = ${vals[n % 4]}.`,
  };
}

// first-quadrant points with a nice angle: text of a, text of b, |z| factor (as text and value), angle (in units of π)
const NICE: { a: [string, number]; b: [string, number]; r: [string, number]; phi: [number, number] }[] = [
  { a: ['1', 1], b: ['1', 1], r: ['√2', Math.SQRT2], phi: [1, 4] },
  { a: ['1', 1], b: ['√3', Math.sqrt(3)], r: ['2', 2], phi: [1, 3] },
  { a: ['√3', Math.sqrt(3)], b: ['1', 1], r: ['2', 2], phi: [1, 6] },
];

function trig(r: R): DrillTask {
  const quad = int(r, 1, 4);
  const axis = r() < 0.2;
  const k = pick(r, [1, 1, 2, 3]);
  const mul = (t: string) => (k === 1 ? t : t === '1' ? String(k) : `${k}${t}`);
  if (axis) {
    const opts: [string, number][] = [
      [String(k), 0],
      [`${MINUS}${k}`, 1],
      [`${k === 1 ? '' : k}i`, 0.5],
      [`${MINUS}${k === 1 ? '' : k}i`, 1.5],
    ];
    const [t, ph] = pick(r, opts);
    const phT = ph === 0 ? '0' : ph === 1 ? 'π' : ph === 0.5 ? 'π/2' : '3π/2';
    return {
      kerdes: `Add meg z = ${t} abszolútértékét és irányszögét (φ ∈ [0, 2π))!`,
      helyes: [String(k), phT],
      mezok: ['|z| =', 'φ ='],
      gombok: ['π', '√'],
      megoldas: `A tengelyen fekszik: |z| = ${k}, φ = ${phT}.`,
    };
  }
  const n = pick(r, NICE);
  const [num, den] = n.phi;
  // angle in the right quadrant, as a fraction of π
  const frac0 = num / den;
  const ang = quad === 1 ? frac0 : quad === 2 ? 1 - frac0 : quad === 3 ? 1 + frac0 : 2 - frac0;
  const angT = piText(ang);
  const sa = quad === 2 || quad === 3 ? MINUS : '';
  const sb = quad === 3 || quad === 4 ? MINUS : '+';
  const aT = mul(n.a[0]);
  const bT = n.b[0] === '1' ? (k === 1 ? 'i' : `${k}i`) : `${mul(n.b[0])}i`;
  const z = `${sa}${aT} ${sb === '+' ? '+' : MINUS} ${bT}`;
  const rT = n.r[0] === '2' ? String(2 * k) : k === 1 ? n.r[0] : `${k}${n.r[0]}`;
  return {
    kerdes: `Add meg z = ${z} abszolútértékét és irányszögét (φ ∈ [0, 2π))!`,
    helyes: [rT, angT],
    mezok: ['|z| =', 'φ ='],
    gombok: ['π', '√'],
    megoldas: `|z| = ${rT}. A hegyesszög ${piText(frac0)}, és z a ${['I.', 'II.', 'III.', 'IV.'][quad - 1]} síknegyedben van, így φ = ${angT}.`,
  };
}

/** a fraction of π as text: 0.75 -> "3π/4" */
export function piText(x: number): string {
  for (const d of [1, 2, 3, 4, 6, 12]) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) {
      if (n === 0) return '0';
      const top = n === 1 ? 'π' : `${n}π`;
      return d === 1 ? top : `${top}/${d}`;
    }
  }
  return `${x}π`;
}

function vektor(r: R): DrillTask {
  const kind = pick(r, ['AB', 'sum', 'scal', 'len'] as const);
  if (kind === 'AB') {
    const A = [int(r, -6, 6), int(r, -6, 6)];
    const B = [int(r, -6, 6), int(r, -6, 6)];
    const v = [B[0] - A[0], B[1] - A[1]];
    return { kerdes: `A${vec(A)}, B${vec(B)}. Mennyi az AB vektor?`, helyes: v.map(String), forma: 'vektor', megoldas: `Vég mínusz kezdet: ${vec(v)}.` };
  }
  if (kind === 'sum') {
    const u = [nz(r, -6, 6), nz(r, -6, 6)];
    const v = [nz(r, -6, 6), nz(r, -6, 6)];
    const k = nz(r, -3, 3);
    const res = [u[0] + k * v[0], u[1] + k * v[1]];
    return {
      kerdes: `u = ${vec(u)}, v = ${vec(v)}. Mennyi u + ${p(k)}·v?`,
      helyes: res.map(String),
      forma: 'vektor',
      megoldas: `${p(k)}·v = ${vec([k * v[0], k * v[1]])}, ehhez hozzáadva u-t: ${vec(res)}.`,
    };
  }
  if (kind === 'scal') {
    const u = [nz(r, -6, 6), nz(r, -6, 6), int(r, -6, 6)];
    const k = nz(r, -4, 5);
    const res = u.map((x) => k * x);
    return { kerdes: `u = ${vec(u)}. Mennyi ${p(k)}·u?`, helyes: res.map(String), forma: 'vektor', megoldas: `Minden koordinátát szorzunk: ${vec(res)}.` };
  }
  const t = pick(r, [
    [3, 4, 5],
    [6, 8, 10],
    [5, 12, 13],
    [8, 15, 17],
    [1, 1, '√2'],
    [1, 2, '√5'],
    [2, 3, '√13'],
    [2, 2, '2√2'],
  ] as const);
  const sx = r() < 0.5 ? -1 : 1;
  const sy = r() < 0.5 ? -1 : 1;
  const u = [sx * (t[0] as number), sy * (t[1] as number)];
  return {
    kerdes: `Milyen hosszú az u = ${vec(u)} vektor?`,
    helyes: [String(t[2])],
    gombok: ['√'],
    megoldas: `|u| = √(${p(u[0])}² + ${p(u[1])}²) = √${u[0] ** 2 + u[1] ** 2} = ${t[2]}.`,
  };
}

function skalaris(r: R): DrillTask {
  const dim = r() < 0.5 ? 2 : 3;
  const u = Array.from({ length: dim }, () => int(r, -6, 6));
  const v = Array.from({ length: dim }, () => int(r, -6, 6));
  const s = u.reduce((acc, x, i) => acc + x * v[i], 0);
  return {
    kerdes: `u = ${vec(u)}, v = ${vec(v)}. Mennyi u · v?`,
    helyes: [String(s)],
    megoldas: `${u.map((x, i) => `${p(x)}·${p(v[i])}`).join(' + ')} = ${s}. ${s === 0 ? 'Merőlegesek!' : s > 0 ? 'Pozitív: hegyesszöget zárnak be.' : 'Negatív: tompaszöget zárnak be.'}`,
  };
}

function meroleges(r: R): DrillTask {
  for (;;) {
    const a = nz(r, -6, 6);
    const b = nz(r, -6, 6);
    const c = nz(r, -6, 6);
    // (k, b) · (a, c) = 0  ->  k·a + b·c = 0
    if ((b * c) % a !== 0) continue;
    const k = -(b * c) / a;
    return {
      kerdes: `Melyik k-ra merőleges (k; ${sgn(b)}) az (${sgn(a)}; ${sgn(c)}) vektorra?`,
      helyes: [String(k)],
      mezok: ['k ='],
      megoldas: `Merőleges ⇔ skaláris szorzat 0: ${p(a)}k + ${p(b)}·${p(c)} = 0, tehát k = ${sgn(k)}.`,
    };
  }
}

function cross(b: number[], c: number[]) {
  return [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]];
}

function kereszt(r: R): DrillTask {
  const b = [int(r, -4, 5), int(r, -4, 5), int(r, -4, 5)];
  const c = [int(r, -4, 5), int(r, -4, 5), int(r, -4, 5)];
  const x = cross(b, c);
  return {
    kerdes: `b = ${vec(b)}, c = ${vec(c)}. Mennyi b × c?`,
    helyes: x.map(String),
    forma: 'vektor',
    megoldas: `(${p(b[1])}·${p(c[2])} − ${p(b[2])}·${p(c[1])}; ${p(b[2])}·${p(c[0])} − ${p(b[0])}·${p(c[2])}; ${p(b[0])}·${p(c[1])} − ${p(b[1])}·${p(c[0])}) = ${vec(x)}.`,
  };
}

function vegyes(r: R): DrillTask {
  const a = [int(r, -3, 4), int(r, -3, 4), int(r, -3, 4)];
  const b = [int(r, -3, 4), int(r, -3, 4), int(r, -3, 4)];
  let c = [int(r, -3, 4), int(r, -3, 4), int(r, -3, 4)];
  // every third task: coplanar on purpose
  if (r() < 0.33) {
    const s = nz(r, -2, 2);
    const t = nz(r, -2, 2);
    c = a.map((x, i) => s * x + t * b[i]);
  }
  const bc = cross(b, c);
  const v = a.reduce((acc, x, i) => acc + x * bc[i], 0);
  return {
    kerdes: `a = ${vec(a)}, b = ${vec(b)}, c = ${vec(c)}. Mennyi a · (b × c)?`,
    helyes: [String(v)],
    megoldas: `b × c = ${vec(bc)}, és a · ${vec(bc)} = ${v}.${v === 0 ? ' Nulla: a három vektor egy síkban van.' : ` A paralelepipedon térfogata ${Math.abs(v)}.`}`,
  };
}

function randPoly(r: R, deg: number) {
  const c = [nz(r, -4, 4)];
  for (let i = 0; i < deg; i++) c.push(int(r, -6, 6));
  return c;
}
const deriv = (c: number[]) => c.slice(0, -1).map((a, i) => a * (c.length - 1 - i));
const horner = (c: number[], x: number) => c.reduce((s, a) => s * x + a, 0);

function derivalt(r: R): DrillTask {
  const c = randPoly(r, int(r, 2, 4));
  const d = deriv(c);
  return {
    kerdes: `f(x) = ${polyString(c)}. Mennyi f′(x)?`,
    helyes: [polyString(d)],
    mezok: ['f′(x) ='],
    valtozok: ['x'],
    megoldas: `Tagonként (xⁿ)′ = n·xⁿ⁻¹, a konstans deriváltja 0: f′(x) = ${polyString(d)}.`,
  };
}

function erinto(r: R): DrillTask {
  const c = randPoly(r, int(r, 2, 3));
  const x0 = int(r, -2, 3);
  const y0 = horner(c, x0);
  const m = horner(deriv(c), x0);
  const line = [m, y0 - m * x0];
  return {
    kerdes: `f(x) = ${polyString(c)}. Add meg az x₀ = ${sgn(x0)} pontbeli érintő egyenletét!`,
    helyes: [polyString(line)],
    mezok: ['y ='],
    valtozok: ['x'],
    megoldas: `f(${sgn(x0)}) = ${sgn(y0)}, f′(x) = ${polyString(deriv(c))}, f′(${sgn(x0)}) = ${sgn(m)}. y − ${p(y0)} = ${sgn(m)}(x − ${p(x0)}), azaz y = ${polyString(line)}.`,
  };
}

function egyenes(r: R): DrillTask {
  const A = [int(r, -5, 5), int(r, -5, 5)];
  let B = A;
  while (B[0] === A[0]) B = [int(r, -5, 6), int(r, -5, 6)];
  const m = (B[1] - A[1]) / (B[0] - A[0]);
  const b = A[1] - m * A[0];
  return {
    kerdes: `Add meg az A${vec(A)} és B${vec(B)} pontokon átmenő egyenest y = mx + b alakban!`,
    helyes: [polyString([m, b])],
    mezok: ['y ='],
    valtozok: ['x'],
    megoldas: `m = (${sgn(B[1])} − ${p(A[1])}) / (${sgn(B[0])} − ${p(A[0])}) = ${frac(m)}; b = ${sgn(A[1])} − ${frac(m)}·${p(A[0])} = ${frac(b)}. Tehát y = ${polyString([m, b])}.`,
  };
}

function csucs(r: R): DrillTask {
  const a = nz(r, -3, 3);
  const u = int(r, -4, 4);
  const v = int(r, -6, 6);
  // a(x − u)² + v expanded
  const c = [a, -2 * a * u, a * u * u + v];
  return {
    kerdes: `Hol van szélsőértéke az f(x) = ${polyString(c)} függvénynek, és mennyi ott az értéke?`,
    helyes: [String(u), String(v)],
    mezok: ['x =', 'f(x) ='],
    megoldas: `f′(x) = ${polyString(deriv(c))} = 0 ⇔ x = ${sgn(u)}. f(${sgn(u)}) = ${sgn(v)}. Mivel f″ = ${2 * a} ${a > 0 ? '> 0, ez minimum' : '< 0, ez maximum'}.`,
  };
}

const GEN: Record<DrillKind, (r: R) => DrillTask> = {
  lnko,
  maradek,
  osztoszam,
  phi,
  hatvanymod,
  linkong,
  komplex,
  ihatvany,
  trig,
  vektor,
  skalaris,
  meroleges,
  kereszt,
  vegyes,
  derivalt,
  erinto,
  egyenes,
  csucs,
};

export function makeDrill(kind: DrillKind, seed: number): DrillTask {
  return GEN[kind](rng(seed));
}

