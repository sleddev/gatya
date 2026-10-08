import { useState } from 'react';

import { complexText } from '@/lib/complex';
import { fmt, par } from '@/lib/numbers';

import { Bench, Kv, NumField } from './ui';

/** Calculator for z ± w, z·w, z/w with every intermediate step shown. */
export function KomplexMuveletek({ z = [2, -3], w = [-1, 4] }: { z?: [number, number]; w?: [number, number] }) {
  const [a, setA] = useState(z[0]);
  const [b, setB] = useState(z[1]);
  const [c, setC] = useState(w[0]);
  const [d, setD] = useState(w[1]);
  const den = c * c + d * d;
  const num = [a * c + b * d, b * c - a * d];
  return (
    <Bench title="Műveletek algebrai alakban" hint="Add meg z = a + bi és w = c + di valós és képzetes részét.">
      <div className="row">
        <NumField label="a (Re z)" value={a} onChange={setA} step={0.5} width="5.5em" />
        <NumField label="b (Im z)" value={b} onChange={setB} step={0.5} width="5.5em" />
        <NumField label="c (Re w)" value={c} onChange={setC} step={0.5} width="5.5em" />
        <NumField label="d (Im w)" value={d} onChange={setD} step={0.5} width="5.5em" />
      </div>
      <p className="line">
        z = {complexText(a, b)}, &nbsp; w = {complexText(c, d)}
      </p>
      <Kv
        rows={[
          ['z + w', `(${fmt(a)} + ${par(c)}) + (${fmt(b)} + ${par(d)})i = ${complexText(a + c, b + d)}`],
          ['z − w', `(${fmt(a)} − ${par(c)}) + (${fmt(b)} − ${par(d)})i = ${complexText(a - c, b - d)}`],
          ['z · w', `(${fmt(a)}·${par(c)} − ${par(b)}·${par(d)}) + (${fmt(a)}·${par(d)} + ${par(b)}·${par(c)})i = ${complexText(a * c - b * d, a * d + b * c)}`],
          ['z̄, w̄', `${complexText(a, -b)},  ${complexText(c, -d)}`],
          ['|z|², |w|²', `z·z̄ = ${fmt(a * a + b * b)},  w·w̄ = ${fmt(den)}`],
          [
            'z / w',
            den === 0
              ? 'nullával nem lehet osztani'
              : `z·w̄ / (w·w̄) = (${complexText(num[0], num[1])}) / ${fmt(den)} = ${complexText(num[0] / den, num[1] / den)}`,
          ],
        ]}
      />
      <p className="note">Osztásnál a számlálót és a nevezőt is a nevező konjugáltjával szorozzuk, így a nevező valós lesz: w·w̄ = |w|².</p>
    </Bench>
  );
}
