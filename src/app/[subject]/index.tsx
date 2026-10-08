import { Stack, useLocalSearchParams, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card, LinkRow, ProgressBar, Screen, StatusPill, SubjectBadge, Txt, useSubjectColor } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getSubject, subjects, topicHref } from '@/content';
import { usePalette } from '@/hooks/use-palette';
import { useProgress } from '@/state/progress';

export function generateStaticParams() {
  return subjects.map((s) => ({ subject: s.slug }));
}

export default function SubjectScreen() {
  const { subject: slug } = useLocalSearchParams<{ subject: string }>();
  const s = getSubject(slug);
  const c = usePalette();
  const color = useSubjectColor();
  const { learned } = useProgress();

  if (!s)
    return (
      <Screen>
        <Txt v="title">Nincs ilyen tantárgy</Txt>
        <LinkRow href="/">
          <Txt color={c.brand}>← Vissza a kezdőlapra</Txt>
        </LinkRow>
      </Screen>
    );

  const done = s.topics.filter((t) => learned.has(t.id)).length;
  return (
    <Screen gap={Spacing.four}>
      <Stack.Screen options={{ title: s.short }} />
      <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
        <SubjectBadge subject={s} size={52} />
        <View style={{ flex: 1 }}>
          <Txt v="title">{s.title}</Txt>
          {s.lecturer ? <Txt v="small">{s.lecturer}</Txt> : null}
        </View>
      </View>
      {s.intro ? <Txt color={c.textSecondary}>{s.intro}</Txt> : null}
      <View style={{ gap: Spacing.two }}>
        <ProgressBar value={s.topics.length ? done / s.topics.length : 0} color={color(s)} />
        <Txt v="small">
          {done} / {s.topics.length} téma megjelölve megtanultként
        </Txt>
      </View>
      <Card style={{ padding: Spacing.two, gap: 0 }}>
        {s.topics.map((t, i) => (
          <LinkRow key={t.id} href={topicHref(t) as Href} style={{ alignItems: 'flex-start' }}>
            <Txt v="mono" color={learned.has(t.id) ? c.good : color(s)} style={{ width: 26, paddingTop: 2 }}>
              {learned.has(t.id) ? '✓' : String(i + 1).padStart(2, '0')}
            </Txt>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt v="heading">{t.title}</Txt>
              {t.summary ? (
                <Txt v="small" numberOfLines={3}>
                  {t.summary}
                </Txt>
              ) : null}
              <StatusPill status={t.status} />
            </View>
          </LinkRow>
        ))}
      </Card>
    </Screen>
  );
}
