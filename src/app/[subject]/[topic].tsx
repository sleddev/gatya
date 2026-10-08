import { router, Stack, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinkRow, Screen, Txt } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { allTopics, getTopic } from '@/content';
import ContentView from '@/content/ContentView';
import { useScheme } from '@/hooks/use-scheme';
import { useProgress } from '@/state/progress';

export function generateStaticParams() {
  return allTopics.map((t) => ({ subject: t.subject, topic: t.slug }));
}

/** Internal content links look like "/dimat/oszthatosag#euklideszi-algoritmus". */
function toHref(link: string): Href {
  const [path, hash] = link.split('#');
  return (hash ? `${path}?szakasz=${encodeURIComponent(hash)}` : path) as Href;
}

export default function TopicScreen() {
  const { subject, topic, szakasz } = useLocalSearchParams<{ subject: string; topic: string; szakasz?: string }>();
  const t = getTopic(subject, topic);
  const scheme = useScheme();
  const insets = useSafeAreaInsets();
  const { learned, toggle, visit } = useProgress();

  const id = t?.id;
  // Only the screen in front counts as "last visited" (the web stack keeps earlier screens mounted).
  useFocusEffect(
    useCallback(() => {
      if (id) visit(id);
    }, [id, visit])
  );

  if (!t)
    return (
      <Screen>
        <Txt v="title">Nincs ilyen téma</Txt>
        <LinkRow href="/">
          <Txt color={Colors[scheme].brand}>← Vissza a kezdőlapra</Txt>
        </LinkRow>
      </Screen>
    );

  const navigate = async (href: string) => {
    if (/^https?:/.test(href)) {
      await WebBrowser.openBrowserAsync(href);
      return;
    }
    router.push(toHref(href));
  };

  const content = (
    <ContentView
      id={t.id}
      scheme={scheme}
      anchor={szakasz}
      learned={learned.has(t.id)}
      native={Platform.OS !== 'web'}
      bottomInset={insets.bottom}
      navigate={navigate}
      toggleLearned={async () => toggle(t.id)}
      dom={{ style: { flex: 1, backgroundColor: Colors[scheme].background } }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors[scheme].background }}>
      <Stack.Screen options={{ title: t.title }} />
      {Platform.OS === 'web' ? <ScrollView style={{ flex: 1 }}>{content}</ScrollView> : content}
    </View>
  );
}
