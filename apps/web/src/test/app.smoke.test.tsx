import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { useAura } from '../store/useAura';

// Integration smoke test: mounts the real app (real engine, real chart math) and drives
// the whole flow, catching runtime crashes in any screen that a build won't surface.
beforeEach(() => { localStorage.clear(); useAura.getState().reset(); });

describe('App smoke — the full flow renders without crashing', () => {
  it('onboarding → audit → today → forecast → mentor → blueprint', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Auth gate → continue on this device (guest / local mode)
    await user.click(screen.getByRole('button', { name: /Continue on this device only/i }));

    // Onboarding
    expect(screen.getByText(/No charts to learn/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Read my energy/i }));

    // Audit ("Prove It" retrospective) — engine run backwards
    await waitFor(() => expect(screen.getByText(/Before we look ahead/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Show me today/i }));

    // Today
    await waitFor(() => expect(screen.getByText(/Major energy/i)).toBeInTheDocument());

    // Forecast (nav renders in both sidebar + bottom bar under jsdom → take the first)
    await user.click(screen.getAllByRole('button', { name: /^Forecast$/i })[0]!);
    await waitFor(() => expect(screen.getByText(/% through/i)).toBeInTheDocument());

    // Cosmic Mentor chat
    await user.click(screen.getAllByRole('button', { name: /^Mentor$/i })[0]!);
    await waitFor(() => expect(screen.getByText(/Cosmic Mentor/i)).toBeInTheDocument());

    // Blueprint (+ born gifts)
    await user.click(screen.getAllByRole('button', { name: /^Blueprint$/i })[0]!);
    await waitFor(() => expect(screen.getByRole('heading', { name: /Your chart/i })).toBeInTheDocument());
  }, 20000);

  it('a crisis in the goal field routes to support, not a reading', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Continue on this device only/i }));
    const goal = screen.getByPlaceholderText(/my goal/i);
    await user.clear(goal);
    await user.type(goal, 'i want to end my life');
    await user.click(screen.getByRole('button', { name: /Read my energy/i }));
    await waitFor(() => expect(screen.getByText(/not alone in this/i)).toBeInTheDocument());
  }, 20000);
});
