import type { ExpoConfig } from 'expo/config';

// GATYA_BASE_URL lets the static web build live under a sub-path,
// e.g. "/gatya" on GitHub Pages. Leave it unset for a root deploy.
const baseUrl = process.env.GATYA_BASE_URL || undefined;

// Over-the-air updates (EAS Update). Run `pnpm dlx eas-cli init` once and paste the
// project ID it prints here; until then the app simply ships without OTA updates.
const easProjectId = '8a13b1ef-0835-453f-83eb-478ce9c76a64';

const config: ExpoConfig = {
  name: 'Gatya',
  slug: 'gatya',
  version: '0.1.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'gatya',
  userInterfaceStyle: 'automatic',
  // Builds share a runtime version until native code changes (new native package, SDK upgrade,
  // config plugin change). Content and JS changes keep it, so they can ship as OTA updates.
  runtimeVersion: { policy: 'fingerprint' },
  ...(easProjectId
    ? {
        updates: { url: `https://u.expo.dev/${easProjectId}` },
        extra: { eas: { projectId: easProjectId } },
      }
    : {}),
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
