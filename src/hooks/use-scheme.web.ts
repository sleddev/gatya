import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

/** Static web pages are rendered in light mode; switch after hydration. */
export function useScheme(): 'light' | 'dark' {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const scheme = useColorScheme();
  return hydrated && scheme === 'dark' ? 'dark' : 'light';
}
