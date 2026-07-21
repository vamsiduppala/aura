import { useState } from 'react';
import type { BirthData, LifeArea } from '@aura/engine';
import { DISCLAIMER } from '@aura/engine';
import { Button } from '@/components/ui/button';

interface City { name: string; lat: number; lng: number; tz: number; }
// Preset cities (offline). tz = current standard offset in minutes; real apps geocode
// with historical DST — see QUESTIONS Q-04. Good enough to demo the engine.
const CITIES: City[] = [
  { name: 'Jaipur, IN', lat: 26.92, lng: 75.82, tz: 330 },
  { name: 'Mumbai, IN', lat: 19.08, lng: 72.88, tz: 330 },
  { name: 'Bengaluru, IN', lat: 12.97, lng: 77.59, tz: 330 },
  { name: 'London, UK', lat: 51.51, lng: -0.13, tz: 60 },
  { name: 'New York, US', lat: 40.71, lng: -74.01, tz: -240 },
  { name: 'San Francisco, US', lat: 37.77, lng: -122.42, tz: -420 },
  { name: 'Sydney, AU', lat: -33.87, lng: 151.21, tz: 600 },
  { name: 'Tokyo, JP', lat: 35.68, lng: 139.65, tz: 540 },
];

const GOALS: { label: string; area: LifeArea }[] = [
  { label: 'Career', area: 'career' },
  { label: 'Wealth', area: 'money' },
  { label: 'Love', area: 'partnership' },
  { label: 'Health', area: 'health' },
  { label: 'Self', area: 'self' },
];

export function Onboarding({ onComplete }: {
  onComplete: (birth: BirthData, goalArea: LifeArea, goalName: string) => void;
}) {
  const [date, setDate] = useState('2001-03-14');
  const [time, setTime] = useState('09:42');
  const [unknownTime, setUnknownTime] = useState(false);
  const [cityIdx, setCityIdx] = useState(0);
  const [goal, setGoal] = useState<LifeArea>('money');
  const [name, setName] = useState('Kai’s studio');

  const submit = () => {
    const city = CITIES[cityIdx]!;
    const birth: BirthData = {
      date, time: unknownTime ? undefined : time, unknownTime,
      place: city.name, lat: city.lat, lng: city.lng, tzOffsetMinutes: city.tz,
    };
    onComplete(birth, goal, name.trim() || 'my goal');
  };

  return (
    <>
      <div className="view s1">
        <div className="mark"><span className="glyph" /> aura</div>
        <h2>Let’s read<br />your timing.</h2>
        <div className="intro">No charts to learn. No jargon. Just your energy — translated from a system that’s been read for 5,000 years.</div>

        <div className="field">
          <span className="k">Born on</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <span className="k">Born at</span>
          <input type="time" value={time} disabled={unknownTime} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="unknown" onClick={() => setUnknownTime((v) => !v)}>
          <span className={`box${unknownTime ? ' on' : ''}`} /> I don’t know my time — read me by day
        </div>
        <div className="field">
          <span className="k">Born in</span>
          <select
            value={cityIdx}
            onChange={(e) => setCityIdx(Number(e.target.value))}
            style={{ background: 'none', border: 'none', color: 'var(--mist)', textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 15, outline: 'none' }}
          >
            {CITIES.map((c, i) => <option key={c.name} value={i} style={{ color: '#000' }}>{c.name}</option>)}
          </select>
        </div>

        <div className="subq">What are you building?</div>
        <div className="chips">
          {GOALS.map((g) => (
            <span key={g.area} className={`chip${goal === g.area ? ' on' : ''}`} onClick={() => setGoal(g.area)}>{g.label}</span>
          ))}
        </div>
        <div className="empire">
          <span className="k">Name your empire</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="my goal" />
        </div>

        <div className="cta-zone">
          <Button onClick={submit}>Read my energy <span>→</span></Button>
          <div className="fineprint">Private. Yours only. Delete anytime.</div>
          <div className="disclaimer" style={{ paddingTop: 12 }}>{DISCLAIMER}</div>
        </div>
      </div>
    </>
  );
}
