/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { typeExpression, type Signature } from './terms.ts';

const sig: Signature = {
  nevek: ['Péter', 'én'],
  fuggvenyek: { édesanyja: 1 },
  predikatumok: { özvegy: 1, munkatársak: 2, havazik: 0 },
};

const kind = (s: string) => {
  const r = typeExpression(s, sig);
  return r.ok ? r.kind : 'parse';
};

test('terms and formulas from the lecture', () => {
  assert.equal(kind('édesanyja(édesanyja(Péter))'), 'term');
  assert.equal(kind('özvegy(édesanyja(Péter))'), 'formula');
  assert.equal(kind('munkatársak(édesanyja(Péter), én)'), 'formula');
  assert.equal(kind('¬havazik'), 'formula');
  assert.equal(kind('forall x özvegy(x)'), 'formula');
  assert.equal(kind('x'), 'term');
  assert.equal(kind('Péter'), 'term');
});

test('ill-formed mixtures are rejected with a reason', () => {
  assert.equal(kind('édesanyja(özvegy(Péter))'), 'hiba');
  assert.equal(kind('havazik ∧ Péter'), 'hiba');
  assert.equal(kind('özvegy(Péter, én)'), 'hiba');
  const r = typeExpression('¬édesanyja(Péter)', sig);
  assert.ok(r.ok && r.errors[0].includes('term'));
});
