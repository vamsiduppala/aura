import { useState } from 'react';
import type { BirthData, LifeArea } from '@aura/engine';
import { DISCLAIMER } from '@aura/engine';
import { Button } from '@/components/ui/button';
import { Pressable } from '../components/Pressable';

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

// The "Other place…" option index — reveals manual coordinate entry so any birthplace works
// (we never guess coordinates; the user supplies their own accurate lat/lon/UTC-offset).
const CUSTOM = CITIES.length;
const numOrNaN = (s: string) => (s.trim() === '' ? NaN : Number(s));

export function Onboarding({ onComplete, initial, editing }: {
  onComplete: (birth: BirthData, goalArea: LifeArea, goalName: string) => void;
  initial?: { birth: BirthData; goalArea: LifeArea; goalName: string };
  editing?: boolean;
}) {
  const initCity = initial ? CITIES.findIndex((c) => c.name === initial.birth.place) : -1;
  const startCustom = !!initial && initCity < 0; // an edited profile whose place isn't a preset
  const [date, setDate] = useState(initial?.birth.date ?? '2001-03-14');
  const [time, setTime] = useState(initial?.birth.time ?? '09:42');
  const [unknownTime, setUnknownTime] = useState(initial?.birth.unknownTime ?? false);
  const [cityIdx, setCityIdx] = useState(startCustom ? CUSTOM : (initCity >= 0 ? initCity : 0));
  const [cPlace, setCPlace] = useState(startCustom ? initial!.birth.place : '');
  const [cLat, setCLat] = useState(startCustom ? String(initial!.birth.lat) : '');
  const [cLng, setCLng] = useState(startCustom ? String(initial!.birth.lng) : '');
  const [cTz, setCTz] = useState(startCustom ? String(initial!.birth.tzOffsetMinutes / 60) : ''); // UTC offset, hours
  const [goal, setGoal] = useState<LifeArea>(initial?.goalArea ?? 'money');
  const [name, setName] = useState(initial?.goalName ?? 'Kai’s studio');

  const isCustom = cityIdx === CUSTOM;
  const lat = numOrNaN(cLat), lng = numOrNaN(cLng), tzH = numOrNaN(cTz);
  const customValid = !isCustom || (
    Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    Number.isFinite(lng) && Math.abs(lng) <= 180 &&
    Number.isFinite(tzH) && Math.abs(tzH) <= 14
  );

  const submit = () => {
    if (!customValid) return;
    const birth: BirthData = isCustom
      ? {
        date, time: unknownTime ? undefined : time, unknownTime,
        place: cPlace.trim() || 'Custom location', lat, lng, tzOffsetMinutes: Math.round(tzH * 60),
      }
      : (() => {
        const city = CITIES[cityIdx]!;
        return { date, time: unknownTime ? undefined : time, unknownTime, place: city.name, lat: city.lat, lng: city.lng, tzOffsetMinutes: city.tz };
      })();
    onComplete(birth, goal, name.trim() || 'my goal');
  };

  return (
    <>
      <div className="view s1">
        <div className="mark"><span className="glyph" /> aura</div>
        <h2>{editing ? <>Update<br />your details.</> : <>Let’s read<br />your timing.</>}</h2>
        <div className="intro">{editing
          ? 'Fix your birth details and we’ll recompute your whole chart.'
          : 'No charts to learn. No jargon. Just your energy — translated from a system that’s been read for 5,000 years.'}</div>

        <div className="field">
          <span className="k">Born on</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Birth date" />
        </div>
        <div className="field">
          <span className="k">Born at</span>
          <input type="time" value={time} disabled={unknownTime} onChange={(e) => setTime(e.target.value)} aria-label="Birth time" />
        </div>
        <Pressable className="unknown" active={unknownTime} onPress={() => setUnknownTime((v) => !v)}>
          <span className={`box${unknownTime ? ' on' : ''}`} /> I don’t know my time — read me by day
        </Pressable>
        <div className="field">
          <span className="k">Born in</span>
          <select
            value={cityIdx}
            aria-label="Birthplace"
            onChange={(e) => setCityIdx(Number(e.target.value))}
            style={{ background: 'none', border: 'none', color: 'var(--mist)', textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 15, outline: 'none' }}
          >
            {CITIES.map((c, i) => <option key={c.name} value={i} style={{ color: '#000' }}>{c.name}</option>)}
            <option value={CUSTOM} style={{ color: '#000' }}>Other place…</option>
          </select>
        </div>

        {isCustom ? (
          <div className="custom-place">
            <div className="field">
              <span className="k">Place name</span>
              <input value={cPlace} onChange={(e) => setCPlace(e.target.value)} placeholder="e.g. Chennai, IN" aria-label="Custom place name"
                style={{ background: 'none', border: 'none', color: 'var(--mist)', textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 15, outline: 'none' }} />
            </div>
            <div className="field">
              <span className="k">Latitude</span>
              <input type="number" step="0.01" value={cLat} onChange={(e) => setCLat(e.target.value)} placeholder="−90 to 90" aria-label="Latitude"
                style={{ background: 'none', border: 'none', color: 'var(--mist)', textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 15, outline: 'none' }} />
            </div>
            <div className="field">
              <span className="k">Longitude</span>
              <input type="number" step="0.01" value={cLng} onChange={(e) => setCLng(e.target.value)} placeholder="−180 to 180" aria-label="Longitude"
                style={{ background: 'none', border: 'none', color: 'var(--mist)', textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 15, outline: 'none' }} />
            </div>
            <div className="field">
              <span className="k">UTC offset (hrs)</span>
              <input type="number" step="0.25" value={cTz} onChange={(e) => setCTz(e.target.value)} placeholder="e.g. 5.5" aria-label="UTC offset in hours"
                style={{ background: 'none', border: 'none', color: 'var(--mist)', textAlign: 'right', fontFamily: 'var(--sans)', fontSize: 15, outline: 'none' }} />
            </div>
            <div className="bp-meta" style={{ marginTop: 2 }}>Your birthplace’s coordinates and its clock offset from UTC at birth (include DST if it applied).</div>
          </div>
        ) : null}

        <div className="subq">What are you building?</div>
        <div className="chips">
          {GOALS.map((g) => (
            <Pressable key={g.area} className={`chip${goal === g.area ? ' on' : ''}`} active={goal === g.area} onPress={() => setGoal(g.area)}>{g.label}</Pressable>
          ))}
        </div>
        <div className="empire">
          <span className="k">Name your empire</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="my goal" aria-label="Name your goal" />
        </div>

        <div className="cta-zone">
          <Button onClick={submit} disabled={!customValid}>{editing ? 'Save changes' : <>Read my energy <span>→</span></>}</Button>
          <div className="fineprint">Private. Yours only. Delete anytime.</div>
          <div className="disclaimer" style={{ paddingTop: 12 }}>{DISCLAIMER}</div>
        </div>
      </div>
    </>
  );
}
