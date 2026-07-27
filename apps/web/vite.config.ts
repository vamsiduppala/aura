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
  // `allowedHosts` lets hosted dev environments (Replit, Codespaces, ngrok) proxy the dev server;
  // without it Vite rejects the forwarded Host header with "Blocked request".
  server: { port: 5173, host: true, allowedHosts: true },
  // The engine is a source-TS workspace package; let Vite transpile it.
  optimizeDeps: { include: ['astronomia'] },
  build: {
    // astronomia's VSOP87 ephemeris tables are inherently ~1.1MB and change ~never, so we isolate
    // them into their own long-cached chunk (below) rather than shrink them; raise the size-warning
    // threshold past that known chunk so the build output stays clean.
    chunkSizeWarningLimit: 1200,
    // Split the heavy, rarely-changing vendors into their own chunks. astronomia's VSOP87 tables
    // (imported deeply as `astronomia/data/vsop87B*`) are the bulk, so match the whole package path
    // — the array form only caught the bare entry and left the data in the app chunk.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/astronomia')) return 'astronomia';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          return undefined;
        },
      },
    },
  },
});
