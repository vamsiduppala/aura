// The standing rule of this project, as an executable guard: no mock, static, demo or
// placeholder data on any user-facing path. This suite fails if a future change seeds a
// birth date, ships a sample chart, or lets a screen render numbers nobody entered.

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { App } from '../App';
import { useVim } from '../store/useVim';

const SRC = join(__dirname, '..');

/** Every .ts/.tsx file under src/, excluding the test directory itself. */
function sourceFiles(dir = SRC): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'test') continue;
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe('no mock data on any user-facing path', () => {
  beforeEach(() => {
    localStorage.clear();
    useVim.getState().deleteEverything();
  });
  afterEach(cleanup);

  it('starts with no birth details and no chart', () => {
    const s = useVim.getState();
    expect(s.birth).toBeNull();
    expect(s.chart).toBeNull();
    // The most conservative confidence, so nothing can claim precision by default.
    expect(s.confidence).toBe('unknown');
  });

  it('a first-run app shows the welcome screen, not a chart', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent)
      .toMatch(/which way the wind is blowing/i);
    // No time-left pill can exist before a chart does.
    expect(document.querySelector('.time-pill')).toBeNull();
  });

  it('the date, time and place inputs all start empty', async () => {
    useVim.getState().go({ kind: 'onboarding' });
    render(<App />);
    // Step 1 is the name; it is empty, and Continue is gated on it.
    const name = screen.getByLabelText('Your name') as HTMLInputElement;
    expect(name.value).toBe('');
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('no source file outside tests contains a hardcoded birth date or coordinate pair', () => {
    // A pre-filled birth date once meant a new user silently got a stranger's chart.
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, 'utf8');
      // ISO dates like 1994-03-14. Allowed: the date-input bounds, which are computed.
      for (const m of text.matchAll(/\b(19|20)\d{2}-\d{2}-\d{2}\b/g)) {
        offenders.push(`${file}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no source file outside tests defines sample/demo/placeholder fixtures', () => {
    const banned = /\b(SAMPLE|DEMO|MOCK|FIXTURE|DUMMY|FAKE)_[A-Z_]+\s*[:=]/;
    const offenders = sourceFiles()
      .filter((f) => banned.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('vocabulary', () => {
  it('no banned interpretive word appears in shipped copy', () => {
    // These either frighten people or make the app read as a temple pamphlet. Say what is
    // happening instead. `PLANET_BLOCK.saturn` says "delay reads as failure" rather than
    // "Saturn is a malefic".
    const banned = [
      'malefic', 'benefic', 'auspicious', 'inauspicious', 'dosha',
      'cursed', 'unlucky', 'destiny',
    ];
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, 'utf8');
      // Strip line and block comments: the ban is on what users read, and the engine's
      // own API names (functionalPolarity, isBenefic) are discussed in comments.
      const copy = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const word of banned) {
        if (new RegExp(`\\b${word}`, 'i').test(copy)) offenders.push(`${file}: ${word}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the superseded Era/Chapter/Season ladder is gone from shipped copy', () => {
    // The royal court replaced it. Two ladders on one screen is the fastest way to make
    // the vocabulary unlearnable.
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const copy = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const word of ['Era', 'Chapter', 'Tailwind', 'Headwind']) {
        if (new RegExp(`['"\`][^'"\`]*\\b${word}\\b`).test(copy)) {
          offenders.push(`${file}: ${word}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
