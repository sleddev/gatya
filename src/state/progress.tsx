// Which topics the user marked as learned, and the last topic they opened.
// Stored with AsyncStorage (localStorage on the web), per device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'gatya:progress:v1';

type Stored = { learned: string[]; last?: string };

type Progress = {
  learned: Set<string>;
  last?: string;
  ready: boolean;
  toggle: (topicId: string) => void;
  visit: (topicId: string) => void;
};

const Ctx = createContext<Progress>({ learned: new Set(), ready: false, toggle: () => {}, visit: () => {} });

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>({ learned: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Stored;
          // Keep anything recorded before storage finished loading.
          setState((now) => ({
            learned: [...new Set([...(saved.learned ?? []), ...now.learned])],
            last: now.last ?? saved.last,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // Stable callbacks (functional updates), so screens can call them from effects safely.
  const toggle = useCallback((id: string) => {
    setState((s) => ({ ...s, learned: s.learned.includes(id) ? s.learned.filter((x) => x !== id) : [...s.learned, id] }));
  }, []);

  const visit = useCallback((id: string) => {
    setState((s) => (s.last === id ? s : { ...s, last: id }));
  }, []);

  const value = useMemo(
    () => ({ learned: new Set(state.learned), last: state.last, ready, toggle, visit }),
    [state, ready, toggle, visit]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProgress = () => useContext(Ctx);
