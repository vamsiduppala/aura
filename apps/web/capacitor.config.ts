import type { CapacitorConfig } from '@capacitor/cli';

// aura ships the same React app on web, Android and iOS. The native shells load the built
// `dist/` bundle; the app then talks to YOUR local aura server over Wi-Fi at the address set in
// Settings (a phone can't reach "localhost" — that's the phone itself).
const config: CapacitorConfig = {
  appId: 'app.aura.local',
  appName: 'aura',
  webDir: 'dist',
  // The local API is plain HTTP on your LAN, so both platforms must allow cleartext to it.
  // This is a local-only app; a public deployment would use HTTPS and drop these.
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'http',
    // Allow the WebView to call your machine over the LAN.
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
