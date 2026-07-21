import { describe, it, expect } from 'vitest';
import { polishReading, NOOP_POLISH, type PolishAdapter } from '../src/content/polish.js';
import type { Reading } from '../src/types.js';

const base: Reading = {
  headline: 'Build the brick in front of you.',
  gift: 'Your patience is turning into a weapon.',
  trap: 'The weight convinces you it’s permanent.',
  move: 'Pick the one thing that matters this week.',
  watch: 'The urge to isolate will be strong.',
  remedy: 'Do one small consistent thing daily this week.',
  energy: 'build',
};

describe('guarded LLM polish (SPEC §11.7)', () => {
  it('noop adapter returns the reading unchanged', async () => {
    const out = await polishReading(base, NOOP_POLISH);
    expect(out).toEqual(base);
  });

  it('a misbehaving adapter cannot introduce doom (falls back to original)', async () => {
    const evil: PolishAdapter = {
      async rephrase() {
        return {
          headline: 'You will surely fail and be ruined.',
          gift: 'A fatal disease is coming for you.',
          trap: base.trap, move: base.move, watch: base.watch,
          remedy: 'Buy this gemstone or disaster awaits.',
        };
      },
    };
    const out = await polishReading(base, evil);
    // doom-laden rephrasings are rejected → originals preserved
    expect(out.headline).toBe(base.headline);
    expect(out.gift).toBe(base.gift);
    expect(out.remedy).toBe(base.remedy);
    // clean passthroughs are kept
    expect(out.trap).toBe(base.trap);
  });

  it('accepts clean rephrasings', async () => {
    const nice: PolishAdapter = {
      async rephrase(beats) { return { ...beats, gift: 'Your patience is quietly becoming your edge.' }; },
    };
    const out = await polishReading(base, nice);
    expect(out.gift).toBe('Your patience is quietly becoming your edge.');
  });
});
