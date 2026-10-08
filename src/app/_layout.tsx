import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { DrawerProvider, NavDrawer } from '@/components/drawer';
import { Brand, HeaderActions } from '@/components/header-actions';
import { Sidebar } from '@/components/sidebar';
import { UpdateBanner } from '@/components/update-banner';
import { Colors } from '@/constants/theme';
import { useScheme } from '@/hooks/use-scheme';
import { useWide } from '@/hooks/use-wide';
import { ProgressProvider } from '@/state/progress';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useScheme();
  const c = Colors[scheme];
  const wide = useWide();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: c.background, card: c.surface, text: c.text, border: c.border, primary: c.brand },
  };

  const stack = (
    <Stack
      screenOptions={{
        headerShown: !wide,
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.background },
        headerRight: () => <HeaderActions />,
      }}>
      <Stack.Screen
        name="index"
        options={{ title: 'Gatya', headerTitle: () => <Brand />, headerTitleAlign: 'left', headerRight: () => <HeaderActions search={false} /> }}
      />
      <Stack.Screen name="kereses" options={{ title: 'Keresés' }} />
    </Stack>
  );

  return (
    <ThemeProvider value={theme}>
      <ProgressProvider>
        <DrawerProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {wide ? (
            <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.background }}>
              <Sidebar />
              <View style={{ flex: 1 }}>{stack}</View>
            </View>
          ) : (
            <>
              {stack}
              <NavDrawer />
            </>
          )}
          <UpdateBanner />
        </DrawerProvider>
      </ProgressProvider>
    </ThemeProvider>
  );
}
