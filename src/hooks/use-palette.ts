import { Colors } from '@/constants/theme';

import { useScheme } from './use-scheme';

export function usePalette() {
  return Colors[useScheme()];
}
