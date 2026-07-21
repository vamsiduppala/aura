import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  // The engine is a source-TS workspace package; let Vite transpile it.
  optimizeDeps: { include: ['astronomia'] },
});
