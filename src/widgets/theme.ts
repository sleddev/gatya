import { createContext, useContext } from 'react';

/** The colour scheme of the content view. Widgets that draw on <canvas> read it so they repaint on theme change. */
export const SchemeContext = createContext<'light' | 'dark'>('light');
export const useScheme = () => useContext(SchemeContext);
