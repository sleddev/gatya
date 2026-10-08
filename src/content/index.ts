import { subjects } from './generated/manifest';
import type { Subject, Topic } from './types';

export { subjects };
export * from './types';

export const allTopics: Topic[] = subjects.flatMap((s) => s.topics);

export function getSubject(slug: string | undefined): Subject | undefined {
  return subjects.find((s) => s.slug === slug);
}

export function getTopic(subject: string | undefined, slug: string | undefined): Topic | undefined {
  return allTopics.find((t) => t.subject === subject && t.slug === slug);
}

export function neighbours(topic: Topic): { prev?: Topic; next?: Topic } {
  const i = allTopics.findIndex((t) => t.id === topic.id);
  return { prev: allTopics[i - 1], next: allTopics[i + 1] };
}

export const topicHref = (t: Pick<Topic, 'subject' | 'slug'>, anchor?: string) =>
  `/${t.subject}/${t.slug}${anchor ? `#${anchor}` : ''}`;
