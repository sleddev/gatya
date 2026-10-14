// Set expressions over A, B, C for the Venn shading exercise: "(A ∪ B) \ C", "A' ∩ B", "A △ B".
// A region of the diagram is a membership pattern (in A?, in B?, in C?); an expression picks regions.

export type Region = boolean[];

type Node = { t: 'set'; i: number } | { t: 'not'; a: Node } | { t: 'bin'; op: '∪' | '∩' | '\\' | '△'; a: Node; b: Node };

const LETTERS = ['A', 'B', 'C'];

export class VennError extends Error {}

/** Parse; ∩ binds tighter than ∪, \ and △ (which group left to right); postfix ' (or ᶜ) is the complement. */
export function parseSet(src: string): Node {
  const s = src
    .replace(/\s+/g, '')
    .replace(/[∖]/g, '\\')
    .replace(/[ᶜ’′]/g, "'")
    .replace(/Δ/g, '△');
  let p = 0;
  const peek = () => s[p];
  function union(): Node {
    let a = inter();
    while (peek() === '∪' || peek() === '\\' || peek() === '△') {
      const op = s[p++] as '∪' | '\\' | '△';
      a = { t: 'bin', op, a, b: inter() };
    }
    return a;
  }
  function inter(): Node {
    let a = post();
    while (peek() === '∩') {
      p++;
      a = { t: 'bin', op: '∩', a, b: post() };
    }
    return a;
  }
  function post(): Node {
    let a = atom();
    while (peek() === "'") {
      p++;
      a = { t: 'not', a };
    }
    return a;
  }
  function atom(): Node {
    const ch = peek();
    if (ch === '(') {
      p++;
      const a = union();
      if (peek() !== ')') throw new VennError('Hiányzik egy záró zárójel.');
      p++;
      return a;
    }
    const i = LETTERS.indexOf(ch);
    if (i < 0) throw new VennError(`Nem várt jel: „${ch ?? ''}”.`);
    p++;
    return { t: 'set', i };
  }
  const n = union();
  if (p < s.length) throw new VennError(`Nem várt jel: „${s[p]}”.`);
  return n;
}

export function inSet(n: Node, r: Region): boolean {
  switch (n.t) {
    case 'set':
      return !!r[n.i];
    case 'not':
      return !inSet(n.a, r);
    case 'bin': {
      const a = inSet(n.a, r);
      const b = inSet(n.b, r);
      if (n.op === '∪') return a || b;
      if (n.op === '∩') return a && b;
      if (n.op === '\\') return a && !b;
      return a !== b;
    }
  }
}

export function regions(count: number): Region[] {
  return Array.from({ length: 2 ** count }, (_, k) => Array.from({ length: count }, (_, i) => !!(k & (1 << i))));
}

export const regionKey = (r: Region) => r.map((b) => (b ? '1' : '0')).join('');

/** The keys of the regions an expression covers. */
export function shade(src: string, count: number): Set<string> {
  const n = parseSet(src);
  return new Set(regions(count).filter((r) => inSet(n, r)).map(regionKey));
}

/** How many sets an expression mentions (2 or 3). */
export function setCount(src: string): number {
  return /C/.test(src) ? 3 : 2;
}
