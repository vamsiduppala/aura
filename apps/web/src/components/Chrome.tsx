export type Screen = 'onboarding' | 'audit' | 'today' | 'reading' | 'checkin' | 'forecast' | 'blueprint' | 'settings' | 'support' | 'chat' | 'account';

const TABS: { key: Screen; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'chat', label: 'Mentor' },
  { key: 'blueprint', label: 'Blueprint' },
];

function readsLabel(n: number): string { return `${n} ${n === 1 ? 'reading' : 'readings'}`; }

/** Desktop left navigation. The account block sits at the very bottom: who you are, then sign-out. */
export function Sidebar({ screen, go, totalReads, onSettings, userName, signedIn, onAccount, onLogout, onSignIn }: {
  screen: Screen; go: (s: Screen) => void; totalReads: number; onSettings: () => void;
  userName: string; signedIn: boolean; onAccount: () => void; onLogout: () => void; onSignIn: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="glyph" /> aura</div>
      {TABS.map((t) => (
        <button key={t.key} className={`navlink${screen === t.key ? ' on' : ''}`} onClick={() => go(t.key)}
          aria-current={screen === t.key ? 'page' : undefined}>
          <span className="dot" />{t.label}
        </button>
      ))}
      <button className={`navlink${screen === 'settings' ? ' on' : ''}`} onClick={onSettings}
        aria-current={screen === 'settings' ? 'page' : undefined}>
        <span className="dot" />Settings
      </button>

      <div className="side-foot">
        {totalReads > 0 ? <div className="side-reads">{readsLabel(totalReads)}</div> : null}
        <div className="side-priv">Private. On-device.<br />Delete anytime.</div>

        <button className={`side-acct${screen === 'account' ? ' on' : ''}`} onClick={onAccount}
          aria-current={screen === 'account' ? 'page' : undefined} title="Account & birth details">
          <span className="side-avatar" aria-hidden>{userName.slice(0, 1).toUpperCase()}</span>
          <span className="side-acct-txt">
            <span className="side-acct-name">{userName}</span>
            <span className="side-acct-sub">{signedIn ? 'View account' : 'On this device'}</span>
          </span>
        </button>
        <button className="side-signout" onClick={signedIn ? onLogout : onSignIn}>
          {signedIn ? 'Sign out' : 'Sign in'}
        </button>
      </div>
    </aside>
  );
}

/** Mobile top bar (brand + account + settings + count). */
export function TopBar({ totalReads, onSettings, userName, onAccount }: {
  totalReads: number; onSettings: () => void; userName: string; onAccount: () => void;
}) {
  return (
    <div className="topbar">
      <div className="brand"><span className="glyph" /> aura</div>
      <div className="tb-right">
        {totalReads > 0 ? <span>{readsLabel(totalReads)}</span> : null}
        <button onClick={onAccount} title={`${userName} — account & birth details`} aria-label="Account"
          className="tb-avatar">{userName.slice(0, 1).toUpperCase()}</button>
        <button onClick={onSettings} title="Settings & privacy" aria-label="Settings"
          style={{ background: 'none', border: 'none', color: 'var(--mist-3)', cursor: 'pointer', fontSize: 16 }}>⚙</button>
      </div>
    </div>
  );
}

/** Mobile bottom tab bar. */
export function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <nav className="bottomnav" aria-label="Primary">
      {TABS.map((t) => (
        <button key={t.key} className={screen === t.key ? 'on' : ''} onClick={() => go(t.key)}
          aria-current={screen === t.key ? 'page' : undefined}>
          <span className="ndot" />{t.label}
        </button>
      ))}
    </nav>
  );
}
