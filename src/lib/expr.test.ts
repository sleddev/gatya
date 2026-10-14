/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareSets, evalExpr, ExprError, sameValue, splitItems } from './expr.ts';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test('plain numbers, fractions, decimal commas', () => {
  near(evalExpr('7/3').re, 7 / 3);
  near(evalExpr('0,8').re, 0.8);
  near(evalExpr('−3/5').re, -0.6);
  near(evalExpr('2·3 + 4').re, 10);
  near(evalExpr('2^10').re, 1024);
  near(evalExpr('2¹⁰').re, 1024);
  near(evalExpr('5!').re, 120);
});

test('roots, π, implicit multiplication', () => {
  near(evalExpr('√29').re, Math.sqrt(29));
  near(evalExpr('2√2').re, 2 * Math.SQRT2);
  near(evalExpr('sqrt(2)/2').re, Math.SQRT1_2);
  near(evalExpr('3pi/4').re, (3 * Math.PI) / 4);
  near(evalExpr('7π/6').re, (7 * Math.PI) / 6);
  near(evalExpr('2(3+1)').re, 8);
  near(evalExpr('|−5|').re, 5);
});

test('complex arithmetic keeps i² = −1 exact', () => {
  const z = evalExpr('(2 − 3i)(−1 + 4i)');
  assert.deepEqual([z.re, z.im], [10, 11]);
  const w = evalExpr('(1 − i)/(2 + i)');
  near(w.re, 0.2);
  near(w.im, -0.6);
  const p = evalExpr('i^2017');
  assert.deepEqual([p.re, p.im], [0, 1]);
  near(evalExpr('|3 + 4i|').re, 5);
  const r = evalExpr('sqrt(-4)');
  assert.deepEqual([r.re, r.im], [0, 2]);
});

test('answers as functions of a variable', () => {
  assert.ok(sameValue('y = 9x − 15', '9x-15', { vars: ['x'] }));
  assert.ok(sameValue('f(x) = 1/3 x + 7/3', '(x+7)/3', { vars: ['x'] }));
  assert.ok(sameValue('3x² − 3', '3x^2-3', { vars: ['x'] }));
  assert.ok(sameValue('(k+1)(k+2)/2', 'k^2/2 + 3k/2 + 1', { vars: ['k'] }));
  assert.ok(!sameValue('9x + 15', '9x-15', { vars: ['x'] }));
  assert.ok(sameValue('2x^2-3x+1', '(2x-1)(x-1)', { vars: ['x'] }));
});

test('numeric comparison, tolerance, modulo', () => {
  assert.ok(sameValue('1/3', '0.3333333333'));
  assert.ok(sameValue('31,33', '31.33'));
  assert.ok(sameValue('31.3', '31.33', { tol: 0.002 }));
  assert.ok(!sameValue('31', '31.33', { tol: 0.002 }));
  assert.ok(sameValue('11', '4', { modulo: 7 }));
  assert.ok(sameValue('-3', '4', { modulo: 7 }));
  assert.ok(!sameValue('5', '4', { modulo: 7 }));
});

test('sets: order and repetition do not matter', () => {
  assert.deepEqual(splitItems('{2, 6, 10, 14}'), ['2', '6', '10', '14']);
  assert.deepEqual(splitItems('(4,1), (4,2)'), ['(4,1)', '(4,2)']);
  assert.deepEqual(splitItems('∅'), []);
  assert.ok(compareSets('14, 2, 10, 6, 6', '2, 6, 10, 14').ok);
  assert.ok(compareSets('{a, c}', 'c, a').ok);
  assert.ok(compareSets('nincs', '').ok);
  const d = compareSets('2, 6, 9', '2, 6, 10, 14');
  assert.deepEqual(d.extra, ['9']);
  assert.equal(d.missing, 2);
  assert.ok(compareSets('(4, 1); (5,1)', '(5,1), (4,1)').ok);
});

test('errors are reported in Hungarian, not thrown as crashes', () => {
  assert.throws(() => evalExpr('2 + '), ExprError);
  assert.throws(() => evalExpr('(2 + 3'), ExprError);
  assert.throws(() => evalExpr('2 # 3'), ExprError);
  assert.throws(() => evalExpr('q + 1'), ExprError);
  assert.throws(() => evalExpr('1/0'), ExprError);
});
