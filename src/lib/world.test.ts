/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parse } from './logic.ts';
import { EvalError, evaluateIn, type World } from './world.ts';

const ages = [20, 21, 45, 70];
const w: World = {
  U: ['Péter', 'Bence', 'Anna', 'Mari'],
  names: { Péter: 0, Bence: 1, Anna: 2, Mari: 3 },
  funcs: { barátja: [1, 0, 3, 2] },
  preds: {
    tanul: { arity: 1, holds: ([x]) => x === 0 || x === 1 },
    dolgozik: { arity: 1, holds: ([x]) => x === 2 },
    idősebb: { arity: 2, holds: ([x, y]) => ages[x] > ages[y] },
  },
  props: { havazik: false },
};
const ev = (s: string) => evaluateIn(parse(s, true).ast, w);

test('terms first, then predicates', () => {
  const r = ev('dolgozik(barátja(Anna))');
  assert.equal(r.value, false);
  assert.deepEqual(
    r.steps.map((s) => [s.expr, s.value]),
    [
      ['barátja(Anna)', 'Mari'],
      ['dolgozik(barátja(Anna))', '0'],
    ]
  );
  assert.equal(ev('tanul(Péter) ∧ ¬havazik').value, true);
});

test('quantifiers try every element', () => {
  assert.equal(ev('∀x (tanul(x) ∨ dolgozik(x))').value, false);
  assert.equal(ev('∀x ∃y idősebb(y, x)').value, false);
  const r = ev('∃x dolgozik(x)');
  assert.equal(r.value, true);
  assert.match(r.steps[0].why!, /Anna/);
});

test('open formulas and type errors have no value', () => {
  assert.throws(() => ev('tanul(x)'), EvalError);
  assert.throws(() => ev('barátja(Péter)'), /megnevez/);
  assert.throws(() => ev('fut(Péter)'), /Ismeretlen/);
});
