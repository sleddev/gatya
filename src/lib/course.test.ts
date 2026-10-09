/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  binCount,
  foDifference,
  groupingParens,
  isNormalForm,
  isPrenex,
  minimal,
  minimalParens,
  obviouslyValid,
  propDifference,
  shape,
} from './course.ts';
import { parse } from './logic.ts';

const P = (s: string) => parse(s).ast;
const F = (s: string) => parse(s, true).ast;

test('∧/∨ grouping does not change the shape, ⊃ grouping does', () => {
  assert.equal(shape(P('(p ∨ q) ∨ r')), shape(P('p ∨ (q ∨ r)')));
  assert.notEqual(shape(P('(p ⊃ q) ⊃ r')), shape(P('p ⊃ q ⊃ r')));
});

test('fewest brackets (feladatsor 1.I.5)', () => {
  assert.equal(minimal(P('((X ∨ Y) ⊃ Z)')), 'X ∨ Y ⊃ Z');
  assert.equal(minimal(P('(¬(X ∨ Y) ⊃ Z)')), '¬(X ∨ Y) ⊃ Z');
  assert.equal(minimal(P('(((X ⊃ Y) ∧ (Y ⊃ Z)) ⊃ (¬X ∨ Z))')), '(X ⊃ Y) ∧ (Y ⊃ Z) ⊃ ¬X ∨ Z');
  assert.equal(minimal(P('¬(((X ⊃ Y) ⊃ (Y ∨ Z)) ⊃ (¬X ∨ Z))')), '¬(((X ⊃ Y) ⊃ Y ∨ Z) ⊃ ¬X ∨ Z)');
  assert.equal(minimal(F('¬(∀x P(x) ⊃ (∃x Q(x, y) ∧ R(x, x)))')), '¬(∀x P(x) ⊃ ∃x Q(x, y) ∧ R(x, x))');
  assert.equal(minimalParens(P('((X ⊃ Y) ≡ (¬X ∨ Y))')), 0);
});

test('bracket counting ignores argument brackets', () => {
  assert.equal(groupingParens('¬(P(x) ∧ Q(f(x), y))'), 1);
  assert.equal(binCount(P('((p ∧ q) ⊃ r)')), 2);
});

test('normal forms', () => {
  assert.ok(isNormalForm(P('(¬p ∨ q) ∧ (¬p ∨ r)'), 'knf'));
  assert.ok(!isNormalForm(P('¬p ∨ q ∧ r'), 'knf'));
  assert.ok(isNormalForm(P('¬p ∨ q ∧ r'), 'dnf'));
  assert.ok(isNormalForm(P('p'), 'dnf'));
  assert.ok(!isNormalForm(P('¬¬p'), 'dnf'));
  assert.ok(isPrenex(F('∀x ∃y (P(x) ⊃ Q(y))')));
  assert.ok(!isPrenex(F('∀x P(x) ⊃ ∃y Q(y)')));
  assert.ok(obviouslyValid(P('¬X ∨ Y ∨ X')));
});

test('propositional equivalence', () => {
  assert.equal(propDifference(P('p ⊃ q'), P('¬q ⊃ ¬p')), null);
  assert.notEqual(propDifference(P('p ⊃ q'), P('q ⊃ p')), null);
});

test('first-order formalizations are compared semantically', () => {
  // 2.P.8 (g): two correct answers, one wrong
  assert.equal(foDifference(F('¬∃x (E(x) ∧ ¬S(x))'), F('∀y (E(y) ⊃ S(y))')), null);
  assert.notEqual(foDifference(F('¬∃x (E(x) ∧ ¬S(x))'), F('∀x (E(x) ∧ S(x))')), null);
  // 2.P.6: quantifier order matters
  assert.notEqual(foDifference(F('∀x ∃y sz(x, y)'), F('∃y ∀x sz(x, y)')), null);
  assert.equal(foDifference(F('¬∃x ∀y sz(x, y)'), F('∀x ∃y ¬sz(x, y)')), null);
  // constants and functions
  assert.equal(foDifference(F('∀x (P(x, c) ⊃ ∃y Q(f(y), x))'), F('∀x (¬P(x, c) ∨ ∃y Q(f(y), x))')), null);
});

test('normal form steps end in the right form and stay equivalent', async () => {
  const { normalFormSteps } = await import('./course.ts');
  for (const src of ['p ⊃ q ∧ r', '¬(X ⊃ Y) ∨ (X ≡ Z)', '¬X ⊃ Y ∧ ¬Z']) {
    for (const kind of ['knf', 'dnf'] as const) {
      const f = P(src);
      const steps = normalFormSteps(f, kind);
      const last = steps[steps.length - 1].f;
      assert.ok(isNormalForm(last, kind), `${src} ${kind}`);
      assert.equal(propDifference(f, last), null);
    }
  }
});
