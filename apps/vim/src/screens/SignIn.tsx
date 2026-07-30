// Sign in / create an account against the local API. Both paths degrade honestly: if the
// server can't be reached, the app says so and offers to carry on device-only, because
// every screen except Mentor works without it.

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Inset, Pressable } from '../components/neu';
import { useVim } from '../store/useVim';

export function SignIn() {
  const { doLogin, doRegister, authBusy, authError, continueOnDevice, go } = useVim();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const ready = /.+@.+\..+/.test(email) && password.length >= 8;
  const submit = () => {
    if (!ready || authBusy) return;
    void (mode === 'login' ? doLogin(email, password) : doRegister(email, password));
  };

  return (
    <div className="page onboard">
      <header className="onboard-head">
        <Pressable variant="flat" aria-label="Back" onClick={() => go({ kind: 'welcome' })}>
          <ArrowLeft size={20} aria-hidden />
        </Pressable>
      </header>

      <section className="onboard-step">
        <h1 className="t-page-title">
          {mode === 'login' ? 'Welcome back.' : 'Save your chart.'}
        </h1>
        <p className="t-sub onboard-hint">
          {mode === 'login'
            ? 'Your chart and your plans are waiting.'
            : 'An account keeps your chart across devices. Your birth details are never used for anything else.'}
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="stack"
          style={{ gap: 12 }}
        >
          <Inset className="field">
            <input
              className="field-input"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
          </Inset>
          <Inset className="field">
            <input
              className="field-input"
              type="password"
              value={password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
          </Inset>
          {mode === 'register' && password.length > 0 && password.length < 8 && (
            <p className="field-note">At least 8 characters.</p>
          )}
          {authError && <p className="field-error" role="alert">{authError}</p>}
          <Pressable variant="primary" disabled={!ready || authBusy} onClick={submit}>
            {authBusy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Pressable>
        </form>

        <button
          type="button"
          className="btn-flat"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Create an account instead' : 'I already have an account'}
        </button>
        <button type="button" className="btn-flat" onClick={continueOnDevice}>
          Continue on this device only
        </button>
      </section>
    </div>
  );
}
