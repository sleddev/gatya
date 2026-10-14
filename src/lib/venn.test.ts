/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseSet, shade, VennError } from './venn.ts';

const keys = (s: Set<string>) => [...s].sort();

test('two-set operations', () => {
  // keys: A then B membership
  assert.deepEqual(keys(shade('A ∪ B', 2)), ['01', '10', '11']);
  assert.deepEqual(keys(shade('A ∩ B', 2)), ['11']);
  assert.deepEqual(keys(shade('A \\ B', 2)), ['10']);
  assert.deepEqual(keys(shade('A △ B', 2)), ['01', '10']);
  assert.deepEqual(keys(shade("A'", 2)), ['00', '01']);
});

test('De Morgan holds on the diagram', () => {
  assert.deepEqual(keys(shade("(A ∪ B)'", 2)), keys(shade("A' ∩ B'", 2)));
  assert.deepEqual(keys(shade("(A ∩ B)'", 2)), keys(shade("A' ∪ B'", 2)));
});

test('three sets and precedence', () => {
  assert.deepEqual(keys(shade('(A ∪ B) \\ C', 3)), ['010', '100', '110']);
  // ∩ binds tighter than ∪
  assert.deepEqual(keys(shade('A ∪ B ∩ C', 3)), keys(shade('A ∪ (B ∩ C)', 3)));
  assert.equal(shade('A ∩ B ∩ C', 3).size, 1);
});

test('errors', () => {
  assert.throws(() => parseSet('(A ∪ B'), VennError);
  assert.throws(() => parseSet('A ∪ D'), VennError);
});
