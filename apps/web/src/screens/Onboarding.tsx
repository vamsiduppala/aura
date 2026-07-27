import { useState } from 'react';
import type { BirthData, LifeArea } from '@aura/engine';
import { DISCLAIMER } from '@aura/engine';
import { Button } from '@/components/ui/button';
import { Pressable } from '../components/Pressable';
import { PlacePicker, type ResolvedPlace } from '../components/PlacePicker';

const GOALS: { label: string; area: LifeArea }[] = [
  { label: 'Career', area: 'career' },
  { label: 'Wealth', area: 'money' },
  { label: 'Love', area: 'partnership' },
  { label: 'Health', area: 'health' },
  { label: 'Self', area: 'self' },
];

const TODAY = new Date().toISOString().slice(0, 10); // no one is born in the future

export function Onboarding({ onComplete, initial, editing }: {
  onComplete: (birth: BirthData, goalArea: LifeArea, goalName: string, displayName: string) => void;
  initial?: { birth: BirthData; goalArea: LifeArea; goalName: string; displayName?: string };
  editing?: boolean;
}) {
  // Nothing is pre-filled for a new person — a stale demo date would silently build a wrong chart.
  const [who, setWho] = useState(initial?.displayName ?? '');
  const [date, setDate] = useState(initial?.birth.date ?? '');
  const [time, setTime] = useState(initial?.birth.time ?? '');
  const [unknownTime, setUnknownTime] = useState(initial?.birth.unknownTime ?? false);
  // An existing profile already has resolved coordinates; a new one waits for the picker.
  const [place, setPlace] = useState<ResolvedPlace | null>(
    initial ? {
      place: initial.birth.place, lat: initial.birth.lat, lng: initial.birth.lng,
      tzOffsetMinutes: initial.birth.tzOffsetMinutes, timezone: '',
    } : null,
  );
  const [goal, setGoal] = useState<LifeArea>(initial?.goalArea ?? 'career');
  const [name, setName] = useState(initial?.goalName ?? '');

  // A birth date is required (no silent default); the time may be genuinely unknown.
  const dateValid = date !== '' && date >= '1900-01-01' && date <= TODAY;
  const timeValid = unknownTime || time !== '';
  const canSubmit = dateValid && timeValid && !!place;

  const submit = () => {
    if (!canSubmit || !place) return;
    const birth: BirthData = {
      date, time: unknownTime ? undefined : time, unknownTime,
      place: place.place, lat: place.lat, lng: place.lng, tzOffsetMinutes: place.tzOffsetMinutes,
    };
    onComplete(birth, goal, name.trim() || 'my goal', who.trim());
  };

  return (
    <div className="view s1">
      <div className="mark"><span className="glyph" /> aura</div>
      <h2>{editing ? <>Update<br />your details.</> : <>Let’s read<br />your timing.</>}</h2>
      <div className="intro">{editing
        ? 'Fix your birth details and we’ll recompute your whole chart.'
        : 'No charts to learn. No jargon. Just your energy — translated from a system that’s been read for 5,000 years.'}</div>

      <div className="field">
        <span className="k">Your name</span>
        <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="what should we call you?"
          maxLength={60} aria-label="Your name" />
      </div>
      <div className="field">
        <span className="k">Born on</span>
        <input type="date" value={date} min="1900-01-01" max={TODAY}
          onChange={(e) => setDate(e.target.value)} aria-label="Birth date" />
      </div>
      <div className="field">
        <span className="k">Born at</span>
        <input type="time" value={time} disabled={unknownTime}
          onChange={(e) => setTime(e.target.value)} aria-label="Birth time" />
      </div>
      <Pressable className="unknown" active={unknownTime} onPress={() => setUnknownTime((v) => !v)}>
        <span className={`box${unknownTime ? ' on' : ''}`} /> I don’t know my time — read me by day
      </Pressable>

      <div className="field-stack">
        <span className="k">Born in</span>
        <PlacePicker value={place?.place ?? ''} birthDate={date || TODAY} birthTime={unknownTime ? undefined : time}
          onResolved={setPlace} />
      </div>

      <div className="subq">What are you building?</div>
      <div className="chips">
        {GOALS.map((g) => (
          <Pressable key={g.area} className={`chip${goal === g.area ? ' on' : ''}`} active={goal === g.area}
            onPress={() => setGoal(g.area)}>{g.label}</Pressable>
        ))}
      </div>
      <div className="empire">
        <span className="k">Name your empire</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="my goal" aria-label="Name your goal" />
      </div>

      <div className="cta-zone">
        <Button onClick={submit} disabled={!canSubmit}>{editing ? 'Save changes' : <>Read my energy <span>→</span></>}</Button>
        <div className="fineprint">Private. Yours only. Delete anytime.</div>
        <div className="disclaimer" style={{ paddingTop: 12 }}>{DISCLAIMER}</div>
      </div>
    </div>
  );
}
