/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyseFirstOrder, classify, consequence, degree, parse, show } from './logic.ts';

const P = (s: string) => parse(s).ast;
const F = (s: string) => parse(s, true).ast;

test('precedence matches lecture 3', () => {
  assert.equal(show(P('p ⊃ q ⊃ r')), '(p ⊃ (q ⊃ r))');
  assert.equal(show(P('p ∨ q ∧ r ∨ s')), '((p ∨ (q ∧ r)) ∨ s)');
  assert.equal(show(P('p -> q = ~p -> ~q')), '((p ⊃ q) ≡ (¬p ⊃ ¬q))');
  assert.equal(show(F('∀x P(x) ∨ Q(x)')), '(∀x P(x) ∨ Q(x))');
});

test('classification', () => {
  assert.equal(classify(P('p | ~p')).kind, 'valid');
  assert.equal(classify(P('p & ~p')).kind, 'unsatisfiable');
  assert.equal(classify(P('p -> q')).kind, 'contingent');
  assert.equal(classify(P('(A & B) -> B')).kind, 'valid');
});

test('consequence', () => {
  assert.equal(consequence([P('p -> q'), P('p')], P('q')).holds, true);
  assert.equal(consequence([P('p -> q'), P('~q')], P('~p')).holds, true);
  assert.equal(consequence([P('p -> q'), P('q')], P('p')).holds, false);
});

test('free and bound variables (lecture example)', () => {
  const a = analyseFirstOrder(F('∀y ¬∃x(P(f(x)) ∨ Q(x,y))'));
  assert.equal(a.closed, true);
  const b = analyseFirstOrder(F('∀y(¬∃x P(f(x)) ∨ Q(x,y))'));
  assert.deepEqual(b.free, ['x']);
  assert.equal(b.clean, false);
  const c = analyseFirstOrder(F('∀x ¬P(f(x),u)'));
  assert.equal(c.closed, true);
});

test('degree', () => {
  assert.equal(degree(P('(¬r ∧ p) ⊃ (p ∨ ¬r)')), 5);
});

test('errors point at the problem', () => {
  assert.throws(() => P('p &'), /túl korán/);
  assert.throws(() => P('(p | q'), /záró/);
  assert.throws(() => P('∀x p'), /elsőrendű/);
});
