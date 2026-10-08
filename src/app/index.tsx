import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, type HoverState, LinkRow, ProgressBar, Screen, SearchInput, StatusPill, SubjectBadge, Txt, useSubjectColor } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { allTopics, subjects, topicHref } from '@/content';
import { usePalette } from '@/hooks/use-palette';
import { useWide } from '@/hooks/use-wide';
import { useProgress } from '@/state/progress';

export default function Home() {
  const c = usePalette();
  const wide = useWide();
  const color = useSubjectColor();
  const { learned, last } = useProgress();
  const [q, setQ] = useState('');
  const lastTopic = allTopics.find((t) => t.id === last);
  const done = allTopics.filter((t) => learned.has(t.id)).length;
  const missed = allTopics.filter((t) => (t.status === 'kimaradt' || t.status === 'talan') && !learned.has(t.id));

  return (
    <Screen>
      <View style={{ gap: Spacing.two }}>
        {/* Narrow layouts show the brand in the title bar instead. */}
        {wide ? (
          <View style={styles.brand}>
            <Text style={{ fontSize: 40 }}>🩳</Text>
            <Txt v="display">Gatya</Txt>
          </View>
        ) : null}
        <Txt color={c.textSecondary}>
          Jegyzetek és interaktív gyakorlók a programtervező informatikus BSc első félévéhez (Debreceni Egyetem, IK, 2026 ősz).
        </Txt>
      </View>

      <SearchInput value={q} onChangeText={setQ} onSubmit={() => router.push({ pathname: '/kereses', params: { q } })} />

      <Card>
        <View style={styles.between}>
          <Txt v="label">Haladás</Txt>
          <Txt v="mono" color={c.textSecondary}>
            {done} / {allTopics.length} téma
          </Txt>
        </View>
        <ProgressBar value={allTopics.length ? done / allTopics.length : 0} color={c.brand} />
        {lastTopic ? (
          <LinkRow href={topicHref(lastTopic) as Href} style={{ paddingHorizontal: 0 }}>
            <View style={{ flex: 1 }}>
              <Txt v="small">Folytasd ahol abbahagytad</Txt>
              <Txt v="heading">{lastTopic.title}</Txt>
            </View>
            <Txt color={c.brand}>→</Txt>
          </LinkRow>
        ) : null}
      </Card>

      <View style={{ gap: Spacing.three }}>
        <Txt v="label">Tantárgyak</Txt>
        {subjects.map((s) => {
          const n = s.topics.filter((t) => learned.has(t.id)).length;
          return (
            <Pressable key={s.slug} onPress={() => router.push(`/${s.slug}` as Href)} accessibilityRole="link" accessibilityLabel={s.title}>
              {({ hovered, pressed }: HoverState) => (
                <Card accent={color(s)} style={(hovered || pressed) && { borderColor: color(s) }}>
                  <View style={styles.subjectRow}>
                    <SubjectBadge subject={s} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt v="heading">{s.title}</Txt>
                      {s.lecturer ? <Txt v="small">{s.lecturer}</Txt> : null}
                    </View>
                    <Txt v="mono" color={c.textSecondary}>
                      {n}/{s.topics.length}
                    </Txt>
                  </View>
                  <ProgressBar value={s.topics.length ? n / s.topics.length : 0} color={color(s)} />
                </Card>
              )}
            </Pressable>
          );
        })}
      </View>

      {missed.length ? (
        <View style={{ gap: Spacing.two }}>
          <Txt v="label">Ezeket hagytad ki</Txt>
          <Card style={{ padding: Spacing.two, gap: 0 }}>
            {missed.map((t) => {
              const s = subjects.find((x) => x.slug === t.subject)!;
              return (
                <LinkRow key={t.id} href={topicHref(t) as Href}>
                  <View style={[styles.dot, { backgroundColor: color(s) }]} />
                  <View style={{ flex: 1 }}>
                    <Txt>{t.title}</Txt>
                    <Txt v="small">{s.short}</Txt>
                  </View>
                  <StatusPill status={t.status} />
                </LinkRow>
              );
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dot: { width: 10, height: 10, borderRadius: 3 },
});
