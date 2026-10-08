/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bracketSteps, segText } from './bracketing.ts';
import { parse, show } from './logic.ts';

const last = (src: string, fo = false) => {
  const { ast } = parse(src, fo);
  const steps = bracketSteps(ast);
  return { steps, text: segText(steps[steps.length - 1].segs), official: show(ast) };
};

test('the last step is the official fully bracketed form', () => {
  for (const src of ['p ∧ q ⊃ r ∨ s', '¬p ∨ q ⊃ r ≡ s', 'p ⊃ q ⊃ r', '(p ⊃ q) ⊃ r', '(p ∨ q) ∧ (r ∨ s)', 'p ∨ q ∧ r ∨ s', '¬(p ∧ q)', 'p']) {
    const r = last(src);
    assert.equal(r.text, r.official, src);
  }
  for (const src of ['∀x (P(x) ∨ Q(x)) ⊃ ∃x R(x) ∨ p', '∀x P(x) ∨ Q(x) ⊃ ∃x R(x) ∨ p', '¬∃x (P(x) ∧ Q(x))']) {
    const r = last(src, true);
    assert.equal(r.text, r.official, src);
  }
});

test('steps follow precedence and highlight new brackets', () => {
  const { steps } = last('¬p ∨ q ⊃ r ≡ s');
  assert.deepEqual(
    steps.map((s) => s.title),
    ['Kiindulás', '¬, ∀, ∃', '∨', '⊃', '≡', 'Fő jel']
  );
  assert.equal(segText(steps[0].segs), '¬p ∨ q ⊃ r ≡ s');
  assert.equal(segText(steps[2].segs), '(¬p ∨ q) ⊃ r ≡ s');
  assert.ok(steps[2].segs.some((g) => g.k === 'new'));
  assert.ok(steps[steps.length - 1].segs.some((g) => g.k === 'main' && g.s === '≡'));
});
