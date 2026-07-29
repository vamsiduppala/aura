import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android + iOS wrap the same `dist/` the website serves — one codebase, three surfaces.
 * Run `npm run cap:sync` after any web change, or the native apps keep serving the last
 * build they were given.
 */
const config: CapacitorConfig = {
  appId: 'app.vimshottari',
  appName: 'Vimshottari',
  webDir: 'dist',
  // The status bar sits over the app, and index.html already reserves it with
  // env(safe-area-inset-top). Dark background so a cold launch doesn't flash white.
  backgroundColor: '#1B1D24',
  android: {
    // Text renders at the OS's own scale, so 200% Dynamic Type is a real case, not a
    // theoretical one. The layouts are built with min-height for exactly this reason.
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#1B1D24',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1B1D24',
      overlaysWebView: true,
    },
  },
};

export default config;
