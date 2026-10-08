import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card, LinkRow, Screen, SearchInput, Txt, useSubjectColor } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { subjects } from '@/content';
import { usePalette } from '@/hooks/use-palette';
import { search } from '@/search/search';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const c = usePalette();
  const color = useSubjectColor();
  const hits = search(q);

  return (
    <Screen gap={Spacing.four}>
      <Stack.Screen options={{ title: 'Keresés' }} />
      <SearchInput
        value={q}
        onChangeText={(v) => {
          setQ(v);
          router.setParams({ q: v });
        }}
        autoFocus
      />
      {q.trim().length < 2 ? (
        <Txt v="small">Írj be legalább két betűt. Az ékezeteket nem kell eltalálni: „kongruencia” és „kongruencia” ugyanaz, „tetel” megtalálja a „tétel”-t.</Txt>
      ) : hits.length === 0 ? (
        <Txt v="small">Nincs találat erre: „{q}”.</Txt>
      ) : (
        <Card style={{ padding: Spacing.two, gap: 0 }}>
          {hits.map(({ entry, snippet }) => {
            const s = subjects.find((x) => x.slug === entry.subject)!;
            const href = (entry.anchor ? `/${entry.topic}?szakasz=${entry.anchor}` : `/${entry.topic}`) as Href;
            return (
              <LinkRow key={entry.id} href={href} style={{ alignItems: 'flex-start' }}>
                <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: color(s) }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt v="small" color={color(s)}>
                    {s.short} · {entry.title}
                  </Txt>
                  <Txt v="heading">{entry.heading || entry.title}</Txt>
                  <Txt v="small" color={c.textSecondary} numberOfLines={2}>
                    {snippet}
                  </Txt>
                </View>
              </LinkRow>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
