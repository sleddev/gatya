import Fuse from 'fuse.js';

import { searchEntries } from '@/content/generated/search';
import type { SearchEntry } from '@/content/types';

const fuse = new Fuse(searchEntries, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'heading', weight: 2.5 },
    { name: 'keywords', weight: 2 },
    { name: 'text', weight: 1 },
  ],
  ignoreDiacritics: true,
  ignoreLocation: true,
  includeMatches: true,
  threshold: 0.32,
  minMatchCharLength: 2,
});

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export type Hit = { entry: SearchEntry; snippet: string };

/** Accent-insensitive search over every section of every topic. */
export function search(query: string, limit = 30): Hit[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return fuse.search(q, { limit }).map(({ item }) => ({ entry: item, snippet: snippet(item.text, q) }));
}

function snippet(text: string, q: string): string {
  const words = plain(q).split(/\s+/).filter(Boolean);
  const hay = plain(text);
  let at = -1;
  for (const w of words) {
    at = hay.indexOf(w);
    if (at >= 0) break;
  }
  if (at < 0) return text.slice(0, 140) + (text.length > 140 ? '…' : '');
  const start = Math.max(0, at - 50);
  return (start > 0 ? '…' : '') + text.slice(start, start + 160).trim() + (start + 160 < text.length ? '…' : '');
}
