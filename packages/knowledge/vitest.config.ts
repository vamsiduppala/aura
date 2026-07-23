import { defineConfig } from 'vitest/config';

// Pure structured-data + calculation library — plain node environment, no DOM. (Matches the
// implicit default `vitest run` already used; made explicit so the root workspace file can
// reference it alongside the other projects.)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
