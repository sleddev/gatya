'use dom';

import './content.css';

import type { DOMProps } from 'expo/dom';
import { Component, useEffect, useRef, type ComponentType, type CSSProperties, type ReactNode } from 'react';

import { mdxComponents } from '@/widgets';
import { DocContext, SchemeContext } from '@/widgets/theme';

import { subjects } from './generated/manifest';
import { registry } from './generated/registry';
import { STATUS_LABEL, type Topic } from './types';

type Props = {
  /** "<subject>/<slug>" */
  id: string;
  scheme: 'light' | 'dark';
  /** Heading id to scroll to. Append "@<anything>" to re-trigger the same anchor. */
  anchor?: string;
  learned: boolean;
  /** True when rendered inside the native app's webview. */
  native: boolean;
  bottomInset?: number;
  navigate: (href: string) => Promise<void>;
  toggleLearned: () => Promise<void>;
  dom?: DOMProps;
};

const BASE = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="callout warn">
          <b>Ezt a részt nem sikerült megjeleníteni.</b>
          <p className="mono">{this.state.error.message}</p>
        </div>
      );
    return this.props.children;
  }
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function ContentView({ id, scheme, anchor, learned, native, bottomInset = 0, navigate, toggleLearned }: Props) {
  const subject = subjects.find((s) => s.topics.some((t) => t.id === id));
  const topics: Topic[] = subjects.flatMap((s) => s.topics);
  const index = topics.findIndex((t) => t.id === id);
  const topic = topics[index];
  const prev = topics[index - 1];
  const next = topics[index + 1];
  const Content = registry[id];
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (native) {
      document.documentElement.style.background = scheme === 'dark' ? '#12160F' : '#F4F6F1';
      document.documentElement.lang = 'hu';
    }
  }, [native, scheme]);

  // Inline formulas can't line-break; one wider than its line would make the whole page scroll
  // sideways. Those get their own line and scroll by themselves (see .katex.wide).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let width = -1;
    const fit = () => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      const body = el.querySelector<HTMLElement>('.doc-body');
      if (!body) return;
      const column = body.getBoundingClientRect().right;
      for (const k of body.querySelectorAll<HTMLElement>('.katex')) {
        if (k.querySelector('math[display="block"]')) continue;
        k.classList.remove('wide');
        const box = k.parentElement?.closest<HTMLElement>('p, li, td, th, dd, div');
        if (!box) continue;
        const edge = Math.min(column, box.getBoundingClientRect().right - parseFloat(getComputedStyle(box).paddingRight));
        if (k.getBoundingClientRect().right > edge + 1) k.classList.add('wide');
      }
    };
    fit();
    // Math fonts can arrive after the first layout and change formula widths.
    void document.fonts?.ready.then(() => {
      width = -1;
      fit();
    });
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // Lessons reveal their cards one by one, so new formulas appear without a resize.
    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        width = -1;
        fit();
      });
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [id]);

  useEffect(() => {
    const target = anchor?.split('@')[0];
    if (target) requestAnimationFrame(() => scrollToId(decodeURIComponent(target)));
    else root.current?.scrollIntoView({ block: 'start' });
  }, [anchor, id]);

  if (!topic || !subject || !Content)
    return (
      <div className="gatya-doc" data-theme={scheme}>
        <article className="doc">
          <p>Ez a téma nem található: {id}</p>
        </article>
      </div>
    );

  const go = (href: string) => {
    void navigate(href);
  };

  const components = {
    ...mdxComponents,
    a: ({ href = '', children, ...rest }: { href?: string; children?: ReactNode }) => {
      const internal = href.startsWith('/') || href.startsWith('#');
      // Real href (for "open in new tab") must include the deploy sub-path, e.g. /gatya on GitHub Pages.
      const shown = href.startsWith('/') && !native ? `${BASE}${href.replace('#', `?szakasz=`)}` : href;
      return (
        <a
          {...rest}
          href={shown}
          target={internal ? undefined : '_blank'}
          rel={internal ? undefined : 'noreferrer'}
          onClick={(e) => {
            if (href.startsWith('#')) {
              e.preventDefault();
              scrollToId(decodeURIComponent(href.slice(1)));
            } else if (internal || native) {
              e.preventDefault();
              const [p, h] = href.split('#');
              if (p === `/${id}` && h) scrollToId(decodeURIComponent(h));
              else go(href);
            }
          }}>
          {children}
        </a>
      );
    },
    table: (p: object) => (
      <div className="tablewrap">
        <table {...p} />
      </div>
    ),
  };

  const doc = { id, Link: components.a as ComponentType<{ href: string; className?: string; children?: ReactNode }> };

  const style = {
    '--acc': scheme === 'dark' ? subject.colorDark : subject.color,
    paddingBottom: 48 + bottomInset,
  } as CSSProperties;

  const h2s = topic.headings.filter((h) => h.depth === 2);

  return (
    <div className="gatya-doc" data-theme={scheme} data-native={native ? '1' : undefined} style={style} ref={root}>
      <article className="doc">
        <header className="doc-head">
          <div className="eyebrow">
            <a
              href={`/${subject.slug}`}
              onClick={(e) => {
                e.preventDefault();
                go(`/${subject.slug}`);
              }}>
              {subject.title}
            </a>
            <span className={`status ${topic.status}`}>{STATUS_LABEL[topic.status]}</span>
          </div>
          <h1>{topic.title}</h1>
          {topic.summary ? <p className="lead">{topic.summary}</p> : null}
          {topic.source ? <p className="source">Forrás: {topic.source}</p> : null}
          {h2s.length > 1 ? (
            <nav className="toc" aria-label="Ezen az oldalon">
              {h2s.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(h.id);
                  }}>
                  {h.text}
                </a>
              ))}
            </nav>
          ) : null}
        </header>

        <div className="doc-body">
          <SchemeContext.Provider value={scheme}>
            <DocContext.Provider value={doc}>
              <Boundary key={id}>
                <Content components={components} />
              </Boundary>
            </DocContext.Provider>
          </SchemeContext.Provider>
        </div>

        <footer className="doc-foot">
          <button type="button" className={`learned${learned ? ' on' : ''}`} onClick={() => void toggleLearned()}>
            {learned ? '✓ Megtanultam' : 'Megjelölöm megtanultként'}
          </button>
          <div className="pager">
            {prev ? (
              <a
                className="pager-link"
                href={`/${prev.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(`/${prev.id}`);
                }}>
                <span>← Előző</span>
                <b>{prev.title}</b>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a
                className="pager-link next"
                href={`/${next.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(`/${next.id}`);
                }}>
                <span>Következő →</span>
                <b>{next.title}</b>
              </a>
            ) : (
              <span />
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
