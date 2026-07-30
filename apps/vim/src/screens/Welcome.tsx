// One screen, one promise. No signup yet — the chart comes first, the account second.

import { Pressable } from '../components/neu';
import { useVim } from '../store/useVim';

export function Welcome() {
  const { go, showSignIn, authStatus } = useVim();
  return (
    <div className="page welcome">
      <div className="welcome-mark" aria-hidden>
        {/* Five rings, drawn once, standing in for the Wheel the user hasn't earned yet.
            Deliberately empty: no fill, because there is no chart to fill it with. */}
        <svg viewBox="0 0 120 120" width="120" height="120">
          {[56, 46, 36, 26, 16].map((r, i) => (
            <circle
              key={r}
              cx="60" cy="60" r={r}
              fill="none"
              stroke="var(--surface-track-deep)"
              strokeWidth={5 - i * 0.5}
            />
          ))}
        </svg>
      </div>

      <h1 className="t-page-title welcome-title">Know which way the wind is blowing.</h1>
      <p className="t-sub welcome-sub">
        Vedic timing, in plain English. Five rulers hold your chart at once, at five
        different speeds. Find out who's in office right now.
      </p>

      <Pressable variant="primary" onClick={() => go({ kind: 'onboarding' })}>
        Find out
      </Pressable>

      {authStatus !== 'guest' && (
        <button type="button" className="btn-flat" onClick={showSignIn}>
          I already have an account
        </button>
      )}

      <p className="welcome-foot">
        Your birth details stay on this device unless you choose to save them.
      </p>
    </div>
  );
}
