import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from '../screens/Onboarding';

// The birthplace is a type-ahead against a free geocoder; the user never types coordinates.
// We stub the network so the test is deterministic and offline.
const HIT = {
  id: 1, name: 'Hyderabad', latitude: 17.38405, longitude: 78.45636,
  timezone: 'Asia/Kolkata', country: 'India', admin1: 'Telangana',
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ results: [HIT] }), { status: 200 }),
  ));
});
afterEach(() => vi.restoreAllMocks());

/** Type a city and choose the first suggestion. */
async function pickPlace(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Birthplace'), 'Hyderabad');
  const opt = await screen.findByRole('button', { name: /Hyderabad/i }, { timeout: 3000 });
  await user.click(opt);
}

describe('Onboarding — birthplace lookup', () => {
  it('resolves coordinates and the historical UTC offset from the chosen city', async () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Birth date'), '1993-06-15');
    await user.type(screen.getByLabelText('Birth time'), '14:35');
    await pickPlace(user);

    await waitFor(() => expect(screen.getByRole('button', { name: /Read my energy/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /Read my energy/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const birth = onComplete.mock.calls[0]![0];
    expect(birth.place).toMatch(/Hyderabad/);
    expect(birth.lat).toBeCloseTo(17.384, 2);
    expect(birth.lng).toBeCloseTo(78.456, 2);
    expect(birth.tzOffsetMinutes).toBe(330); // Asia/Kolkata = +5:30, derived, never typed
  });

  it('cannot submit until a real place has been chosen', async () => {
    render(<Onboarding onComplete={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Birth date'), '1993-06-15');
    await user.type(screen.getByLabelText('Birth time'), '14:35');
    // Free text alone is not a place — the button stays disabled until a suggestion is picked.
    await user.type(screen.getByLabelText('Birthplace'), 'Hyderabad');
    expect(screen.getByRole('button', { name: /Read my energy/i })).toBeDisabled();
    await pickPlace(user);
    await waitFor(() => expect(screen.getByRole('button', { name: /Read my energy/i })).toBeEnabled());
  });

  it('rejects a future birth date', async () => {
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);
    const user = userEvent.setup();
    const future = new Date(Date.now() + 366 * 86_400_000).toISOString().slice(0, 10);
    await user.type(screen.getByLabelText('Birth time'), '14:35');
    await user.type(screen.getByLabelText('Birth date'), future);
    await pickPlace(user);
    expect(screen.getByRole('button', { name: /Read my energy/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Read my energy/i }));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
