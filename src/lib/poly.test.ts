/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { extrema, fitPolynomial, polyString, roots } from './poly.ts';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

test('roots of x⁴ − 5x² + 4 are ±1, ±2', () => {
  const r = roots([1, 0, -5, 0, 4]);
  assert.equal(r.length, 4);
  [-2, -1, 1, 2].forEach((x, i) => assert.ok(near(r[i], x)));
});

test('double root of (x − 1)² is found', () => {
  const r = roots([1, -2, 1]);
  assert.equal(r.length, 1);
  assert.ok(near(r[0], 1));
});

test('extrema of x³ − 3x + 1', () => {
  const e = extrema([1, 0, -3, 1]);
  assert.equal(e.length, 2);
  assert.ok(near(e[0].x, -1) && e[0].kind === 'max');
  assert.ok(near(e[1].x, 1) && e[1].kind === 'min');
});

test('handout fit: A(2,3), B(8,5) gives x/3 + 7/3', () => {
  const c = fitPolynomial([
    [2, 3],
    [8, 5],
  ])!;
  assert.equal(polyString(c), '1/3x + 7/3');
});
