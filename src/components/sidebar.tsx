import { router, usePathname, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { subjects, topicHref } from '@/content';
import { usePalette } from '@/hooks/use-palette';
import { useProgress } from '@/state/progress';

import { LinkRow, SearchInput, Txt, useSubjectColor } from './ui';

/** Permanent navigation for wide web layouts. */
export function Sidebar() {
  const c = usePalette();
  const path = usePathname();
  const { learned } = useProgress();
  const color = useSubjectColor();
  const [q, setQ] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <View style={[styles.side, { backgroundColor: c.surface, borderRightColor: c.border }]}>
      <LinkRow href="/" style={{ paddingVertical: Spacing.two }}>
        <Text style={{ fontSize: 26 }}>🩳</Text>
        <Txt v="heading" style={{ fontSize: 20 }}>
          Pants
        </Txt>
      </LinkRow>
      <SearchInput
        value={q}
        onChangeText={setQ}
        onSubmit={() => router.push({ pathname: '/kereses', params: { q } })}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.six }}>
        {subjects.map((s) => {
          const open = !closed[s.slug];
          const done = s.topics.filter((t) => learned.has(t.id)).length;
          return (
            <View key={s.slug} style={{ marginTop: Spacing.three }}>
              <Pressable
                onPress={() => setClosed({ ...closed, [s.slug]: open })}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={styles.subjectHead}>
                <View style={[styles.dot, { backgroundColor: color(s) }]} />
                <Text style={[styles.subjectTitle, { color: c.text }]} numberOfLines={1}>
                  {s.title}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: Fonts?.mono }}>
                  {done}/{s.topics.length} {open ? '▾' : '▸'}
                </Text>
              </Pressable>
              {open ? (
                <>
                  <LinkRow href={`/${s.slug}` as Href} style={styles.topic}>
                    <Text style={{ color: path === `/${s.slug}` ? color(s) : c.textSecondary, fontSize: 14, fontWeight: path === `/${s.slug}` ? '600' : '400' }}>
                      Áttekintés
                    </Text>
                  </LinkRow>
                  {s.topics.map((t) => {
                    const active = path === topicHref(t);
                    return (
                      <LinkRow
                        key={t.id}
                        href={topicHref(t) as Href}
                        style={[styles.topic, active && { backgroundColor: c.surfaceAlt }]}>
                        <Text style={{ width: 14, color: learned.has(t.id) ? c.good : c.border, fontSize: 12 }}>{learned.has(t.id) ? '✓' : '•'}</Text>
                        <Text
                          numberOfLines={2}
                          style={{ flex: 1, color: active ? color(s) : c.text, fontSize: 14, fontWeight: active ? '600' : '400' }}>
                          {t.title}
                        </Text>
                      </LinkRow>
                    );
                  })}
                </>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  side: { width: 300, borderRightWidth: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.two },
  subjectHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  subjectTitle: { flex: 1, fontWeight: '700', fontSize: 14 },
  dot: { width: 10, height: 10, borderRadius: 3 },
  topic: { paddingVertical: 7, paddingLeft: Spacing.five, gap: Spacing.two },
});
