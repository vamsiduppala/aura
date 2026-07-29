// vitest/config re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    // Offline-first: precache the shell so the installed PWA opens and computes the whole
    // Timeline with no network. That isn't a nicety here — the chart, the court and every
    // boundary are computed on-device, so there is nothing legitimate to wait for.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // public/manifest.webmanifest is ours
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // the ephemeris chunk is ~1.4MB
      },
      devOptions: { enabled: false }, // never fight HMR
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // 5174 so this can run beside the older aura web app on 5173.
  // allowedHosts lets hosted dev environments (Replit, Codespaces, ngrok) proxy the dev server.
  server: { port: 5174, host: true, allowedHosts: true },
  optimizeDeps: { include: ['astronomia'] },
  build: {
    // astronomia's VSOP87 tables are inherently ~1.1MB and change ~never; isolate them
    // into their own long-cached chunk rather than try to shrink them.
    chunkSizeWarningLimit: 1200,
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
