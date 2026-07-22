import { useMemo, useState } from 'react';
import {
  Aura, AstronomiaEphemeris, detectCrisis,
  type BirthData, type Chart, type Checkin, type DailyBundle, type LifeArea,
} from '@aura/engine';
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
import { loadProfile, saveProfile, loadReads, bumpReads, clearAll, type ReadsState } from './services/storage';

// The engine facade — one dependency-injected service the UI talks to (offline ephemeris).
const aura = new Aura(new AstronomiaEphemeris());

const WIDE: Screen[] = ['today', 'forecast', 'chat', 'blueprint'];

export function App() {
  const saved = useMemo(loadProfile, []);
  const [screen, setScreen] = useState<Screen>(saved ? 'today' : 'onboarding');
  const [birth, setBirth] = useState<BirthData | null>(saved?.birth ?? null);
  const [goalArea, setGoalArea] = useState<LifeArea>(saved?.goalArea ?? 'career');
  const [goalName, setGoalName] = useState(saved?.goalName ?? 'my goal');
  const [checkin, setCheckin] = useState<Checkin | undefined>();
  const [reads, setReads] = useState<ReadsState>(loadReads);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const chart: Chart | null = useMemo(() => {
    if (!birth) return null;
    try { return aura.chart(birth); } catch (e) { setError(String(e)); return null; }
  }, [birth]);

  const daily: DailyBundle | null = useMemo(() => {
    if (!chart) return null;
    try { return aura.daily(chart, now, { goalArea, ...(checkin ? { checkin } : {}) }); }
    catch (e) { setError(String(e)); return null; }
  }, [chart, now, checkin, goalArea]);

  const onComplete = (b: BirthData, area: LifeArea, name: string) => {
    if (detectCrisis(name)) { setScreen('support'); return; }
    // Prove It: show the retrospective audit before Today (SPEC pivot §1).
    setError(null); setGoalArea(area); setGoalName(name); setBirth(b); setScreen('audit');
    saveProfile({ birth: b, goalArea: area, goalName: name });
  };
  const onDelete = () => { clearAll(); setReads({ count: 0, lastDay: '' }); setBirth(null); setCheckin(undefined); setError(null); setScreen('onboarding'); };
  const openReading = () => { setReads((r) => bumpReads(r)); setScreen('reading'); };
  const go = (s: Screen) => setScreen(s);

  const inApp = !!chart && screen !== 'onboarding' && screen !== 'support' && screen !== 'audit';
  const showBottomNav = inApp && WIDE.includes(screen);
  const narrow = !WIDE.includes(screen);

  let body: React.ReactNode;
  if (screen === 'support') {
    body = <Support onBack={() => setScreen(birth ? 'today' : 'onboarding')} />;
  } else if (screen === 'settings') {
    body = <Settings place={birth?.place ?? 'this device'} onDelete={onDelete} onBack={() => setScreen('today')} />;
  } else if (error) {
    body = (
      <div className="view" style={{ paddingTop: 40 }}>
        <div className="serif-h" style={{ fontSize: 24, marginBottom: 12 }}>Something didn’t compute.</div>
        <div className="disclaimer" style={{ textAlign: 'left', padding: 0 }}>{error}</div>
        <button className="btn" style={{ marginTop: 20, maxWidth: 240 }} onClick={onDelete}>Start over</button>
      </div>
    );
  } else if (!chart || !daily) {
    body = <Onboarding onComplete={onComplete} />;
  } else if (screen === 'audit') {
    body = <Audit aura={aura} chart={chart} now={now} goalArea={goalArea} onContinue={() => setScreen('today')} />;
  } else if (screen === 'today') {
    body = <Today input={daily.input} now={now} todayLine={daily.todayLine} remedyShort={daily.remedyShort}
      onOpenReading={openReading} onCheckin={() => setScreen('checkin')} />;
  } else if (screen === 'reading') {
    body = <Reading reading={daily.reading} now={now} onBack={() => setScreen('today')} />;
  } else if (screen === 'checkin') {
    body = <CheckinScreen major={daily.input.majorEnergy} passing={daily.input.passingEnergy}
      onDone={(c) => { setCheckin(c); setScreen('reading'); }}
      onSkip={() => { setCheckin(undefined); setScreen('reading'); }} />;
  } else if (screen === 'forecast') {
    body = <Forecast aura={aura} chart={chart} now={now} goalArea={goalArea} major={daily.input.majorEnergy} />;
  } else if (screen === 'chat') {
    body = <Chat aura={aura} chart={chart} now={now} />;
  } else {
    body = <Blueprint aura={aura} chart={chart} goalName={goalName} />;
  }

  return (
    <div className="app">
      {inApp ? <Sidebar screen={screen} go={go} totalReads={reads.count} onSettings={() => setScreen('settings')} /> : null}
      <main className="main">
        {inApp ? <TopBar totalReads={reads.count} onSettings={() => setScreen('settings')} /> : null}
        <div className={`content${narrow ? ' narrow' : ''}`}>{body}</div>
        {showBottomNav ? <BottomNav screen={screen} go={go} /> : null}
      </main>
    </div>
  );
}
