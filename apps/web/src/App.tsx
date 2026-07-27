import { useEffect, useState } from 'react';
import { useAura } from './store/useAura';
import { Login } from './screens/Login';
import { Onboarding } from './screens/Onboarding';
import { Audit } from './screens/Audit';
import { Today } from './screens/Today';
import { Reading } from './screens/Reading';
import { Checkin as CheckinScreen } from './screens/Checkin';
import { Forecast } from './screens/Forecast';
import { Chat } from './screens/Chat';
import { Blueprint } from './screens/Blueprint';
import { Settings } from './screens/Settings';
import { Account } from './screens/Account';
import { Support } from './screens/Support';
import { Sidebar, TopBar, BottomNav, type Screen } from './components/Chrome';
import { downloadReport } from './services/report';
import { TodaySkeleton, ErrorState } from './components/States';
import { CommandPalette } from './components/CommandPalette';
import { screenFromHash, writeHash, onRouteChange, isRoutable } from './services/routing';

const WIDE: Screen[] = ['today', 'forecast', 'chat', 'blueprint'];

export function App() {
  const s = useAura();
  const { aura, now, screen, chart, daily, goalArea, goalName, displayName, reads, authStatus } = s;

  // What the app calls you: your own name, else the email local-part, else "Guest".
  const userName = displayName.trim() || s.user?.email.split('@')[0] || 'Guest';
  const account = s.user ? { email: s.user.email } : ('guest' as const);
  const onDownload = () => {
    if (!chart || !s.birth) return;
    void downloadReport({ aura, chart, birth: s.birth, displayName: userName, goalName, now });
  };

  // Verify any stored session token with the local API once on mount.
  useEffect(() => { if (authStatus === 'loading') void s.initAuth(); }, [authStatus, s]);

  // Routing is only meaningful once there's a chart to look at. Computed here (rather than reusing
  // `inApp` below) because hooks must run unconditionally, before this component's early returns.
  const routable = !!chart && screen !== 'onboarding' && screen !== 'support' && screen !== 'audit';

  // Keep the URL and the current screen in step, so Back/Forward, refresh and bookmarks all work.
  useEffect(() => {
    if (!routable) return;
    const initial = screenFromHash();
    if (initial && initial !== screen) s.go(initial);
    else writeHash(screen, true);
    // Only on first entry into the app shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routable]);
  useEffect(() => { if (routable && isRoutable(screen)) writeHash(screen); }, [screen, routable]);
  useEffect(() => onRouteChange((next) => { if (next !== screen) s.go(next); }), [screen, s]);

  // Cmd/Ctrl-K opens the palette from anywhere — the convention every tool-shaped app now shares.
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (authStatus === 'loading') {
    return (
      <div className="app"><main className="main"><div className="content">
        <TodaySkeleton />
      </div></main></div>
    );
  }
  if (authStatus === 'anon') {
    return (
      <div className="app"><main className="main"><div className="content narrow">
        <Login busy={s.authBusy} error={s.authError} onLogin={s.doLogin} onRegister={s.doRegister} onGuest={s.continueAsGuest} />
      </div></main></div>
    );
  }

  const inApp = !!chart && screen !== 'onboarding' && screen !== 'support' && screen !== 'audit';
  const showBottomNav = inApp && WIDE.includes(screen);
  const narrow = !WIDE.includes(screen);

  let body: React.ReactNode;
  if (screen === 'support') {
    body = <Support onBack={() => s.go(s.birth ? 'today' : 'onboarding')} />;
  } else if (screen === 'settings') {
    body = <Settings place={s.birth?.place ?? 'this device'}
      account={account} canEdit={!!chart}
      onDelete={s.deleteAll} onBack={() => s.go('today')} onLogout={s.logout} onSignIn={s.showLogin}
      onEdit={() => s.go('account')} onAccount={() => s.go('account')} />;
  } else if (screen === 'account' && s.birth) {
    body = <Account account={account} displayName={displayName} birth={s.birth}
      goalArea={goalArea} goalName={goalName} memberSince={s.user?.createdAt}
      onSave={s.saveAccount} onBack={() => s.go('today')} onLogout={s.logout}
      onSignIn={s.showLogin} onDelete={s.deleteAll} onDownload={onDownload} />;
  } else if (s.error) {
    body = (
      <ErrorState detail={s.error} onRetry={() => s.go('account')} onReset={s.deleteAll} />
    );
  } else if (s.editing && chart) {
    body = <Onboarding onComplete={s.onboard} editing
      initial={{ birth: s.birth!, goalArea, goalName, displayName }} />;
  } else if (!chart || !daily) {
    body = <Onboarding onComplete={s.onboard} />;
  } else if (screen === 'audit') {
    body = <Audit aura={aura} chart={chart} now={now} goalArea={goalArea} onContinue={() => s.go('today')} />;
  } else if (screen === 'today') {
    body = <Today input={daily.input} now={now} phases={aura.phaseWindows(daily.input, chart, now)}
      todayLine={daily.todayLine} remedyShort={daily.remedyShort}
      onOpenReading={s.openReading} onCheckin={() => s.go('checkin')} />;
  } else if (screen === 'reading') {
    body = <Reading reading={daily.reading} edge={daily.edge} now={now} onBack={() => s.go('today')} />;
  } else if (screen === 'checkin') {
    body = <CheckinScreen major={daily.input.majorEnergy} passing={daily.input.passingEnergy}
      onDone={(c) => { s.setCheckin(c); s.go('reading'); }}
      onSkip={() => { s.setCheckin(undefined); s.go('reading'); }} />;
  } else if (screen === 'forecast') {
    body = <Forecast aura={aura} chart={chart} now={now} goalArea={goalArea} major={daily.input.majorEnergy} passing={daily.input.passingEnergy} />;
  } else if (screen === 'chat') {
    body = <Chat aura={aura} chart={chart} now={now} goalArea={goalArea} userKey={s.user ? `u${s.user.id}` : "guest"} pendingQuestion={s.pendingQuestion} onConsumedQuestion={s.clearPendingQuestion} />;
  } else {
    body = <Blueprint aura={aura} chart={chart} goalName={goalName} onDownload={onDownload} />;
  }

  return (
    <div className="app">
      {inApp ? <Sidebar screen={screen} go={s.go} totalReads={reads.count} onSettings={() => s.go('settings')}
        userName={userName} signedIn={!!s.user} onAccount={() => s.go('account')} onLogout={s.logout} onSignIn={s.showLogin} onSearch={() => setPaletteOpen(true)} /> : null}
      <main className="main">
        {inApp ? <TopBar totalReads={reads.count} onSettings={() => s.go('settings')} userName={userName} onAccount={() => s.go('account')} /> : null}
        <div className={`content${narrow ? ' narrow' : ''}${screen === 'blueprint' ? ' bp-content' : ''}`}>{body}</div>
        {showBottomNav ? <BottomNav screen={screen} go={s.go} /> : null}
      </main>
      {inApp ? (
        <CommandPalette
          open={paletteOpen} onClose={() => setPaletteOpen(false)}
          go={s.go} chart={chart} onAsk={s.askMentorAbout}
        />
      ) : null}
    </div>
  );
}
