export type Screen = 'onboarding' | 'audit' | 'today' | 'reading' | 'checkin' | 'forecast' | 'blueprint' | 'settings' | 'support' | 'chat';

const TABS: { key: Screen; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'chat', label: 'Mentor' },
  { key: 'blueprint', label: 'Blueprint' },
];

function readsLabel(n: number): string { return `${n} ${n === 1 ? 'reading' : 'readings'}`; }

/** Desktop left navigation. */
export function Sidebar({ screen, go, totalReads, onSettings }: {
  screen: Screen; go: (s: Screen) => void; totalReads: number; onSettings: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="glyph" /> aura</div>
      {TABS.map((t) => (
        <button key={t.key} className={`navlink${screen === t.key ? ' on' : ''}`} onClick={() => go(t.key)}>
          <span className="dot" />{t.label}
        </button>
      ))}
      <button className={`navlink${screen === 'settings' ? ' on' : ''}`} onClick={onSettings}>
        <span className="dot" />Settings
      </button>
      <div className="side-foot">
        {totalReads > 0 ? <div className="side-reads">{readsLabel(totalReads)}</div> : null}
        Private. On-device.<br />Delete anytime.
      </div>
    </aside>
  );
}

/** Mobile top bar (brand + settings + count). */
export function TopBar({ totalReads, onSettings }: { totalReads: number; onSettings: () => void }) {
  return (
    <div className="topbar">
      <div className="brand"><span className="glyph" /> aura</div>
      <div className="tb-right">
        {totalReads > 0 ? <span>{readsLabel(totalReads)}</span> : null}
        <button onClick={onSettings} title="Settings & privacy"
          style={{ background: 'none', border: 'none', color: 'var(--mist-3)', cursor: 'pointer', fontSize: 16 }}>⚙</button>
      </div>
    </div>
  );
}

/** Mobile bottom tab bar. */
export function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <div className="bottomnav">
      {TABS.map((t) => (
        <button key={t.key} className={screen === t.key ? 'on' : ''} onClick={() => go(t.key)}>
          <span className="ndot" />{t.label}
        </button>
      ))}
    </div>
  );
}
