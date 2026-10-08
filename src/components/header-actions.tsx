import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePalette } from '@/hooks/use-palette';

import { MenuButton } from './drawer';

/** Search and menu buttons on the right of every stacked header. */
export function HeaderActions({ search = true }: { search?: boolean }) {
  const c = usePalette();
  return (
    <View style={styles.row}>
      {search ? (
        <Pressable onPress={() => router.push('/kereses')} accessibilityRole="button" accessibilityLabel="Keresés" hitSlop={8} style={styles.btn}>
          <Text style={[styles.icon, { color: c.text }]}>⌕</Text>
        </Pressable>
      ) : null}
      <MenuButton />
    </View>
  );
}

/** App title bar content for the home screen. */
export function Brand() {
  const c = usePalette();
  return (
    <View style={styles.brand}>
      <Text style={{ fontSize: 24 }}>🩳</Text>
      <Text style={{ fontSize: 21, fontWeight: '700', letterSpacing: -0.3, color: c.text }}>Gatya</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  btn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
