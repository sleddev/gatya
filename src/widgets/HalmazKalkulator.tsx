import { useState } from 'react';

import { parseList, showSet } from '@/lib/numbers';

import { Bench, Kv } from './ui';

/** Type three sets (universe H, A, B) and see every operation at once. */
export function HalmazKalkulator({
  H = '0,1,2,3,4,5,6,7,8,9,10',
  A = '0,1,2,3,4',
  B = '2,4,6,8,10',
}: {
  H?: string;
  A?: string;
  B?: string;
}) {
  const [h, setH] = useState(H);
  const [a, setA] = useState(A);
  const [b, setB] = useState(B);
  const U = parseList(h),
    SA = parseList(a),
    SB = parseList(b);
  const inA = (x: string) => SA.includes(x);
  const inB = (x: string) => SB.includes(x);
  const AuB = [...new Set([...SA, ...SB])];
  const outside = [...SA, ...SB].filter((x) => !U.includes(x));
  const rows: [string, string][] = [
    ['A ∪ B', showSet(AuB)],
    ['A ∩ B', showSet(SA.filter(inB))],
    ['A \\ B', showSet(SA.filter((x) => !inB(x)))],
    ['B \\ A', showSet(SB.filter((x) => !inA(x)))],
    ['A △ B', showSet(AuB.filter((x) => inA(x) !== inB(x)))],
    ['Ā (H-ban)', showSet(U.filter((x) => !inA(x)))],
    ['‾(A ∪ B)', showSet(U.filter((x) => !inA(x) && !inB(x)))],
    ['|A|, |P(A)|', `${SA.length}, 2${toSup(SA.length)} = ${2 ** SA.length}`],
    ['|A × B|', `${SA.length} · ${SB.length} = ${SA.length * SB.length}`],
  ];
  if (SA.length <= 4) {
    const subs: string[] = [];
    for (let m = 0; m < 1 << SA.length; m++) subs.push(showSet(SA.filter((_, i) => (m >> i) & 1)));
    rows.push(['P(A)', `{${subs.join(', ')}}`]);
  }
  if (SA.length * SB.length > 0 && SA.length * SB.length <= 12)
    rows.push(['A × B', `{${SA.flatMap((x) => SB.map((y) => `(${x}, ${y})`)).join(', ')}}`]);
  return (
    <Bench title="Halmazkalkulátor" hint="Vesszővel elválasztva add meg az elemeket. A komplementer mindig H-hoz viszonyít.">
      <div className="cols">
        <div className="stack">
          <label className="f">
            Alaphalmaz H
            <input type="text" className="wide" value={h} onChange={(e) => setH(e.target.value)} />
          </label>
          <label className="f">
            A
            <input type="text" className="wide" value={a} onChange={(e) => setA(e.target.value)} />
          </label>
          <label className="f">
            B
            <input type="text" className="wide" value={b} onChange={(e) => setB(e.target.value)} />
          </label>
          {outside.length ? <p className="err">Nincs benne H-ban: {outside.join(', ')}.</p> : null}
        </div>
        <Kv rows={rows} />
      </div>
    </Bench>
  );
}

const toSup = (n: number) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
