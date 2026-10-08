import { usePathname } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, BackHandler, Easing, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-palette';

import { Sidebar } from './sidebar';

type DrawerApi = { open: boolean; setOpen: (open: boolean) => void };

const DrawerContext = createContext<DrawerApi>({ open: false, setOpen: () => {} });

export const useDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const api = useMemo(() => ({ open, setOpen }), [open]);
  return <DrawerContext.Provider value={api}>{children}</DrawerContext.Provider>;
}

/** Hamburger button for the stacked header; opens the navigation drawer. */
export function MenuButton() {
  const c = usePalette();
  const { setOpen } = useDrawer();
  return (
    <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Menü" hitSlop={8} style={styles.menuBtn}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.menuLine, { backgroundColor: c.text }]} />
      ))}
    </Pressable>
  );
}

/** The sidebar as a slide-in panel from the right, for narrow screens and the native app. */
export function NavDrawer() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { open, setOpen } = useDrawer();
  const path = usePathname();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const panel = Math.min(330, Math.round(width * 0.86));

  useEffect(() => {
    if (open) setMounted(true);
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 220 : 180,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, progress]);

  // Close when the route changes (a link in the drawer was followed).
  useEffect(() => setOpen(false), [path, setOpen]);

  useEffect(() => {
    if (!open) return;
    if (Platform.OS === 'web') {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open, setOpen]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} accessibilityLabel="Menü bezárása" />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        {...(Platform.OS === 'web' ? { role: 'dialog', 'aria-modal': true, 'aria-label': 'Menü' } : {})}
        style={[
          styles.panel,
          {
            width: panel,
            backgroundColor: c.surface,
            borderLeftColor: c.border,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [panel, 0] }) }],
          },
        ]}>
        <Sidebar drawer onClose={() => setOpen(false)} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuBtn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  menuLine: { width: 20, height: 2, borderRadius: 1 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: { position: 'absolute', top: 0, bottom: 0, right: 0, borderLeftWidth: StyleSheet.hairlineWidth },
});
