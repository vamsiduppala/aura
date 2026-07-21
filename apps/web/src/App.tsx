import { useMemo, useState } from 'react';
import {
  AstronomiaEphemeris, computeChart, computeReadingInput, generateReading, detectCrisis,
  type BirthData, type Chart, type Checkin, type LifeArea,
} from '@aura/engine';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { Reading } from './screens/Reading';
import { Checkin as CheckinScreen } from './screens/Checkin';
import { Forecast } from './screens/Forecast';
import { Blueprint } from './screens/Blueprint';
import { Settings } from './screens/Settings';
import { Support } from './screens/Support';
import { BottomNav, type Screen } from './components/Chrome';
import { isoDay } from './ui';

const ephem = new AstronomiaEphemeris();
const STORAGE_KEY = 'aura.v1';

interface Saved { birth: BirthData; goalArea: LifeArea; goalName: string; }
function loadSaved(): Saved | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

export function App() {
  const saved = useMemo(loadSaved, []);
  const [screen, setScreen] = useState<Screen>(saved ? 'today' : 'onboarding');
  const [birth, setBirth] = useState<BirthData | null>(saved?.birth ?? null);
  const [goalArea, setGoalArea] = useState<LifeArea>(saved?.goalArea ?? 'career');
  const [goalName, setGoalName] = useState(saved?.goalName ?? 'my goal');
  const [checkin, setCheckin] = useState<Checkin | undefined>();
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const chart: Chart | null = useMemo(() => {
    if (!birth) return null;
    try { return computeChart(birth, ephem); } catch (e) { setError(String(e)); return null; }
  }, [birth]);

  const readingInput = useMemo(() => {
    if (!chart) return null;
    try { return computeReadingInput(chart, now, ephem, { ...(checkin ? { checkin } : {}), goalArea }); }
    catch (e) { setError(String(e)); return null; }
  }, [chart, now, checkin, goalArea]);

  const reading = useMemo(() => {
    if (!readingInput || !chart) return null;
    return generateReading(readingInput, isoDay(now), chart.lagnaLong, { goalArea });
  }, [readingInput, chart, now, goalArea]);

  const onComplete = (b: BirthData, area: LifeArea, name: string) => {
    // Free-text safety check (SPEC §11.3): never "read" a crisis — route to support.
    if (detectCrisis(name)) { setScreen('support'); return; }
    setError(null); setGoalArea(area); setGoalName(name); setBirth(b); setScreen('today');
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ birth: b, goalArea: area, goalName: name })); } catch { /* ignore */ }
  };

  const onDelete = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setBirth(null); setCheckin(undefined); setError(null); setScreen('onboarding');
  };

  const withNav = screen === 'today' || screen === 'forecast' || screen === 'blueprint';

  let body: React.ReactNode;
  if (screen === 'support') {
    body = <Support onBack={() => setScreen(birth ? 'today' : 'onboarding')} />;
  } else if (screen === 'settings') {
    body = <Settings place={birth?.place ?? 'this device'} onDelete={onDelete} onBack={() => setScreen('today')} />;
  } else if (error) {
    body = (
      <div className="view" style={{ padding: 30, justifyContent: 'center' }}>
        <div className="serif-h" style={{ fontSize: 22, marginBottom: 12 }}>Something didn’t compute.</div>
        <div className="disclaimer" style={{ textAlign: 'left' }}>{error}</div>
        <button className="btn" style={{ marginTop: 20 }} onClick={onDelete}>Start over</button>
      </div>
    );
  } else if (!chart || !readingInput || !reading) {
    body = <Onboarding onComplete={onComplete} />;
  } else if (screen === 'today') {
    body = <Today input={readingInput} now={now} chartSeed={chart.lagnaLong} streak={7}
      onOpenReading={() => setScreen('reading')} onCheckin={() => setScreen('checkin')}
      onSettings={() => setScreen('settings')} />;
  } else if (screen === 'reading') {
    body = <Reading reading={reading} now={now} onBack={() => setScreen('today')} />;
  } else if (screen === 'checkin') {
    body = <CheckinScreen major={readingInput.majorEnergy} passing={readingInput.passingEnergy}
      onDone={(c) => { setCheckin(c); setScreen('reading'); }}
      onSkip={() => { setCheckin(undefined); setScreen('reading'); }} />;
  } else if (screen === 'forecast') {
    body = <Forecast chart={chart} now={now} chartSeed={chart.lagnaLong} goalArea={goalArea} major={readingInput.majorEnergy} />;
  } else {
    body = <Blueprint chart={chart} goalName={goalName} />;
  }

  return (
    <div className="app-shell">
      <div className="device">
        <div className="island" />
        <div className="screen">
          {body}
          {withNav ? <BottomNav screen={screen} go={setScreen} /> : null}
        </div>
      </div>
    </div>
  );
}
