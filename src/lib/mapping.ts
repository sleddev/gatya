// Classifying a finite relation D → R drawn as arrows: function? injective? surjective?
// Pure functions, no DOM.

/** arrows[i] = indices in R that element i of D points to. */
export type Arrows = number[][];

export type MappingKind =
  | { fn: false; missing: number[]; multi: number[] }
  | {
      fn: true;
      /** for every y in R, the elements of D mapped to it */
      preimages: number[][];
      injective: boolean;
      surjective: boolean;
      /** a y with at least two preimages, if any */
      collision: number | null;
      /** elements of R nobody maps to */
      unhit: number[];
    };

export function classifyMapping(arrows: Arrows, rSize: number): MappingKind {
  const missing = arrows.flatMap((a, i) => (a.length === 0 ? [i] : []));
  const multi = arrows.flatMap((a, i) => (a.length > 1 ? [i] : []));
  if (missing.length || multi.length) return { fn: false, missing, multi };
  const preimages: number[][] = Array.from({ length: rSize }, () => []);
  arrows.forEach(([y], x) => preimages[y].push(x));
  const collision = preimages.findIndex((p) => p.length > 1);
  const unhit = preimages.flatMap((p, y) => (p.length === 0 ? [y] : []));
  return {
    fn: true,
    preimages,
    injective: collision < 0,
    surjective: unhit.length === 0,
    collision: collision < 0 ? null : collision,
    unhit,
  };
}

/** Toggle the arrow x → y. */
export function toggleArrow(arrows: Arrows, x: number, y: number): Arrows {
  return arrows.map((a, i) => (i !== x ? a : a.includes(y) ? a.filter((v) => v !== y) : [...a, y].sort((p, q) => p - q)));
}
