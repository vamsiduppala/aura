import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart, Graha } from '@aura/engine';
import { SIGN_LORD } from '@aura/engine';
import { search as searchBook, getRasi, getBhava, classifyDignity } from '@aura/knowledge';
import type { Screen } from './Chrome';
import { grahaLabel, grahaColor } from '../ui';
import { dignityChip } from '../kundali';

// Command palette (Cmd/Ctrl-K) — the pattern Linear, Notion, Raycast and GitHub all converged on.
// It matters here because the app holds far more than its five nav items: twelve houses, nine
// planets, dozens of concepts from the encoded text. Without a palette that content is reachable
// only by scrolling, which means most of it is never found at all.

export interface Command {
  id: string;
  label: string;
  hint?: string;
  group: 'Go to' | 'Your chart' | 'Ask the mentor' | 'From the book' | 'Actions';
  colour?: string;
  run: () => void;
}

const ALL: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

/**
 * Score a match instead of just testing it. Unranked subsequence matching is why bad palettes feel
 * random — "satu" would happily match "VenuS...6th house" because the letters appear scattered.
 * Higher is better; 0 means no match. The label is weighted far above the hint, so typing a planet
 * name surfaces that planet rather than something whose description happens to contain the letters.
 */
function score(needle: string, label: string, hint = ''): number {
  const n = needle.toLowerCase().trim();
  if (!n) return 1;
  const l = label.toLowerCase();
  const h = hint.toLowerCase();

  if (l === n) return 1000;
  if (l.startsWith(n)) return 900 - l.length;
  // A match at a word boundary ("7th house" for "house") beats one buried mid-word.
  if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(l)) return 800 - l.length;
  if (l.includes(n)) return 700 - l.length;
  if (h.startsWith(n) || new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(h)) return 500;
  if (h.includes(n)) return 400;

  // Subsequence, but only on the LABEL and only when the letters are reasonably close together —
  // this is what makes "vns" find "Venus" without letting "satu" find "Venus, 6th house".
  const compact = n.replace(/\s+/g, '');
  let i = 0, first = -1, last = -1;
  for (let k = 0; k < l.length && i < compact.length; k++) {
    if (l[k] === compact[i]) { if (first < 0) first = k; last = k; i++; }
  }
  if (i === compact.length) {
    const span = last - first + 1;
    // Reject when the letters are scattered over more than ~2.5x their own length.
    if (span <= compact.length * 2.5) return 300 - span;
  }
  return 0;
}

export function CommandPalette({ open, onClose, go, chart, onAsk }: {
  open: boolean;
  onClose: () => void;
  go: (s: Screen) => void;
  chart: Chart | null;
  onAsk: (question: string) => void;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Remember where focus came from so it can be handed back on close, and keep Tab inside the
  // dialog while it is open — otherwise focus wanders behind the overlay and is effectively lost.
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) { restoreRef.current?.focus?.(); return; }
    restoreRef.current = document.activeElement as HTMLElement;
    setQ(''); setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables?.length) return;
      const first = focusables[0]!, last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    // The page behind must not scroll under an open dialog.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.removeEventListener('keydown', trap); document.body.style.overflow = prevOverflow; };
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const out: Command[] = [];
    const nav: [Screen, string, string][] = [
      ['today', 'Today', 'your reading for today'],
      ['forecast', 'Forecast', 'what is coming and how it will feel'],
      ['chat', 'Cosmic Mentor', 'ask anything about your chart'],
      ['blueprint', 'Blueprint', 'your whole chart, house by house'],
      ['history', 'Your readings', 'past readings, and how accurate they were'],
      ['account', 'Account', 'name, birth details, password'],
      ['settings', 'Settings', 'server, privacy, AI key'],
    ];
    for (const [s, label, hint] of nav) {
      out.push({ id: `go-${s}`, label, hint, group: 'Go to', run: () => { go(s); onClose(); } });
    }

    if (chart) {
      // Every planet, with where it actually is — the fastest way to answer "where's my Saturn?"
      for (const g of ALL) {
        const p = chart.planets[g];
        const dig = dignityChip(classifyDignity(g, p.sign));
        out.push({
          id: `planet-${g}`,
          label: grahaLabel(g),
          hint: `${getRasi(p.sign).english}, ${ORD[p.house]} house${dig ? ` · ${dig}` : ''} · ${Math.round((p.strength ?? 0) * 100)}%`,
          group: 'Your chart', colour: grahaColor(g),
          run: () => { go('blueprint'); onClose(); },
        });
      }
      // Every house, with its sign and ruler.
      for (let h = 1; h <= 12; h++) {
        const sign = (chart.lagnaSign + h - 1) % 12;
        const b = getBhava(h);
        out.push({
          id: `house-${h}`,
          label: `${ORD[h]} house — ${b.english}`,
          hint: `${getRasi(sign).english}, ruled by ${grahaLabel(SIGN_LORD[sign]!)} · ${b.significations.slice(0, 3).join(', ')}`,
          group: 'Your chart',
          run: () => { go('blueprint'); onClose(); },
        });
      }
    }

    out.push(
      { id: 'act-report', label: 'Download my chart report', group: 'Actions', run: () => { go('account'); onClose(); } },
      { id: 'act-edit', label: 'Edit my birth details', group: 'Actions', run: () => { go('account'); onClose(); } },
    );
    return out;
  }, [chart, go, onClose]);

  // Book concepts are searched live, so the whole encoded text is reachable from one keystroke.
  const bookHits = useMemo<Command[]>(() => {
    if (q.trim().length < 2) return [];
    return searchBook(q).slice(0, 4).map((h, i) => ({
      id: `book-${i}`,
      label: h.label,
      hint: h.summary.slice(0, 90),
      group: 'From the book' as const,
      run: () => { onAsk(`What does "${h.label}" mean, and how does it show up in my chart?`); onClose(); },
    }));
  }, [q, onAsk, onClose]);

  const results = useMemo(() => {
    const matched = commands
      .map((c) => ({ c, s: score(q, c.label, c.hint) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)      // best match first — ranking is what makes it feel sharp
      .map((x) => x.c);
    // Offer "ask the mentor" only when nothing obvious matched, or the text reads like a question.
    const looksLikeQuestion = /\s/.test(q.trim()) || q.trim().endsWith('?');
    const asking: Command[] = q.trim().length > 3 && (looksLikeQuestion || matched.length === 0) ? [{
      id: 'ask', label: `Ask the mentor: “${q.trim()}”`, group: 'Ask the mentor',
      run: () => { onAsk(q.trim()); onClose(); },
    }] : [];
    return [...asking, ...matched.slice(0, 10), ...bookHits];
  }, [commands, q, bookHits, onAsk, onClose]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); results[active]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  let lastGroup = '';
  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" ref={dialogRef}>
        <input
          ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          className="cmdk-input" placeholder="Search your chart, jump anywhere, or ask a question…"
          aria-label="Search or run a command" autoComplete="off" spellCheck={false}
        />
        <div className="cmdk-list" ref={listRef} role="listbox">
          {results.length === 0 ? (
            <div className="cmdk-none">Nothing matches “{q}”. Press Enter to ask the mentor instead.</div>
          ) : results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {header ? <div className="cmdk-group">{header}</div> : null}
                <button
                  className="cmdk-item" data-active={i === active} role="option" aria-selected={i === active}
                  onMouseEnter={() => setActive(i)} onClick={() => c.run()}
                >
                  {c.colour ? <span className="cmdk-dot" style={{ background: c.colour }} /> : <span className="cmdk-dot ghost" />}
                  <span className="cmdk-label">{c.label}</span>
                  {c.hint ? <span className="cmdk-hint">{c.hint}</span> : null}
                </button>
              </div>
            );
          })}
        </div>
        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
