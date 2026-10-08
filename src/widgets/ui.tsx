// Small building blocks shared by the interactive widgets (not usable from MDX directly).
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Plane, type DragPoint, type PlaneOptions } from '@/lib/plane';

import { useScheme } from './theme';

export function Bench({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="bench">
      <div className="bench-h">
        <span className="tag">Interaktív</span>
        <h4>{title}</h4>
        {hint ? <p>{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Chip({ kind, children }: { kind: 'ok' | 'no' | 'mid'; children: ReactNode }) {
  return <span className={`chip ${kind}`}>{children}</span>;
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
  sym,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  sym?: boolean;
}) {
  return (
    <div className="row" role="group">
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          className={`btn${sym ? ' sym' : ''}${k === value ? ' on' : ''}`}
          aria-pressed={k === value}
          onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Integer/decimal input that lets you type "-" or "" without fighting React. */
export function NumField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  width,
}: {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  width?: string;
}) {
  const [text, setText] = useState(String(value));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(String(value));
    }
  }, [value]);
  return (
    <label className="f">
      {label}
      <input
        type="number"
        value={text}
        step={step}
        min={min}
        max={max}
        style={width ? { width } : undefined}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value.trim() !== '' && Number.isFinite(v)) {
            last.current = v;
            onChange(v);
          }
        }}
      />
    </label>
  );
}

export function Kv({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Canvas coordinate plane. `draw` and `points` may change every render. */
export function PlaneCanvas({
  options,
  points,
  draw,
  label,
}: {
  options: PlaneOptions;
  points?: DragPoint[];
  draw: (p: Plane) => void;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const plane = useRef<Plane | null>(null);
  const scheme = useScheme();
  useEffect(() => {
    if (!ref.current) return;
    const p = new Plane(ref.current, options);
    plane.current = p;
    return () => p.destroy();
    // The plane is created once; options are fixed per widget instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const p = plane.current;
    if (!p) return;
    p.points = points ?? [];
    p.draw = draw;
    p.render();
  });
  // Repaint with the new palette when the theme flips.
  useEffect(() => {
    requestAnimationFrame(() => plane.current?.render());
  }, [scheme]);
  return <canvas ref={ref} className="plane" role="img" aria-label={label} />;
}

/** Insert text at the caret of an input, then focus it. */
export function insertAtCaret(el: HTMLInputElement | null, text: string, set: (v: string) => void) {
  if (!el) return;
  const s = el.selectionStart ?? el.value.length;
  const e = el.selectionEnd ?? s;
  const v = el.value.slice(0, s) + text + el.value.slice(e);
  set(v);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(s + text.length, s + text.length);
  });
}
