// Onboarding. Chart before account: the person enters their details and meets their
// court before anyone asks them for a password.
//
// Every field starts EMPTY and gates the Continue button. There is deliberately no
// pre-filled date, time or place — a pre-filled value means a new user can silently be
// shown a stranger's chart, and once they've seen it they have no way to tell.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, MapPin, Search } from 'lucide-react';
import type { BirthData } from '@aura/engine';
import { Inset, Pressable } from '../components/neu';
import { Wheel, WheelCentreKing } from '../components/Wheel';
import {
  CONFIDENCE_EFFECT, CONFIDENCE_LABEL, courtAt, type BirthTimeConfidence,
} from '../core/court';
import { GeoUnavailable, formatOffset, offsetMinutesFor, searchPlaces, type PlaceHit } from '../services/geo';
import { PLANET } from '../theme/tokens';
import { useVim } from '../store/useVim';
import { useNow } from '../hooks/useNow';

type Step = 'name' | 'date' | 'time' | 'place' | 'reveal';
const ORDER: Step[] = ['name', 'date', 'time', 'place', 'reveal'];

const CONFIDENCES: BirthTimeConfidence[] = ['exact', 'within15min', 'within1hour', 'unknown'];

/** ISO date `YYYY-MM-DD` for a Date, in local terms (not UTC — a birthday is local). */
function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yearsSince(dateISO: string): number {
  const then = new Date(`${dateISO}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - then.getFullYear();
  const beforeBirthday =
    now.getMonth() < then.getMonth() ||
    (now.getMonth() === then.getMonth() && now.getDate() < then.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

export function Onboarding() {
  const { saveBirth, birth: existing, confidence: existingConf, displayName } = useVim();
  const [step, setStep] = useState<Step>('name');

  // Nothing here is seeded. An edit of existing details is the one case where fields
  // start populated — because they are that person's own, already on this device.
  const [name, setName] = useState(displayName);
  const [date, setDate] = useState(existing?.date ?? '');
  const [time, setTime] = useState(existing?.time ?? '');
  const [confidence, setConfidence] = useState<BirthTimeConfidence | null>(
    existing ? existingConf : null,
  );
  const [place, setPlace] = useState<PlaceHit | null>(null);
  const [built, setBuilt] = useState<{ birth: BirthData; tzId: string } | null>(null);

  const today = useMemo(() => isoLocal(new Date()), []);
  const earliest = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return isoLocal(d);
  }, []);

  const age = date ? yearsSince(date) : null;
  const tooYoung = age != null && age < 13;
  const dateOk = !!date && date <= today && date >= earliest && !tooYoung;

  const idx = ORDER.indexOf(step);
  const back = () => setStep(ORDER[Math.max(0, idx - 1)]!);

  /** Assemble the real birth record and hand it to the store. */
  const finish = () => {
    if (!dateOk || !place || !confidence) return;
    const unknownTime = confidence === 'unknown' || !time;
    // The offset that was in force at this place ON THIS DATE — not today's.
    const offset = offsetMinutesFor(place.timezone, date, unknownTime ? '12:00' : time);
    if (offset == null) return; // unknown zone: the place step keeps the user here
    const birth: BirthData = {
      date,
      unknownTime,
      place: place.label,
      lat: place.lat,
      lng: place.lng,
      tzOffsetMinutes: offset,
      ...(unknownTime ? {} : { time }),
    };
    setBuilt({ birth, tzId: place.timezone });
    setStep('reveal');
  };

  return (
    <div className="screen">
      <div className="screen-scroll onboard">
        <header className="onboard-head">
          {idx > 0 && step !== 'reveal' && (
            <Pressable variant="flat" aria-label="Back" onClick={back}>
              <ArrowLeft size={20} aria-hidden />
            </Pressable>
          )}
          <div className="onboard-dots" aria-hidden>
            {ORDER.slice(0, 4).map((s, i) => (
              <span key={s} className="onboard-dot" data-on={i <= Math.min(idx, 3)} />
            ))}
          </div>
        </header>

        {step === 'name' && (
          <Field
            title="What should we call you?"
            hint="Just a first name is fine. It's stored on your device, not shared."
          >
            <Inset className="field">
              <input
                className="field-input"
                type="text"
                value={name}
                autoComplete="given-name"
                placeholder="Your name"
                onChange={(e) => setName(e.target.value)}
                aria-label="Your name"
              />
            </Inset>
            <Pressable
              variant="primary"
              disabled={!name.trim()}
              onClick={() => setStep('date')}
            >
              Continue
            </Pressable>
          </Field>
        )}

        {step === 'date' && (
          <Field
            title="When were you born?"
            hint="Your date sets the whole 120-year cycle. Nothing works without it."
          >
            <Inset className="field">
              <input
                className="field-input"
                type="date"
                value={date}
                min={earliest}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Date of birth"
              />
            </Inset>
            {tooYoung && (
              <p className="field-error" role="alert">
                You need to be 13 or older to use this.
              </p>
            )}
            {date && !tooYoung && age != null && (
              <p className="field-note">{age} years old.</p>
            )}
            <Pressable variant="primary" disabled={!dateOk} onClick={() => setStep('time')}>
              Continue
            </Pressable>
          </Field>
        )}

        {step === 'time' && (
          <Field
            title="What time were you born?"
            hint="This is the one that decides how much the app is allowed to tell you."
          >
            <Inset className="field">
              <input
                className="field-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Time of birth"
                disabled={confidence === 'unknown'}
              />
            </Inset>

            <h2 className="t-section-label" style={{ marginTop: 22 }}>How sure are you?</h2>
            <div className="stack" style={{ gap: 8, marginTop: 10 }}>
              {CONFIDENCES.map((c) => (
                <Pressable
                  key={c}
                  className="choice"
                  aria-pressed={confidence === c}
                  onClick={() => setConfidence(c)}
                >
                  <span className="choice-radio" data-on={confidence === c} aria-hidden>
                    {confidence === c && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="choice-label">{CONFIDENCE_LABEL[c]}</span>
                </Pressable>
              ))}
            </div>

            {/* The trade-off is stated before it's made, never discovered afterwards. */}
            {confidence && (
              <Inset soft className="effect-note">
                <p className="t-sub" style={{ margin: 0 }}>{CONFIDENCE_EFFECT[confidence]}</p>
                {confidence === 'unknown' && (
                  <p className="t-sub" style={{ margin: '8px 0 0' }}>
                    We'll use noon as a placeholder. Your King will still be right — the
                    faster rulers need a real time.
                  </p>
                )}
              </Inset>
            )}

            <p className="field-note">
              One minute of error moves every boundary in your chart by up to five days,
              and it never averages out. That's why we ask.
            </p>

            <Pressable
              variant="primary"
              disabled={!confidence || (confidence !== 'unknown' && !time)}
              onClick={() => setStep('place')}
            >
              Continue
            </Pressable>
          </Field>
        )}

        {step === 'place' && (
          <PlaceStep
            date={date}
            time={confidence === 'unknown' ? '12:00' : time}
            selected={place}
            onSelect={setPlace}
            onContinue={finish}
          />
        )}

        {step === 'reveal' && built && (
          <Reveal
            birth={built.birth}
            confidence={confidence ?? 'unknown'}
            onDone={() => saveBirth({
              birth: built.birth,
              confidence: confidence ?? 'unknown',
              displayName: name.trim(),
              tzId: built.tzId,
            })}
          />
        )}
      </div>
    </div>
  );
}

function Field({
  title, hint, children,
}: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="onboard-step">
      <h1 className="t-page-title">{title}</h1>
      <p className="t-sub onboard-hint">{hint}</p>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Place — a real geocoder, debounced. No built-in city list, no fallbacks.
// ---------------------------------------------------------------------------

function PlaceStep({
  date, time, selected, onSelect, onContinue,
}: {
  date: string;
  time: string;
  selected: PlaceHit | null;
  onSelect: (p: PlaceHit | null) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState(selected?.label ?? '');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const abort = useRef<AbortController>();

  useEffect(() => {
    const q = query.trim();
    if (selected && q === selected.label) return; // don't re-search what was just picked
    if (q.length < 2) { setHits([]); setSearched(false); return; }
    setBusy(true);
    setError(null);
    const t = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        setHits(await searchPlaces(q, ctrl.signal));
        setSearched(true);
      } catch (e) {
        setError(e instanceof GeoUnavailable ? e.message : 'Place lookup failed.');
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => { clearTimeout(t); setBusy(false); };
  }, [query, selected]);

  // The offset that applied at that place on that date — shown, so it can be checked.
  const offset = selected ? offsetMinutesFor(selected.timezone, date, time) : null;
  const zoneUnknown = selected != null && offset == null;

  return (
    <section className="onboard-step">
      <h1 className="t-page-title">Where were you born?</h1>
      <p className="t-sub onboard-hint">
        Town or city. We resolve the coordinates and the timezone that was actually in
        force on your birth date.
      </p>

      <Inset className="field">
        <Search size={17} aria-hidden className="field-icon" />
        <input
          className="field-input"
          type="search"
          value={query}
          placeholder="Start typing a place"
          autoComplete="off"
          onChange={(e) => { setQuery(e.target.value); onSelect(null); }}
          aria-label="Birth place"
        />
        {busy && <Loader2 size={16} className="spin" aria-hidden />}
      </Inset>

      {error && <p className="field-error" role="alert">{error}</p>}

      {!selected && hits.length > 0 && (
        <ul className="place-list" role="listbox" aria-label="Matching places">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="place-row"
                role="option"
                aria-selected={false}
                onClick={() => { onSelect(h); setQuery(h.label); setHits([]); }}
              >
                <MapPin size={15} aria-hidden />
                <span>
                  <span className="place-name">{h.label}</span>
                  <span className="place-zone">{h.timezone}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selected && searched && !busy && hits.length === 0 && !error && (
        <p className="field-note">
          No match. Try the nearest larger town — the coordinates only need to be close
          enough to get the timezone right.
        </p>
      )}

      {selected && (
        <Inset soft className="effect-note">
          <p className="t-sub" style={{ margin: 0 }}>
            <strong style={{ color: 'var(--ink-primary)' }}>{selected.label}</strong>
          </p>
          <p className="t-sub" style={{ margin: '6px 0 0' }}>
            {selected.lat.toFixed(3)}°, {selected.lng.toFixed(3)}° · {selected.timezone}
            {offset != null && ` · ${formatOffset(offset)} on your birth date`}
          </p>
        </Inset>
      )}

      {zoneUnknown && (
        <p className="field-error" role="alert">
          We couldn't resolve that timezone on this device. Pick a nearby city instead.
        </p>
      )}

      <Pressable variant="primary" disabled={!selected || zoneUnknown} onClick={onContinue}>
        Build my court
      </Pressable>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reveal — the payoff. Real chart, real rings, real names.
// ---------------------------------------------------------------------------

function Reveal({
  birth, confidence, onDone,
}: { birth: BirthData; confidence: BirthTimeConfidence; onDone: () => void }) {
  const now = useNow(1000);
  const [state, setState] = useState<'building' | 'ready' | 'failed'>('building');
  const [chart, setChart] = useState<import('@aura/engine').Chart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Yield a frame so the "building" state actually paints, then do the real work.
    // The duration is whatever the ephemeris takes — nothing here is padded.
    let alive = true;
    const id = requestAnimationFrame(async () => {
      try {
        const { computeChart, AstronomiaEphemeris } = await import('@aura/engine');
        const built = computeChart(birth, new AstronomiaEphemeris());
        if (!alive) return;
        setChart(built);
        setState('ready');
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message);
        setState('failed');
      }
    });
    return () => { alive = false; cancelAnimationFrame(id); };
  }, [birth]);

  if (state === 'failed') {
    return (
      <section className="onboard-step">
        <h1 className="t-page-title">We couldn't build your chart.</h1>
        <p className="t-sub onboard-hint">Your details are saved. {error}</p>
        <Pressable variant="primary" onClick={() => location.reload()}>Try again</Pressable>
      </section>
    );
  }

  if (state === 'building' || !chart) {
    return (
      <section className="onboard-step onboard-centre">
        <Loader2 size={26} className="spin" aria-hidden />
        <p className="t-sub" style={{ marginTop: 14 }} role="status">
          Placing the planets, finding your Moon's nakṣatra, building your court…
        </p>
      </section>
    );
  }

  const seats = courtAt(chart, now, confidence);
  const king = seats[0];
  const pm = seats[1];

  return (
    <section className="onboard-step onboard-centre">
      <h1 className="t-screen-title">Meet your court</h1>
      <Wheel seats={seats} now={now} centre={<WheelCentreKing seat={king} />} />
      {king && (
        <p className="reveal-line">
          <span style={{ color: PLANET[king.lord].ring }}>{PLANET[king.lord].name}</span>{' '}
          is your King
          {pm && pm.visibility !== 'hidden' && (
            <>
              {' · '}
              <span style={{ color: PLANET[pm.lord].ring }}>{PLANET[pm.lord].name}</span>{' '}
              is your Prime Minister
            </>
          )}
        </p>
      )}
      <p className="t-sub" style={{ textAlign: 'center' }}>
        Five rulers, five speeds — all in office at once. The outer ring turns over in
        hours; the inner one holds for years.
      </p>
      <Pressable variant="primary" onClick={onDone}>See my timeline</Pressable>
    </section>
  );
}
