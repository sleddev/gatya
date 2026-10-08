/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diophantine, divRem, divisorCount, euclid, eulerPhi, factor, frac, linearCongruence, modPow, powerCycle } from './numbers.ts';

test('Euclid: lecture example (1227, 216) = 3', () => {
  const e = euclid(1227, 216);
  assert.equal(e.g, 3);
  assert.equal(e.steps.length, 6);
  assert.equal(1227 * e.s + 216 * e.t, 3);
});

test('Diophantine equations from the slides', () => {
  const d1 = diophantine(147, 69, 3);
  assert.ok(d1.solvable);
  if (d1.solvable) assert.equal(147 * d1.x + 69 * d1.y, 3);
  const d2 = diophantine(140, 322, 98);
  assert.ok(d2.solvable && d2.g === 14);
  if (d2.solvable) assert.equal(140 * d2.x + 322 * d2.y, 98);
  assert.equal(diophantine(12, -15, 26).solvable, false);
  const d3 = diophantine(35, 40, 1420);
  assert.ok(d3.solvable);
  if (d3.solvable) assert.equal(35 * d3.x + 40 * d3.y, 1420);
});

test('factorization, d(n), φ', () => {
  const f = factor(1455300);
  assert.deepEqual(f, [
    [2, 2],
    [3, 3],
    [5, 2],
    [7, 2],
    [11, 1],
  ]);
  assert.equal(divisorCount(f), 216);
  assert.equal(eulerPhi(factor(24)), 8);
  assert.equal(divisorCount(factor(185130)), 72);
});

test('Euler–Fermat example: 2^2026 mod 15 = 4', () => {
  assert.equal(modPow(2n, 2026n, 15n), 4n);
});

test('linear congruence 12x ≡ 8 (mod 16)', () => {
  const r = linearCongruence(12, 8, 16);
  assert.ok(r.solvable);
  if (r.solvable) {
    assert.equal(r.d, 4);
    assert.equal(r.x0, 2);
    assert.deepEqual(r.all, [2, 6, 10, 14]);
  }
  assert.equal(linearCongruence(9, 15, 12).solvable, true);
  assert.equal(linearCongruence(30, 48, 58).solvable, true);
  assert.equal(linearCongruence(6, 5, 9).solvable, false);
});

test('fractions', () => {
  assert.equal(frac(7 / 3), '7/3');
  assert.equal(frac(-0.5), '−1/2');
  assert.equal(frac(4), '4');
});

test('division with remainder keeps 0 ≤ r < |b|', () => {
  assert.deepEqual(divRem(17, 5), { q: 3, r: 2 });
  assert.deepEqual(divRem(-17, 5), { q: -4, r: 3 });
  assert.deepEqual(divRem(17, -5), { q: -3, r: 2 });
});

test('power cycles mod m', () => {
  assert.deepEqual(powerCycle(7, 10), { seq: [7, 9, 3, 1], start: 0 });
  assert.deepEqual(powerCycle(2, 12), { seq: [2, 4, 8], start: 1 });
  assert.equal(powerCycle(2, 15).seq.length, 4);
});
