export type TopicStatus = 'kimaradt' | 'ismetles' | 'talan' | 'kovetkezo' | 'lecke';

export interface Heading {
  id: string;
  text: string;
  depth: number;
}

export interface Topic {
  /** "<subject>/<slug>" */
  id: string;
  subject: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  status: TopicStatus;
  keywords: string[];
  source: string;
  headings: Heading[];
}

export interface Subject {
  slug: string;
  title: string;
  short: string;
  color: string;
  colorDark: string;
  lecturer: string;
  intro: string;
  order: number;
  topics: Topic[];
}

export interface SearchEntry {
  id: string;
  topic: string;
  subject: string;
  title: string;
  heading: string;
  anchor: string;
  keywords: string;
  text: string;
}

export const STATUS_LABEL: Record<TopicStatus, string> = {
  kimaradt: 'kimaradt',
  ismetles: 'ismétlés',
  talan: 'talán kimaradt',
  kovetkezo: 'következik',
  lecke: 'lecke',
};
