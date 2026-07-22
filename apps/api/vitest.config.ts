import { defineConfig } from 'vitest/config';

// node:sqlite is a newer Node builtin that Vite's default resolver doesn't know about.
// Mark it (and node: builtins) external so the test runner uses Node's real module.
export default defineConfig({
  test: {
    environment: 'node',
    server: { deps: { external: [/^node:/] } },
  },
  ssr: { external: ['node:sqlite'] },
});
