// Graph transformations a·f(b·(x − c)) + d, described in words. Pure functions, no DOM.

export interface TransformStep {
  /** which parameter this step comes from */
  key: 'b' | 'c' | 'a' | 'd';
  text: string;
}

const num = (x: number) => String(+x.toFixed(2)).replace('-', '−').replace('.', ',');

/**
 * The graph of a·f(b·(x − c)) + d is obtained from the graph of f by these steps, in this order.
 * Identity parameters (a = 1, b = 1, c = 0, d = 0) give no step.
 */
export function transformSteps(a: number, b: number, c: number, d: number): TransformStep[] {
  // Numbers are written in formulas (x ↦ x / 2) rather than with Hungarian suffixes, which depend on the number.
  const out: TransformStep[] = [];
  if (b < 0) out.push({ key: 'b', text: 'tükrözés az y-tengelyre (x ↦ −x)' });
  const B = Math.abs(b);
  if (B > 1) out.push({ key: 'b', text: `vízszintes összenyomás (x ↦ x / ${num(B)})` });
  else if (B > 0 && B < 1) out.push({ key: 'b', text: `vízszintes nyújtás (x ↦ ${num(1 / B)}·x)` });
  if (c !== 0) out.push({ key: 'c', text: `eltolás ${c > 0 ? 'jobbra' : 'balra'} ${num(Math.abs(c))} egységgel` });
  if (a < 0) out.push({ key: 'a', text: 'tükrözés az x-tengelyre (y ↦ −y)' });
  const A = Math.abs(a);
  if (A > 1) out.push({ key: 'a', text: `függőleges nyújtás (y ↦ ${num(A)}·y)` });
  else if (A > 0 && A < 1) out.push({ key: 'a', text: `függőleges összenyomás (y ↦ ${num(A)}·y)` });
  if (a === 0) out.push({ key: 'a', text: 'a = 0: minden érték 0 lesz, a grafikon az x-tengelyre lapul' });
  if (d !== 0) out.push({ key: 'd', text: `eltolás ${d > 0 ? 'felfelé' : 'lefelé'} ${num(Math.abs(d))} egységgel` });
  return out;
}

/** Where the point (x, y) of the graph of f lands on the graph of a·f(b·(x − c)) + d. */
export const transformPoint = (x: number, y: number, a: number, b: number, c: number, d: number): [number, number] => [x / b + c, a * y + d];
