/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DRILL_LABEL, makeDrill, type DrillKind } from './drill.ts';
import { compareSets, compile, evalExpr, sameValue } from './expr.ts';

const KINDS = Object.keys(DRILL_LABEL) as DrillKind[];
const SEEDS = Array.from({ length: 150 }, (_, i) => i * 7919 + 13);
const nums = (s: string) => [...s.replace(/−/g, '-').matchAll(/-?\d+/g)].map((m) => Number(m[0]));
const between = (s: string, a: string, b: string) => s.slice(s.indexOf(a) + a.length, s.indexOf(b, s.indexOf(a) + a.length));
const val = (s: string) => evalExpr(s).re;

test('every answer key parses', () => {
  for (const k of KINDS)
    for (const seed of SEEDS) {
      const t = makeDrill(k, seed);
      if (t.forma === 'halmaz') continue;
      for (const h of t.helyes) assert.doesNotThrow(() => compile(h, t.valtozok ?? []), `${k} ${seed}: ${h}`);
      assert.equal(t.helyes.length, t.mezok?.length ?? t.helyes.length);
    }
});

test('number theory keys are right', () => {
  for (const seed of SEEDS) {
    const g = makeDrill('lnko', seed);
    const [a, b] = nums(g.kerdes);
    const want = Number(g.helyes[0]);
    assert.ok(a % want === 0 && b % want === 0);
    for (let d = want + 1; d <= Math.min(a, b); d++) assert.ok(a % d || b % d, `${a}, ${b}`);

    const m = makeDrill('maradek', seed);
    const [a2, b2] = nums(m.kerdes);
    const [q, r] = m.helyes.map(val);
    assert.equal(b2 * q + r, a2);
    assert.ok(r >= 0 && r < b2);

    const h = makeDrill('hatvanymod', seed);
    const [base, , mod] = [nums(h.kerdes)[0], 0, nums(h.kerdes).at(-1)!];
    const k = Number(
      h.kerdes
        .match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/)![0]
        .split('')
        .map((ch) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch))
        .join('')
    );
    let x = 1;
    for (let i = 0; i < k; i++) x = (x * base) % mod;
    assert.equal(Number(h.helyes[0]), x, h.kerdes);

    const l = makeDrill('linkong', seed);
    const [la, lb, lm] = nums(l.kerdes);
    const sols = l.forma === 'halmaz' ? l.helyes[0].split(',').map(Number) : [Number(l.helyes[0])];
    for (const s of sols) assert.equal((((la * s - lb) % lm) + lm) % lm, 0, l.kerdes);
    if (l.forma === 'halmaz') {
      const all = Array.from({ length: lm }, (_, s) => s).filter((s) => (la * s - lb) % lm === 0);
      assert.ok(compareSets(l.helyes[0], all.join(',')).ok, l.kerdes);
    }
  }
});

test('complex keys are right', () => {
  for (const seed of SEEDS) {
    const c = makeDrill('komplex', seed);
    assert.ok(sameValue(c.kerdes.replace(' = ?', ''), c.helyes[0]), c.kerdes);

    const i = makeDrill('ihatvany', seed);
    assert.ok(sameValue(i.kerdes.replace('Mennyi ', '').replace('?', ''), i.helyes[0]), i.kerdes);

    const t = makeDrill('trig', seed);
    const z = evalExpr(between(t.kerdes, 'z = ', ' abszolút'));
    assert.ok(Math.abs(Math.hypot(z.re, z.im) - val(t.helyes[0])) < 1e-9, t.kerdes);
    const arg = (Math.atan2(z.im, z.re) + 2 * Math.PI) % (2 * Math.PI);
    assert.ok(Math.abs(arg - val(t.helyes[1])) < 1e-9, `${t.kerdes} ${t.helyes[1]}`);
  }
});

test('vector keys are right', () => {
  for (const seed of SEEDS) {
    const k = makeDrill('kereszt', seed);
    const [b0, b1, b2, c0, c1, c2] = nums(k.kerdes);
    const x = k.helyes.map(val);
    assert.ok(x[0] * b0 + x[1] * b1 + x[2] * b2 === 0);
    assert.ok(x[0] * c0 + x[1] * c1 + x[2] * c2 === 0);
    assert.deepEqual(
      x.map((v) => v || 0),
      [b1 * c2 - b2 * c1, b2 * c0 - b0 * c2, b0 * c1 - b1 * c0].map((v) => v || 0)
    );

    const s = makeDrill('skalaris', seed);
    const n = nums(s.kerdes);
    const half = n.length / 2;
    assert.equal(
      val(s.helyes[0]),
      n.slice(0, half).reduce((acc, v, i) => acc + v * n[half + i], 0)
    );

    const m = makeDrill('meroleges', seed);
    const [b, a, c] = nums(m.kerdes);
    assert.ok(val(m.helyes[0]) * a + b * c === 0, m.kerdes);
  }
});

test('calculus keys are right', () => {
  const fOf = (q: string, from: string, to: string) => compile(between(q, from, to), ['x']);
  for (const seed of SEEDS) {
    const d = makeDrill('derivalt', seed);
    const f = fOf(d.kerdes, 'f(x) = ', '. Mennyi');
    const fd = compile(d.helyes[0], ['x']);
    for (const x of [-1.5, 0.3, 2.2]) {
      const h = 1e-5;
      const num = (f.eval({ x: x + h }).re - f.eval({ x: x - h }).re) / (2 * h);
      assert.ok(Math.abs(num - fd.eval({ x }).re) < 1e-4, d.kerdes);
    }

    const e = makeDrill('erinto', seed);
    const g = fOf(e.kerdes, 'f(x) = ', '. Add meg');
    const x0 = nums(between(e.kerdes, 'x₀ = ', ' pontbeli'))[0];
    const line = compile(e.helyes[0], ['x']);
    assert.ok(Math.abs(line.eval({ x: x0 }).re - g.eval({ x: x0 }).re) < 1e-9);
    const h = 1e-5;
    const slope = (g.eval({ x: x0 + h }).re - g.eval({ x: x0 - h }).re) / (2 * h);
    assert.ok(Math.abs(line.eval({ x: x0 + 1 }).re - line.eval({ x: x0 }).re - slope) < 1e-4, e.kerdes);

    const l = makeDrill('egyenes', seed);
    const [ax, ay, bx, by] = nums(l.kerdes);
    const ln = compile(l.helyes[0], ['x']);
    assert.ok(Math.abs(ln.eval({ x: ax }).re - ay) < 1e-9 && Math.abs(ln.eval({ x: bx }).re - by) < 1e-9, l.kerdes);

    const c = makeDrill('csucs', seed);
    const cf = fOf(c.kerdes, 'f(x) = ', ' függvénynek');
    const [u, v] = c.helyes.map(val);
    assert.ok(Math.abs(cf.eval({ x: u }).re - v) < 1e-9);
    assert.ok(Math.abs(cf.eval({ x: u + 1e-3 }).re - cf.eval({ x: u - 1e-3 }).re) < 1e-6, c.kerdes);
  }
});
