export type Screen = 'onboarding' | 'today' | 'reading' | 'checkin' | 'forecast' | 'blueprint' | 'settings' | 'support';

export function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <div className="dots"><span>••</span><span className="batt" /></div>
    </div>
  );
}

export function Wordmark({ right }: { right?: React.ReactNode }) {
  return (
    <div className="brandbar">
      <div className="wordmark"><span className="glyph" /> aura</div>
      {right ? <div className="barmeta">{right}</div> : null}
    </div>
  );
}

const TABS: { key: Screen; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'blueprint', label: 'Blueprint' },
];

export function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <div className="nav">
      {TABS.map((t) => (
        <button key={t.key} className={screen === t.key ? 'on' : ''} onClick={() => go(t.key)}>
          <span className="ndot" />
          {t.label}
        </button>
      ))}
    </div>
  );
}
