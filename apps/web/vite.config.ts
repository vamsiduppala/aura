import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    // Offline-first (Q-06): precache the app shell so the installed PWA loads + runs
    // fully offline. Auto-updates on new deploys. Disabled in dev (won't touch HMR).
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we ship our own public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // the engine chunk is ~1.4MB
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, host: true },
  // The engine is a source-TS workspace package; let Vite transpile it.
  optimizeDeps: { include: ['astronomia'] },
});
