// Adding the brackets of a formula one precedence level at a time (¬ ∀ ∃, then ∧, ∨, ⊃, ≡),
// the way the lecture reads p ∧ q ⊃ r as ((p ∧ q) ⊃ r). Pure, no DOM.
import { termString, type BinOp, type Formula } from './logic.ts';

export const RANK: Record<BinOp, number> = { '∧': 1, '∨': 2, '⊃': 3, '≡': 4 };

export type SegKind = 'new' | 'main' | 'scope';
export interface Seg {
  s: string;
  /** a bracket added in this step, the main connective, or (as a flag) inside a ¬/∀/∃ scope */
  k?: SegKind;
  scope?: boolean;
}

export interface BracketStep {
  title: string;
  text: string;
  segs: Seg[];
}

/** Does `child` need brackets under `parent` even without any step (i.e. were they in the input)? */
function required(child: Formula, parent: Formula, side: 'a' | 'b'): boolean {
  if (child.t !== 'bin') return false;
  if (parent.t === 'not' || parent.t === 'q') return true;
  if (parent.t !== 'bin') return false;
  const rc = RANK[child.op];
  const rp = RANK[parent.op];
  if (rc !== rp) return rc > rp;
  return parent.op === '⊃' ? side === 'a' : side === 'b';
}

function print(f: Formula, level: number, opts: { scope: boolean; main: boolean }, parens: 'none' | 'old' | 'new', inScope = false): Seg[] {
  const tag = (segs: Seg[]) => (inScope ? segs.map((g) => ({ ...g, scope: true })) : segs);
  let body: Seg[];
  switch (f.t) {
    case 'var':
      body = tag([{ s: f.n }]);
      break;
    case 'atom':
      body = tag([{ s: f.n + (f.args.length ? `(${f.args.map(termString).join(', ')})` : '') }]);
      break;
    case 'not':
    case 'q': {
      const head = f.t === 'not' ? '¬' : `${f.q}${f.x} `;
      const p = required(f.a, f, 'a') ? 'old' : f.a.t === 'bin' && RANK[f.a.op] <= level ? 'new' : 'none';
      body = [...tag([{ s: head }]), ...print(f.a, level, { ...opts, main: false }, p, inScope || opts.scope)];
      break;
    }
    case 'bin': {
      const pa = required(f.a, f, 'a') ? 'old' : f.a.t === 'bin' && RANK[f.a.op] <= level ? 'new' : 'none';
      const pb = required(f.b, f, 'b') ? 'old' : f.b.t === 'bin' && RANK[f.b.op] <= level ? 'new' : 'none';
      body = [
        ...print(f.a, level, { ...opts, main: false }, pa, inScope),
        ...tag([{ s: ' ' }, { s: f.op, k: opts.main ? 'main' : undefined }, { s: ' ' }]),
        ...print(f.b, level, { ...opts, main: false }, pb, inScope),
      ];
      break;
    }
  }
  if (parens === 'none') return body;
  // Brackets added in an earlier step look like the original ones; only this step's are highlighted.
  const isNew = parens === 'new' && f.t === 'bin' && RANK[f.op] === level;
  const k: SegKind | undefined = isNew ? 'new' : undefined;
  return [...tag([{ s: '(', k }]), ...body, ...tag([{ s: ')', k }])];
}

const ops = (f: Formula, out = new Set<BinOp>(), unary = { v: false, chain: false }) => {
  if (f.t === 'bin') {
    out.add(f.op);
    if (f.op === '⊃' && f.b.t === 'bin' && f.b.op === '⊃') unary.chain = true;
    ops(f.a, out, unary);
    ops(f.b, out, unary);
  } else if (f.t === 'not' || f.t === 'q') {
    unary.v = true;
    ops(f.a, out, unary);
  }
  return { bins: out, unary };
};

const LEVEL_TEXT: Record<number, [string, string]> = {
  1: ['∧', 'A ∧ köt a legerősebben a kétargumentumú jelek közül: zárójelbe tesszük a két szomszédjával.'],
  2: ['∨', 'Utána a ∨ következik.'],
  3: ['⊃', 'Aztán a ⊃.'],
  4: ['≡', 'Végül a ≡, ez köt a leggyengébben.'],
};

/** The steps for one formula. The last step's text equals the official fully bracketed form, show(f). */
export function bracketSteps(f: Formula): BracketStep[] {
  const { bins, unary } = ops(f);
  const steps: BracketStep[] = [
    { title: 'Kiindulás', text: 'A beírt formula, csak a szükséges zárójelekkel.', segs: print(f, 0, { scope: false, main: false }, 'none') },
  ];
  if (unary.v)
    steps.push({
      title: '¬, ∀, ∃',
      text: 'A ¬ és a kvantorok kötnek a legerősebben: csak a közvetlenül utánuk álló részre vonatkoznak (aláhúzva). Ha több kell, azt zárójel jelzi.',
      segs: print(f, 0, { scope: true, main: false }, 'none'),
    });
  for (const level of [1, 2, 3, 4]) {
    const [op, text] = LEVEL_TEXT[level];
    if (!bins.has(op as BinOp)) continue;
    const extra = level === 3 && unary.chain ? ' Több ⊃ egymás után jobbról csoportosít: p ⊃ q ⊃ r = p ⊃ (q ⊃ r).' : '';
    const segs = print(f, level, { scope: false, main: false }, f.t === 'bin' && RANK[f.op] <= level ? 'new' : 'none');
    steps.push({ title: op, text: text + extra, segs });
  }
  const last = print(f, 4, { scope: false, main: true }, f.t === 'bin' ? 'old' : 'none');
  steps.push({
    title: 'Fő jel',
    text:
      f.t === 'bin'
        ? `Ami utoljára maradt, a ${f.op}, az a fő logikai jel. Ez van a szerkezeti fa gyökerében.`
        : f.t === 'not'
          ? 'A fő logikai jel a ¬: az egész formula egy tagadás.'
          : f.t === 'q'
            ? `A fő logikai jel a ${f.q}${f.x} kvantor: az egész formula erre épül.`
            : 'Ez egy atomi formula, nincs benne logikai jel.',
    segs: last,
  });
  return steps;
}

export const segText = (segs: Seg[]) => segs.map((g) => g.s).join('');
