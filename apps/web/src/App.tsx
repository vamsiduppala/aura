import { useAura } from './store/useAura';
import { Onboarding } from './screens/Onboarding';
import { Audit } from './screens/Audit';
import { Today } from './screens/Today';
import { Reading } from './screens/Reading';
import { Checkin as CheckinScreen } from './screens/Checkin';
import { Forecast } from './screens/Forecast';
import { Chat } from './screens/Chat';
import { Blueprint } from './screens/Blueprint';
import { Settings } from './screens/Settings';
import { Support } from './screens/Support';
import { Sidebar, TopBar, BottomNav, type Screen } from './components/Chrome';

const WIDE: Screen[] = ['today', 'forecast', 'chat', 'blueprint'];

export function App() {
  const s = useAura();
  const { aura, now, screen, chart, daily, goalArea, goalName, reads } = s;

  const inApp = !!chart && screen !== 'onboarding' && screen !== 'support' && screen !== 'audit';
  const showBottomNav = inApp && WIDE.includes(screen);
  const narrow = !WIDE.includes(screen);

  let body: React.ReactNode;
  if (screen === 'support') {
    body = <Support onBack={() => s.go(s.birth ? 'today' : 'onboarding')} />;
  } else if (screen === 'settings') {
    body = <Settings place={s.birth?.place ?? 'this device'} onDelete={s.deleteAll} onBack={() => s.go('today')} />;
  } else if (s.error) {
    body = (
      <div className="view" style={{ paddingTop: 40 }}>
        <div className="serif-h" style={{ fontSize: 24, marginBottom: 12 }}>Something didn’t compute.</div>
        <div className="disclaimer" style={{ textAlign: 'left', padding: 0 }}>{s.error}</div>
        <button className="btn" style={{ marginTop: 20, maxWidth: 240 }} onClick={s.deleteAll}>Start over</button>
      </div>
    );
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
    body = <Forecast aura={aura} chart={chart} now={now} goalArea={goalArea} major={daily.input.majorEnergy} />;
  } else if (screen === 'chat') {
    body = <Chat aura={aura} chart={chart} now={now} />;
  } else {
    body = <Blueprint aura={aura} chart={chart} goalName={goalName} />;
  }

  return (
    <div className="app">
      {inApp ? <Sidebar screen={screen} go={s.go} totalReads={reads.count} onSettings={() => s.go('settings')} /> : null}
      <main className="main">
        {inApp ? <TopBar totalReads={reads.count} onSettings={() => s.go('settings')} /> : null}
        <div className={`content${narrow ? ' narrow' : ''}`}>{body}</div>
        {showBottomNav ? <BottomNav screen={screen} go={s.go} /> : null}
      </main>
    </div>
  );
}
