import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

/** The colour scheme of the content view. Widgets that draw on <canvas> read it so they repaint on theme change. */
export const SchemeContext = createContext<'light' | 'dark'>('light');
export const useScheme = () => useContext(SchemeContext);

type LinkProps = { href: string; className?: string; children?: ReactNode };

/** The topic being shown ("<subject>/<slug>") and a link component that navigates inside the app. */
export const DocContext = createContext<{ id: string; Link: ComponentType<LinkProps> }>({
  id: '',
  Link: ({ href, className, children }) => (
    // Fallback outside ContentView (never used in practice).
    <a href={href} className={className}>
      {children}
    </a>
  ),
});
export const useDoc = () => useContext(DocContext);
