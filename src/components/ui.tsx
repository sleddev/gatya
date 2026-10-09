import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { type GestureResponderEvent, Platform, Pressable, ScrollView, type PressableStateCallbackType, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Fonts, MaxContentWidth, Spacing, type Palette } from '@/constants/theme';
import { STATUS_LABEL, type Subject, type TopicStatus } from '@/content/types';
import { usePalette } from '@/hooks/use-palette';
import { useScheme } from '@/hooks/use-scheme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'label' | 'mono';

const BASE_URL = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');

export type HoverState = PressableStateCallbackType & { hovered?: boolean };

export function Txt({
  v = 'body',
  color,
  style,
  children,
  numberOfLines,
}: {
  v?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  const c = usePalette();
  return (
    <Text numberOfLines={numberOfLines} style={[text[v], { color: color ?? (v === 'small' || v === 'label' ? c.textSecondary : c.text) }, style]}>
      {children}
    </Text>
  );
}

const text = StyleSheet.create({
  display: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38, fontFamily: Fonts?.sans },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, lineHeight: 31, fontFamily: Fonts?.sans },
  heading: { fontSize: 18, fontWeight: '600', lineHeight: 24, fontFamily: Fonts?.sans },
  body: { fontSize: 16, lineHeight: 23, fontFamily: Fonts?.sans },
  small: { fontSize: 14, lineHeight: 20, fontFamily: Fonts?.sans },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontFamily: Fonts?.mono },
  mono: { fontSize: 13, fontFamily: Fonts?.mono },
});

/** Scrollable page with a centred, width-limited column. */
export function Screen({ children, gap = Spacing.five }: { children: ReactNode; gap?: number }) {
  const c = usePalette();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={[styles.column, { gap }]}>{children}</View>
    </ScrollView>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const c = usePalette();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        accent ? { borderTopColor: accent, borderTopWidth: 3 } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

export function StatusPill({ status }: { status: TopicStatus }) {
  const c = usePalette();
  const color = status === 'kimaradt' ? c.bad : status === 'talan' ? c.warn : status === 'kovetkezo' || status === 'lecke' ? c.brand : c.textSecondary;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[text.label, { color, fontSize: 10 }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const c = usePalette();
  return (
    <View style={[styles.bar, { backgroundColor: c.surfaceAlt }]}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export const subjectColor = (s: Subject, scheme: 'light' | 'dark') => (scheme === 'dark' ? s.colorDark : s.color);

export function useSubjectColor() {
  const scheme = useScheme();
  return (s: Subject) => subjectColor(s, scheme);
}

export function SubjectBadge({ subject, size = 40 }: { subject: Subject; size?: number }) {
  const color = useSubjectColor()(subject);
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: size * (subject.short.length <= 4 ? 0.3 : 0.22), fontFamily: Fonts?.mono }}>
        {subject.short}
      </Text>
    </View>
  );
}

/** True for a plain left click; modified clicks (new tab, etc.) are left to the browser. */
function plainClick(e: GestureResponderEvent) {
  const n = e.nativeEvent as unknown as MouseEvent;
  return !(n.metaKey || n.ctrlKey || n.shiftKey || n.altKey || (n.button != null && n.button !== 0));
}

/**
 * A pressable row that navigates in-app. On web it renders a real <a href> (so "open in new tab"
 * works) but handles plain clicks client-side. expo-router's <Link asChild> around a Pressable
 * doesn't cancel the browser's default navigation, which caused a full page reload per click.
 */
export function LinkRow({
  href,
  children,
  style,
  onPress,
  dismiss,
}: {
  href: Href;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Runs before navigating; return false to skip the navigation. */
  onPress?: () => boolean | void;
  /** Go back to an existing screen for this route (e.g. home) instead of pushing a new one. */
  dismiss?: boolean;
}) {
  const c = usePalette();
  const [hover, setHover] = useState(false);
  const target = typeof href === 'string' ? href : href.pathname;
  const webHref = Platform.OS === 'web' ? `${BASE_URL}${target === '/' ? '' : target}` || '/' : undefined;
  return (
    <Pressable
      role="link"
      {...(webHref ? { href: webHref } : {})}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onPress={(e) => {
        if (Platform.OS === 'web') {
          if (!plainClick(e)) return;
          e.preventDefault();
        }
        if (onPress?.() === false) return;
        if (dismiss) router.dismissTo(href);
        else router.push(href);
      }}
      style={[styles.row, hover && { backgroundColor: c.surfaceAlt }, style]}>
      {children}
    </Pressable>
  );
}

export function SearchInput({
  value,
  onChangeText,
  onSubmit,
  autoFocus,
  palette,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  palette?: Palette;
}) {
  const own = usePalette();
  const c = palette ?? own;
  return (
    <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={{ fontSize: 15, color: c.textSecondary }}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        placeholder="Keresés: pl. kongruencia, De Morgan, vektor…"
        placeholderTextColor={c.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Keresés a jegyzetekben"
        style={[styles.searchInput, { color: c.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: Spacing.four, paddingTop: Spacing.five, paddingBottom: Spacing.seven * 2, alignItems: 'center' },
  column: { width: '100%', maxWidth: MaxContentWidth },
  card: { borderWidth: 1, borderRadius: 14, padding: Spacing.four, gap: Spacing.three },
  pill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start' },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' },
  badge: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, borderRadius: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 11, fontFamily: Fonts?.sans },
});
