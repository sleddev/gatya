// The step-by-step lesson format ("Logika a nulláról"): a <Lecke> shows its <Kartya> cards one at a
// time, and a card's „Tovább” button unlocks once every exercise on it is solved. Exercises report
// in through useExercise(); outside a card they work on their own. Not usable from MDX directly.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';

type CardApi = { register: (id: string) => () => void; solve: (id: string) => void; miss?: (id: string) => void };

const CardCtx = createContext<CardApi | null>(null);

/**
 * One exercise: registers with the surrounding card (if any), counts wrong tries, and ends either
 * solved (`ok`) or with the solution shown (`shown`). Both unlock the card's „Tovább” button.
 */
export function useExercise() {
  const card = useContext(CardCtx);
  const id = useId();
  const [state, setState] = useState<'open' | 'ok' | 'shown'>('open');
  const [wrong, setWrong] = useState(0);
  useEffect(() => card?.register(id), [card, id]);
  const finish = useCallback(
    (s: 'ok' | 'shown') => {
      setState(s);
      card?.solve(id);
    },
    [card, id]
  );
  return {
    ok: state === 'ok',
    shown: state === 'shown',
    done: state !== 'open',
    wrong,
    solve: () => finish('ok'),
    reveal: () => finish('shown'),
    miss: () => {
      setWrong((w) => w + 1);
      card?.miss?.(id);
    },
  };
}

export type Exercise = ReturnType<typeof useExercise>;

/** Pending/solved bookkeeping for one card. */
export function useCardState() {
  const [registered, setRegistered] = useState<string[]>([]);
  const [solved, setSolved] = useState<string[]>([]);
  const api = useMemo<CardApi>(
    () => ({
      register: (id) => {
        setRegistered((r) => (r.includes(id) ? r : [...r, id]));
        return () => setRegistered((r) => r.filter((x) => x !== id));
      },
      solve: (id) => setSolved((s) => (s.includes(id) ? s : [...s, id])),
    }),
    []
  );
  const open = registered.filter((id) => !solved.includes(id)).length;
  return { api, open, total: registered.length };
}

export const CardProvider = CardCtx.Provider;

/** Lesson position, shared with the cards. */
export const LessonCtx = createContext<{ cur: number; total: number; showAll: boolean; next: () => void } | null>(null);

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode or blocked storage: progress just isn't remembered
  }
}

/** Feedback line under an exercise. */
export function Feedback({ kind, children }: { kind: 'ok' | 'no' | 'info'; children: ReactNode }) {
  return (
    <div className={`fb ${kind}`} role="status">
      <span className="fb-ic" aria-hidden>
        {kind === 'ok' ? '✓' : kind === 'no' ? '✗' : 'i'}
      </span>
      <div>{children}</div>
    </div>
  );
}

/** „Ellenőrzés” and, after a wrong try, „Megmutatom a megoldást”. */
export function CheckBar({ ex, onCheck, disabled, label = 'Ellenőrzés' }: { ex: Exercise; onCheck?: () => void; disabled?: boolean; label?: string }) {
  if (ex.done) return null;
  return (
    <div className="row">
      {onCheck ? (
        <button type="button" className="btn on" onClick={onCheck} disabled={disabled}>
          {label}
        </button>
      ) : null}
      {ex.wrong > 0 ? (
        <button type="button" className="btn ghost" onClick={ex.reveal}>
          Megmutatom a megoldást
        </button>
      ) : null}
    </div>
  );
}

/** The closing feedback once an exercise is done. */
export function DoneNote({ ex, children }: { ex: Exercise; children?: ReactNode }) {
  if (!ex.done) return null;
  return (
    <Feedback kind={ex.ok ? 'ok' : 'info'}>
      <b>{ex.ok ? 'Pontosan! ' : 'A megoldás: '}</b>
      {children}
    </Feedback>
  );
}

/** Scrolls an element into view once, when `when` turns true. */
export function useScrollIntoView<T extends HTMLElement>(when: boolean) {
  const ref = useRef<T>(null);
  const done = useRef(false);
  useEffect(() => {
    if (when && !done.current && ref.current) {
      done.current = true;
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [when]);
  return ref;
}

export const bit = (b: boolean) => (b ? '1' : '0');
