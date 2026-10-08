import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A2016',
    textSecondary: '#5B6553',
    background: '#F4F6F1',
    surface: '#FFFFFF',
    surfaceAlt: '#E9EDE4',
    border: '#D6DCCF',
    brand: '#4F8236',
    brandSoft: '#E3EED9',
    good: '#1B8546',
    warn: '#A86B00',
    bad: '#C03A2E',
  },
  dark: {
    text: '#E7ECE2',
    textSecondary: '#A1AB98',
    background: '#12160F',
    surface: '#1A2016',
    surfaceAlt: '#222A1D',
    border: '#2F3829',
    brand: '#8BC46A',
    brandSoft: '#253320',
    good: '#4CC47E',
    warn: '#E7B04A',
    bad: '#FF7A6B',
  },
} as const;

export type Scheme = keyof typeof Colors;
export type Palette = (typeof Colors)[Scheme];

export const Fonts = Platform.select({
  web: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 12, four: 16, five: 24, six: 32, seven: 48 } as const;

export const MaxContentWidth = 860;
/** Width from which the web layout shows a permanent sidebar. */
export const WideBreakpoint = 960;
