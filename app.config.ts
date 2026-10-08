import type { ExpoConfig } from 'expo/config';

// GATYA_BASE_URL lets the static web build live under a sub-path,
// e.g. "/gatya" on GitHub Pages. Leave it unset for a root deploy.
const baseUrl = process.env.GATYA_BASE_URL || undefined;

const config: ExpoConfig = {
  name: 'Gatya',
  slug: 'gatya',
  version: '0.1.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'gatya',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'hu.gatya.app',
    supportsTablet: true,
  },
  android: {
    package: 'hu.gatya.app',
    adaptiveIcon: {
      backgroundColor: '#E9F2E4',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
    name: 'Gatya',
    shortName: 'Gatya',
    lang: 'hu',
    themeColor: '#5D9040',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#E9F2E4',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
        dark: { backgroundColor: '#14190F' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    ...(baseUrl ? { baseUrl } : {}),
  },
};

export default config;
