import { useEffect, useState } from 'react';

// Birth date and time entry.
//
// Native <input type="date"> and <input type="time"> are inconsistent across browsers, and the
// date one is actively hostile for birth data — reaching 1962 means paging a calendar back
// hundreds of times. Three plain selects (day / month / year) get there in three taps, read the
// same on every platform, and are fully keyboard- and screen-reader-friendly.
//
// Each field keeps its OWN partial state. A half-finished date is not a valid date, so the parent
// only ever receives '' or a complete value — but the selects must still remember the parts chosen
// so far, otherwise picking "15" would blank itself the instant it was chosen.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number): string => String(n).padStart(2, '0');

/** Days in a given month, leap years included. Falls back to 31 until a month is chosen. */
function daysInMonth(year: number, month1: number): number {
  if (!month1) return 31;
  return new Date(year || 2000, month1, 0).getDate(); // 2000 is a leap year: 29 shown until a year is set
}

function splitISO(iso: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? { y: +m[1]!, m: +m[2]!, d: +m[3]! } : { y: 0, m: 0, d: 0 };
}

export function DateField({ value, onChange, minYear = 1900, ariaLabel = 'Birth date' }: {
  value: string;                      // ISO yyyy-mm-dd, or '' when unset
  onChange: (iso: string) => void;    // '' until all three parts are chosen
  minYear?: number;
  ariaLabel?: string;
}) {
  const init = splitISO(value);
  const [d, setD] = useState(init.d);
  const [m, setM] = useState(init.m);
  const [y, setY] = useState(init.y);

  // Adopt an externally-supplied value (loading a profile, switching user).
  useEffect(() => {
    const p = splitISO(value);
    if (p.y || p.m || p.d) { setD(p.d); setM(p.m); setY(p.y); }
  }, [value]);

  const thisYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = thisYear; i >= minYear; i--) years.push(i);
  const dayCount = daysInMonth(y, m);

  const push = (nd: number, nm: number, ny: number) => {
    // Clamp when a shorter month is picked (31 Jan → Feb becomes 28/29).
    const clamped = nm && nd > daysInMonth(ny, nm) ? daysInMonth(ny, nm) : nd;
    setD(clamped); setM(nm); setY(ny);
    onChange(clamped && nm && ny ? `${ny}-${pad(nm)}-${pad(clamped)}` : '');
  };

  return (
    <div className="dtf" role="group" aria-label={ariaLabel}>
      <select className="dtf-sel dtf-day" value={d || ''} aria-label="Day"
        onChange={(e) => push(+e.target.value, m, y)}>
        <option value="">Day</option>
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className="dtf-sel dtf-month" value={m || ''} aria-label="Month"
        onChange={(e) => push(d, +e.target.value, y)}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select className="dtf-sel dtf-year" value={y || ''} aria-label="Year"
        onChange={(e) => push(d, m, +e.target.value)}>
        <option value="">Year</option>
        {years.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}

/** Split 24h "HH:MM" into 12-hour parts. */
function split24(hhmm: string): { h12: number; min: number; ampm: 'AM' | 'PM' } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = +m[1]!;
  return { h12: h % 12 === 0 ? 12 : h % 12, min: +m[2]!, ampm: h < 12 ? 'AM' : 'PM' };
}

export function TimeField({ value, onChange, disabled, ariaLabel = 'Birth time' }: {
  value: string;                      // 24h "HH:MM", or '' when unset
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const init = split24(value);
  const [h12, setH] = useState(init?.h12 ?? 0);
  const [min, setMin] = useState(init?.min ?? -1);
  const [ampm, setAmPm] = useState<string>(init?.ampm ?? '');

  useEffect(() => {
    const p = split24(value);
    if (p) { setH(p.h12); setMin(p.min); setAmPm(p.ampm); }
  }, [value]);

  const push = (nh: number, nm: number, ap: string) => {
    setH(nh); setMin(nm); setAmPm(ap);
    if (!nh || nm < 0 || !ap) { onChange(''); return; }
    const h24 = ap === 'AM' ? (nh === 12 ? 0 : nh) : (nh === 12 ? 12 : nh + 12);
    onChange(`${pad(h24)}:${pad(nm)}`);
  };

  return (
    <div className={`dtf${disabled ? ' off' : ''}`} role="group" aria-label={ariaLabel}>
      <select className="dtf-sel dtf-hour" value={h12 || ''} disabled={disabled} aria-label="Hour"
        onChange={(e) => push(+e.target.value, min, ampm)}>
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <select className="dtf-sel dtf-min" value={min >= 0 ? min : ''} disabled={disabled} aria-label="Minute"
        onChange={(e) => push(h12, +e.target.value, ampm)}>
        <option value="">Min</option>
        {Array.from({ length: 60 }, (_, i) => i).map((n) => <option key={n} value={n}>{pad(n)}</option>)}
      </select>
      <select className="dtf-sel dtf-ampm" value={ampm} disabled={disabled} aria-label="AM or PM"
        onChange={(e) => push(h12, min, e.target.value)}>
        <option value="">--</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
