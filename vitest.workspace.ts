// Vitest workspace — so a bare `npx vitest` at the repo root runs every project with its OWN
// config (web needs the jsdom environment; the engine/knowledge/api run under node). Without
// this, a root-level run flattens all suites into one node environment and the web component
// tests fail with "document is not defined". `npm test` (which invokes each workspace's script)
// is unaffected either way, but this keeps the ad-hoc root command honest too.
export default [
  'packages/engine/vitest.config.ts',
  'packages/knowledge/vitest.config.ts',
  'packages/rules/vitest.config.ts',
  'apps/web/vitest.config.ts',
  'apps/api/vitest.config.ts',
  // The new Vimshottari app keeps its test config inside vite.config.ts.
  'apps/vim/vite.config.ts',
];
