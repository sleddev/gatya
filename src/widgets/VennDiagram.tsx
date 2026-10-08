import { useEffect, useRef, useState } from 'react';

import { useScheme } from './theme';
import { Bench } from './ui';

type Op = { label: string; f: (a: boolean, b: boolean) => boolean; say: string };

const OPS: Record<string, Op> = {
  unio: { label: 'A ∪ B', f: (a, b) => a || b, say: 'legalább az egyikben benne van' },
  metszet: { label: 'A ∩ B', f: (a, b) => a && b, say: 'mindkettőben benne van' },
  'a-b': { label: 'A \\ B', f: (a, b) => a && !b, say: 'A-ban benne van, B-ben nincs' },
  'b-a': { label: 'B \\ A', f: (a, b) => b && !a, say: 'B-ben benne van, A-ban nincs' },
  szimdiff: { label: 'A △ B', f: (a, b) => a !== b, say: 'pontosan az egyikben van benne' },
  'a-komp': { label: 'Ā', f: (a) => !a, say: 'nincs benne A-ban' },
  'demorgan-1': { label: '‾(A ∪ B) = Ā ∩ B̄', f: (a, b) => !(a || b), say: 'egyikben sincs benne' },
  'demorgan-2': { label: '‾(A ∩ B) = Ā ∪ B̄', f: (a, b) => !(a && b), say: 'nincs benne mindkettőben' },
};

function hex(c: string): [number, number, number] {
  let s = c.replace('#', '').trim();
  if (s.length === 3) s = s.split('').map((x) => x + x).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Venn diagram of two sets in a universe H; pick an operation to shade it. */
export function VennDiagram({ muvelet = 'szimdiff', muveletek }: { muvelet?: string; muveletek?: string[] }) {
  const keys = (muveletek ?? Object.keys(OPS)).filter((k) => OPS[k]);
  const [op, setOp] = useState(OPS[muvelet] ? muvelet : keys[0]);
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const scheme = useScheme();

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => setWidth(cv.getBoundingClientRect().width));
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !width) return;
    const H = Math.round(width * 0.58);
    cv.style.height = `${H}px`;
    const D = window.devicePixelRatio || 1;
    cv.width = Math.round(width * D);
    cv.height = Math.round(H * D);
    const c = cv.getContext('2d');
    if (!c) return;
    const cs = getComputedStyle(cv);
    const acc = hex(cs.getPropertyValue('--acc'));
    const bg = hex(cs.getPropertyValue('--bg'));
    const ink = cs.getPropertyValue('--ink').trim();
    const w = cv.width,
      h = cv.height;
    const ax = w * 0.38,
      bx = w * 0.62,
      cy = h * 0.5,
      r = Math.min(w * 0.22, h * 0.36),
      pad = 10 * D;
    const f = OPS[op].f;
    const img = c.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const inU = x > pad && x < w - pad && y > pad && y < h - pad;
        const a = (x - ax) ** 2 + (y - cy) ** 2 < r * r;
        const b = (x - bx) ** 2 + (y - cy) ** 2 < r * r;
        const on = inU && f(a, b);
        const al = on ? 0.42 : 0;
        img.data[i] = Math.round(bg[0] * (1 - al) + acc[0] * al);
        img.data[i + 1] = Math.round(bg[1] * (1 - al) + acc[1] * al);
        img.data[i + 2] = Math.round(bg[2] * (1 - al) + acc[2] * al);
        img.data[i + 3] = 255;
      }
    c.putImageData(img, 0, 0);
    c.setTransform(D, 0, 0, D, 0, 0);
    const s = 1 / D;
    c.strokeStyle = ink;
    c.lineWidth = 1.6;
    c.strokeRect(pad * s, pad * s, (w - 2 * pad) * s, (h - 2 * pad) * s);
    c.beginPath();
    c.arc(ax * s, cy * s, r * s, 0, 7);
    c.stroke();
    c.beginPath();
    c.arc(bx * s, cy * s, r * s, 0, 7);
    c.stroke();
    c.fillStyle = ink;
    c.font = 'italic 600 18px Georgia, serif';
    c.fillText('A', (ax - r * 0.95) * s, (cy - r * 0.82) * s);
    c.fillText('B', (bx + r * 0.78) * s, (cy - r * 0.82) * s);
    c.fillText('H', (pad + 8 * D) * s, (pad + 22 * D) * s);
  }, [op, width, scheme]);

  return (
    <Bench title="Venn-diagram" hint="Válassz egy műveletet: a kiszínezett rész az eredmény. H az alaphalmaz.">
      <canvas ref={ref} className="plane" role="img" aria-label={`Venn-diagram: ${OPS[op].label}`} />
      <div className="row">
        {keys.map((k) => (
          <button key={k} type="button" className={`btn sym${k === op ? ' on' : ''}`} onClick={() => setOp(k)}>
            {OPS[k].label}
          </button>
        ))}
      </div>
      <p className="note">
        <b>{OPS[op].label}</b>: azok az elemek, amelyek {OPS[op].say}.
      </p>
    </Bench>
  );
}
