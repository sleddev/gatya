// A small 2D coordinate-plane renderer on <canvas> with draggable points.
// DOM-only: used by the widgets inside the content webview / web page.
import { fmt } from './numbers.ts';

export interface PlaneOptions {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  /** keep 1 unit the same length on both axes */
  equal?: boolean;
  /** height / width */
  aspect?: number;
  /** snap dragged points to this grid (0 = off) */
  snap?: number;
}

export interface DragPoint {
  get: () => [number, number];
  set: (x: number, y: number) => void;
  active?: () => boolean;
  snap?: number;
}

export interface PlaneColors {
  grid: string;
  axis: string;
  muted: string;
  ink: string;
  surface: string;
  acc: string;
  q1: string;
  q3: string;
  q4: string;
  good: string;
  bad: string;
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

export class Plane {
  o: Required<PlaneOptions>;
  points: DragPoint[] = [];
  draw: (p: Plane) => void = () => {};
  onDrag?: () => void;
  w = 0;
  h = 0;
  private d = 1;
  private sx = 1;
  private sy = 1;
  y0 = 0;
  y1 = 0;
  c!: CanvasRenderingContext2D;
  col!: PlaneColors;
  private dragging: DragPoint | null = null;
  private ro: ResizeObserver;
  private lastW = 0;

  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, opts: PlaneOptions) {
    this.canvas = canvas;
    this.o = { equal: true, aspect: 0.68, snap: 0, ...opts };
    this.ro = new ResizeObserver(() => {
      const w = canvas.getBoundingClientRect().width;
      if (w && Math.abs(w - this.lastW) > 0.5) {
        this.lastW = w;
        this.resize();
      }
    });
    this.ro.observe(canvas);
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
  }

  destroy() {
    this.ro.disconnect();
    this.canvas.removeEventListener('pointerdown', this.down);
    this.canvas.removeEventListener('pointermove', this.move);
    this.canvas.removeEventListener('pointerup', this.up);
    this.canvas.removeEventListener('pointercancel', this.up);
  }

  private down = (e: PointerEvent) => {
    const hit = this.hit(this.event(e));
    if (hit) {
      this.dragging = hit;
      this.canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  };
  private move = (e: PointerEvent) => {
    const p = this.event(e);
    if (!this.dragging) {
      this.canvas.style.cursor = this.hit(p) ? 'grab' : 'default';
      return;
    }
    let { x, y } = p;
    const s = this.dragging.snap ?? this.o.snap;
    if (s) {
      x = Math.round(x / s) * s;
      y = Math.round(y / s) * s;
    }
    x = Math.max(this.o.xmin, Math.min(this.o.xmax, x));
    y = Math.max(this.y0, Math.min(this.y1, y));
    this.dragging.set(+x.toFixed(6), +y.toFixed(6));
    this.onDrag?.();
  };
  private up = () => {
    this.dragging = null;
  };

  private hit(p: { px: number; py: number }) {
    let best: DragPoint | null = null;
    let bd = 22;
    for (const q of this.points) {
      if (q.active && !q.active()) continue;
      const [x, y] = q.get();
      const d = Math.hypot(this.X(x) - p.px, this.Y(y) - p.py);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    return best;
  }

  private event(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    return { px, py, x: px / this.sx + this.o.xmin, y: (this.h - py) / this.sy + this.y0 };
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    this.w = r.width;
    this.h = Math.round(r.width * this.o.aspect);
    this.canvas.style.height = `${this.h}px`;
    this.d = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.w * this.d);
    this.canvas.height = Math.round(this.h * this.d);
    const o = this.o;
    this.sx = this.w / (o.xmax - o.xmin);
    if (o.equal) {
      this.sy = this.sx;
      const cy = (o.ymin + o.ymax) / 2;
      const half = this.h / this.sy / 2;
      this.y0 = cy - half;
      this.y1 = cy + half;
    } else {
      this.sy = this.h / (o.ymax - o.ymin);
      this.y0 = o.ymin;
      this.y1 = o.ymax;
    }
    this.render();
  }

  X = (x: number) => (x - this.o.xmin) * this.sx;
  Y = (y: number) => this.h - (y - this.y0) * this.sy;
  get unit() {
    return this.sx;
  }

  render() {
    if (!this.w) return;
    const c = this.canvas.getContext('2d');
    if (!c) return;
    c.setTransform(this.d, 0, 0, this.d, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    this.c = c;
    const cs = getComputedStyle(this.canvas);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    this.col = {
      grid: v('--grid'),
      axis: v('--axis'),
      muted: v('--muted'),
      ink: v('--ink'),
      surface: v('--surface'),
      acc: v('--acc'),
      q1: v('--q1'),
      q3: v('--q3'),
      q4: v('--q4'),
      good: v('--good'),
      bad: v('--bad'),
    };
    this.grid();
    this.draw(this);
  }

  private grid() {
    const { c, o } = this;
    const st = niceStep(46 / this.sx);
    const sty = niceStep(46 / this.sy);
    c.lineWidth = 1;
    c.strokeStyle = this.col.grid;
    c.beginPath();
    for (let i = Math.ceil(o.xmin / st); i * st <= o.xmax + 1e-9; i++) {
      const X = Math.round(this.X(i * st)) + 0.5;
      c.moveTo(X, 0);
      c.lineTo(X, this.h);
    }
    for (let i = Math.ceil(this.y0 / sty); i * sty <= this.y1 + 1e-9; i++) {
      const Y = Math.round(this.Y(i * sty)) + 0.5;
      c.moveTo(0, Y);
      c.lineTo(this.w, Y);
    }
    c.stroke();
    c.strokeStyle = this.col.axis;
    c.beginPath();
    const ax = this.Y(0);
    const ay = this.X(0);
    if (ax >= 0 && ax <= this.h) {
      c.moveTo(0, ax);
      c.lineTo(this.w, ax);
    }
    if (ay >= 0 && ay <= this.w) {
      c.moveTo(ay, 0);
      c.lineTo(ay, this.h);
    }
    c.stroke();
    c.fillStyle = this.col.muted;
    c.font = '11px ui-monospace, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'top';
    const ly = Math.min(Math.max(ax + 3, 2), this.h - 14);
    for (let i = Math.ceil(o.xmin / st); i * st <= o.xmax + 1e-9; i++) {
      const val = +(i * st).toFixed(6);
      const X = this.X(val);
      if (val === 0 || X < 10 || X > this.w - 10) continue;
      c.fillText(fmt(val), X, ly);
    }
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    const lx = Math.min(Math.max(ay - 4, 24), this.w - 2);
    for (let i = Math.ceil(this.y0 / sty); i * sty <= this.y1 + 1e-9; i++) {
      const val = +(i * sty).toFixed(6);
      const Y = this.Y(val);
      if (val === 0 || Y < 8 || Y > this.h - 8) continue;
      c.fillText(fmt(val), lx, Y);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, width = 2, dash?: number[]) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = width;
    if (dash) c.setLineDash(dash);
    c.beginPath();
    c.moveTo(this.X(x1), this.Y(y1));
    c.lineTo(this.X(x2), this.Y(y2));
    c.stroke();
    c.restore();
  }

  arrow(x1: number, y1: number, x2: number, y2: number, color: string, width = 2.4) {
    const c = this.c;
    const X1 = this.X(x1),
      Y1 = this.Y(y1),
      X2 = this.X(x2),
      Y2 = this.Y(y2);
    const L = Math.hypot(X2 - X1, Y2 - Y1);
    if (L < 1) return;
    const ux = (X2 - X1) / L,
      uy = (Y2 - Y1) / L,
      hl = Math.min(12, L * 0.4);
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(X1, Y1);
    c.lineTo(X2 - ux * hl * 0.8, Y2 - uy * hl * 0.8);
    c.stroke();
    c.beginPath();
    c.moveTo(X2, Y2);
    c.lineTo(X2 - ux * hl - uy * hl * 0.45, Y2 - uy * hl + ux * hl * 0.45);
    c.lineTo(X2 - ux * hl + uy * hl * 0.45, Y2 - uy * hl - ux * hl * 0.45);
    c.closePath();
    c.fill();
    c.restore();
  }

  dot(x: number, y: number, color: string, r = 5, ring = true) {
    const c = this.c;
    c.save();
    c.beginPath();
    c.arc(this.X(x), this.Y(y), r, 0, 7);
    c.fillStyle = color;
    c.fill();
    if (ring) {
      c.lineWidth = 2;
      c.strokeStyle = this.col.surface;
      c.stroke();
    }
    c.restore();
  }

  handle(x: number, y: number, color: string) {
    this.dot(x, y, color, 8);
  }

  text(x: number, y: number, s: string, color?: string, dx = 8, dy = -8, align: CanvasTextAlign = 'left') {
    const c = this.c;
    c.save();
    c.font = '600 13px system-ui, sans-serif';
    c.fillStyle = color ?? this.col.ink;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(s, this.X(x) + dx, this.Y(y) + dy);
    c.restore();
  }

  fn(f: (x: number) => number, color: string, width = 2.4) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    let pen = false;
    for (let px = 0; px <= this.w; px++) {
      const x = px / this.sx + this.o.xmin;
      const y = f(x);
      const Y = this.Y(y);
      if (!Number.isFinite(y) || Y < -2000 || Y > this.h + 2000) {
        pen = false;
        continue;
      }
      if (pen) c.lineTo(px, Y);
      else c.moveTo(px, Y);
      pen = true;
    }
    c.stroke();
    c.restore();
  }

  circle(x: number, y: number, r: number, color: string, dash?: number[]) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    if (dash) c.setLineDash(dash);
    c.beginPath();
    c.arc(this.X(x), this.Y(y), r * this.sx, 0, 7);
    c.stroke();
    c.restore();
  }

  polygon(pts: [number, number][], color: string, width = 1.5, close = true, dash?: number[]) {
    if (!pts.length) return;
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = width;
    if (dash) c.setLineDash(dash);
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(this.X(x), this.Y(y)) : c.moveTo(this.X(x), this.Y(y))));
    if (close) c.closePath();
    c.stroke();
    c.restore();
  }

  /** Arc of radius `rpx` pixels around (x, y) from angle a1 to a2 (math orientation). */
  angleArc(x: number, y: number, a1: number, a2: number, rpx: number, color: string) {
    const c = this.c;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(this.X(x), this.Y(y), rpx, -a1, -a2, true);
    c.stroke();
    c.restore();
  }
}
