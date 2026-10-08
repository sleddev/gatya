/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classifyMapping, toggleArrow } from './mapping.ts';
import { transformPoint, transformSteps } from './transform.ts';

test('mapping: not a function when an element has no image or two images', () => {
  const r = classifyMapping([[0, 1], [2], []], 3);
  assert.equal(r.fn, false);
  if (!r.fn) {
    assert.deepEqual(r.multi, [0]);
    assert.deepEqual(r.missing, [2]);
  }
});

test('mapping: injective, surjective, bijective', () => {
  const inj = classifyMapping([[1], [0], [3]], 4);
  assert.ok(inj.fn && inj.injective && !inj.surjective);
  if (inj.fn) assert.deepEqual(inj.unhit, [2]);
  const sur = classifyMapping([[0], [1], [1], [2]], 3);
  assert.ok(sur.fn && !sur.injective && sur.surjective && sur.collision === 1);
  const bij = classifyMapping([[2], [0], [3], [1]], 4);
  assert.ok(bij.fn && bij.injective && bij.surjective);
});

test('mapping: toggling arrows', () => {
  assert.deepEqual(toggleArrow([[0], []], 1, 2), [[0], [2]]);
  assert.deepEqual(toggleArrow([[0, 2], []], 0, 0), [[2], []]);
});

test('transformations: f(2x − 4) = f(2(x − 2)) is a squeeze, then a shift by 2', () => {
  const s = transformSteps(1, 2, 2, 0);
  assert.deepEqual(
    s.map((x) => x.key),
    ['b', 'c']
  );
  assert.match(s[1].text, /jobbra 2/);
  assert.deepEqual(transformPoint(4, 16, 1, 2, 2, 0), [4, 16]);
});

test('transformations: 3f(−x) − 4 in lecture order', () => {
  const s = transformSteps(3, -1, 0, -4);
  assert.deepEqual(
    s.map((x) => x.text.split(' ')[0]),
    ['tükrözés', 'függőleges', 'eltolás']
  );
  assert.deepEqual(transformSteps(1, 1, 0, 0), []);
  assert.deepEqual(transformPoint(1, 1, 3, -1, 0, -4), [-1, -1]);
});
