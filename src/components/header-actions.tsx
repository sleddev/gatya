import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';

/** Home and search buttons on the right of every stacked header. */
export function HeaderActions() {
  const c = usePalette();
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.push('/kereses')} accessibilityRole="button" accessibilityLabel="Keresés" hitSlop={8} style={styles.btn}>
        <Text style={[styles.icon, { color: c.text }]}>⌕</Text>
      </Pressable>
      <Pressable onPress={() => router.dismissTo('/')} accessibilityRole="button" accessibilityLabel="Kezdőlap" hitSlop={8} style={styles.btn}>
        <Text style={styles.icon}>🩳</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  btn: { paddingHorizontal: 8, paddingVertical: 4 },
  icon: { fontSize: 20 },
});
