import { useEffect, useRef, useState } from 'react';
import { searchPlaces, offsetMinutesFor, formatOffset, type PlaceHit } from '../services/geo';

export interface ResolvedPlace {
  place: string;
  lat: number;
  lng: number;
  tzOffsetMinutes: number;
  timezone: string;
}

/**
 * Type a birthplace, pick it from the suggestions, and everything else is worked out for you:
 * coordinates and the UTC offset that actually applied on your birth date (daylight saving
 * included). The user never sees a latitude field.
 *
 * `birthDate`/`birthTime` matter because the offset is historical — the same city can be +1:00
 * in July and +0:00 in January — so changing the date re-derives the offset for the chosen place.
 */
export function PlacePicker({ value, birthDate, birthTime, onResolved, ariaLabel = 'Birthplace' }: {
  value: string;
  birthDate: string;
  birthTime?: string;
  onResolved: (p: ResolvedPlace | null) => void;
  ariaLabel?: string;
}) {
  const [query, setQuery] = useState(value);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState<PlaceHit | null>(null);
  const [touched, setTouched] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep the field in step when the parent supplies a different place (e.g. loading a profile).
  useEffect(() => { setQuery(value); }, [value]);

  // Debounced search — one request per pause in typing, and in-flight requests are cancelled.
  useEffect(() => {
    if (!touched || !query.trim() || (chosen && chosen.label === query)) { setHits([]); return; }
    const ctl = new AbortController();
    setBusy(true);
    const t = window.setTimeout(async () => {
      const r = await searchPlaces(query, ctl.signal);
      setHits(r); setOpen(r.length > 0); setBusy(false);
    }, 280);
    return () => { window.clearTimeout(t); ctl.abort(); setBusy(false); };
  }, [query, touched, chosen]);

  // Re-derive the offset if the birth date changes after a place was picked.
  useEffect(() => {
    if (!chosen) return;
    const off = offsetMinutesFor(chosen.timezone, birthDate, birthTime);
    if (off != null) {
      onResolved({ place: chosen.label, lat: chosen.lat, lng: chosen.lng, tzOffsetMinutes: off, timezone: chosen.timezone });
    }
    // onResolved is a fresh closure each render; depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, birthDate, birthTime]);

  // Click-away closes the suggestion list.
  useEffect(() => {
    const away = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const pick = (h: PlaceHit) => {
    setChosen(h); setQuery(h.label); setOpen(false); setHits([]);
  };

  const offset = chosen ? offsetMinutesFor(chosen.timezone, birthDate, birthTime) : null;

  return (
    <div className="place-picker" ref={boxRef}>
      <input
        value={query}
        onChange={(e) => { setTouched(true); setQuery(e.target.value); setChosen(null); onResolved(null); }}
        onFocus={() => { if (hits.length) setOpen(true); }}
        placeholder="Start typing your city…"
        aria-label={ariaLabel}
        autoComplete="off" spellCheck={false}
        className="place-input"
      />
      {busy ? <span className="place-busy">searching…</span> : null}

      {open && hits.length > 0 ? (
        <ul className="place-list" role="listbox">
          {hits.map((h) => (
            <li key={h.id}>
              <button type="button" className="place-opt" onClick={() => pick(h)}>
                <span className="place-name">{h.name}</span>
                <span className="place-sub">{[h.admin, h.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {chosen && offset != null ? (
        <div className="place-ok">
          Found it — {chosen.timezone.replace('_', ' ')}, UTC{formatOffset(offset)} on that date.
        </div>
      ) : null}
      {chosen && offset == null ? (
        <div className="place-warn">We couldn’t work out the time zone for that place. Try a nearby city.</div>
      ) : null}
      {touched && !chosen && query.trim().length >= 2 && !busy && hits.length === 0 ? (
        <div className="place-warn">No match yet — keep typing, or try the nearest larger city.</div>
      ) : null}
    </div>
  );
}
