import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { WideBreakpoint } from '@/constants/theme';

/** Sidebar layout on wide screens. False during static rendering and hydration, so markup matches. */
export function useWide(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { width } = useWindowDimensions();
  return hydrated && width >= WideBreakpoint;
}
