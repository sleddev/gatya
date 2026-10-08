import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { usePalette } from '@/hooks/use-palette';

/**
 * New content ships as an EAS Update. The app checks on launch by itself; this also checks when
 * the app returns to the foreground and offers to load a downloaded update right away.
 */
export function UpdateBanner() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled || __DEV__) return;
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // Offline or the update server is unreachable: try again next time.
      }
    });
    return () => sub.remove();
  }, []);

  if (!isUpdatePending) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + Spacing.three }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        onPress={() => void Updates.reloadAsync()}
        style={[styles.banner, { backgroundColor: c.text }]}>
        <Text style={[styles.text, { color: c.background }]}>Új tananyag érkezett</Text>
        <Text style={[styles.text, styles.action, { color: c.background }]}>Betöltés ↻</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: Spacing.three, right: Spacing.three, alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { fontSize: 15 },
  action: { fontWeight: '700' },
});
