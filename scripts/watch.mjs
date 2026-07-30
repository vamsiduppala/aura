#!/usr/bin/env node
// The watcher. Appends a timestamped entry to WATCHER.md with the REAL state of the repo,
// so a fresh session can pick up mid-task without reading a line of code.
//
//   npm run watch -- "what I just did"          append a note + captured state
//   npm run watch -- --full "what I just did"   also run typecheck + tests (slow, ~2 min)
//   npm run watch:install                       install the post-commit hook
//
// Every entry captures what the repo can be asked, not what the author remembers: HEAD,
// the dirty file list, which parts are marked done, and — with --full — whether the tree
// actually typechecks and passes. A note that says "done" beside a red test run is a lie
// the file will tell on you for.

import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'WATCHER.md');

const sh = (cmd, fallback = '') => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
};

// ── the post-commit hook ────────────────────────────────────────────────────
// Git hooks live in .git/hooks, which is NOT committed, so every clone must install
// its own. That is why this is a command and not a file in the repo.
if (process.argv.includes('--install-hook')) {
  const hookPath = join(ROOT, '.git', 'hooks', 'post-commit');
  writeFileSync(
    hookPath,
    '#!/bin/sh\n'
    + '# Installed by `npm run watch:install`. Appends every commit to WATCHER.md.\n'
    + '# Uses --no-verify-safe: it must never re-enter the hook or block the commit.\n'
    + 'node "$(git rev-parse --show-toplevel)/scripts/watch.mjs" --from-hook || true\n',
    'utf8',
  );
  try { chmodSync(hookPath, 0o755); } catch { /* Windows ignores the mode */ }
  console.log('installed .git/hooks/post-commit → appends every commit to WATCHER.md');
  process.exit(0);
}

const fromHook = process.argv.includes('--from-hook');
const full = process.argv.includes('--full');
const note = process.argv.slice(2).filter((a) => !a.startsWith('--')).join(' ')
  || (fromHook ? sh('git log -1 --pretty=%s') : '(no note given)');

// ── captured state ──────────────────────────────────────────────────────────
// The format string contains a space, so it must be quoted or git sees two arguments and
// silently returns nothing — which is how the first entry in this file got a blank HEAD.
const head = sh('git log -1 --pretty="%h %s"');
const dirty = sh('git status --porcelain').split('\n').filter(Boolean);
const branch = sh('git rev-parse --abbrev-ref HEAD');

// Which parts are done, read out of GEMINI.md rather than trusted from memory.
const gemini = existsSync(join(ROOT, 'GEMINI.md'))
  ? readFileSync(join(ROOT, 'GEMINI.md'), 'utf8') : '';
const parts = [1, 2, 3, 4].map((n) => {
  const row = new RegExp(`\\|\\s*\\*?\\*?${n}\\*?\\*?\\s*\\|[^\\n]*`).exec(gemini)?.[0] ?? '';
  const done = /\*\*DONE\*\*/.test(row);
  const next = /\*\*NEXT\*\*|IN PROGRESS/.test(row);
  return `${n}:${done ? 'done' : next ? 'in-progress' : 'todo'}`;
}).join(' · ');

let verify = '_not run (use `--full`)_';
if (full) {
  const tc = sh('npm run typecheck 2>&1', 'FAILED');
  const tcOk = !/error TS/.test(tc) && tc !== 'FAILED';
  const tests = sh('npm test 2>&1', 'FAILED');
  const counts = [...tests.matchAll(/Tests\s+(\d+) passed/g)].map((m) => Number(m[1]));
  const failed = /Tests\s+\d+ failed|FAIL/.test(tests);
  const total = counts.reduce((a, b) => a + b, 0);
  verify = `typecheck ${tcOk ? 'clean' : '**FAILING**'} · tests ${failed ? '**FAILING**' : `${total} passed`}`;
}

const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
const agent = process.env.VIM_AGENT ?? (fromHook ? 'commit' : 'Claude Opus 5');

const entry = [
  '',
  `### ${stamp} · ${agent}${fromHook ? ' · commit' : ''}`,
  `**${note}**`,
  '',
  `- HEAD: \`${head}\` on \`${branch}\``,
  `- Parts: ${parts}`,
  `- Uncommitted: ${dirty.length === 0 ? 'nothing — tree clean' : `${dirty.length} file(s)\n${dirty.map((d) => `  - \`${d}\``).join('\n')}`}`,
  `- Verify: ${verify}`,
  '',
].join('\n');

appendFileSync(FILE, entry, 'utf8');
console.log(`watcher ← ${note}`);
console.log(`  HEAD ${head} | parts ${parts} | dirty ${dirty.length}`);
