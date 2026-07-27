import { useEffect, useRef, useState } from 'react';
import type { Aura, Chart, LifeArea } from '@aura/engine';
import { askMentor, isChatLive, type ChatTurn } from '../services/chat';
import { OrbChip } from '../components/AuraOrb';
import { EmptyState } from '../components/States';
import { Button } from '@/components/ui/button';

const STARTERS = [
  'Should I change jobs this year?',
  'What are my chances in love right now?',
  'What should I focus on this month?',
  'Why do I feel so stuck lately?',
];

/** Renders the mentor's light markdown: **bold** inline, and a **heading** alone on a line. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const heading = /^\*\*(.+?)\*\*:?$/.exec(block.trim());
        if (heading) return <div className="msg-h" key={i}>{heading[1]}</div>;
        const parts = block.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
          <p className="msg-p" key={i}>
            {parts.map((p, j) => (p.startsWith('**') && p.endsWith('**')
              ? <b key={j}>{p.slice(2, -2)}</b>
              : <span key={j}>{p}</span>))}
          </p>
        );
      })}
    </>
  );
}

interface Turn extends ChatTurn {
  /** Which chart tools produced this answer — the mentor's version of citations. */
  sources?: string[];
  followUps?: string[];
  /** Why this answer is the plainer, chart-only one (quota, bad key, offline). */
  degradedNote?: string;
}

const HISTORY_KEY = 'aura.chat';

export function Chat({ aura, chart, now, goalArea, userKey }: {
  aura: Aura; chart: Chart; now: Date; goalArea?: LifeArea; userKey: string;
}) {
  // Conversation is kept per identity, so switching users never shows someone else's chat.
  const storeKey = `${HISTORY_KEY}.${userKey}`;
  const [messages, setMessages] = useState<Turn[]>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) ?? '[]') as Turn[]; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState('');
  const [streaming, setStreaming] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy, streaming]);
  useEffect(() => {
    // Keep only the last 20 turns — enough for continuity, small enough for storage.
    try { localStorage.setItem(storeKey, JSON.stringify(messages.slice(-20))); } catch { /* quota */ }
  }, [messages, storeKey]);
  // A different person signing in must not inherit the previous conversation.
  useEffect(() => {
    try { setMessages(JSON.parse(localStorage.getItem(storeKey) ?? '[]') as Turn[]); } catch { setMessages([]); }
  }, [storeKey]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput('');
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setBusy(true); setActivity('Reading your chart'); setStreaming('');

    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await askMentor(msg, aura, chart, now, history, {
        goalArea,
        signal: ctl.signal,
        onActivity: (label) => setActivity(label),
        onDelta: (chunk) => setStreaming((s) => s + chunk),
      });
      setMessages((m) => [...m, { role: 'mentor', text: res.text, sources: res.sources, followUps: res.followUps, degradedNote: res.degraded?.note }]);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') {
        setMessages((m) => [...m, { role: 'mentor', text: 'Stopped there. Ask me again whenever you like.' }]);
      } else {
        setMessages((m) => [...m, { role: 'mentor', text: 'Something glitched on my end. Try that again in a moment.' }]);
      }
    } finally {
      setBusy(false); setActivity(''); setStreaming(''); abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();
  const clear = () => { setMessages([]); try { localStorage.removeItem(storeKey); } catch { /* ignore */ } };

  return (
    <div className="chat">
      <div className="chat-head">
        <OrbChip e1="#8E93C8" e2="#AE8FE6" size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="serif-h" style={{ fontSize: 25 }}>Cosmic Mentor</h2>
          <div className="chat-sub">
            Ask anything. I read your real chart before I answer{isChatLive() ? '' : ' (offline mode — add a key in Settings for richer replies)'}.
          </div>
        </div>
        {messages.length > 0 ? (
          <button className="chat-clear" onClick={clear} title="Start a new conversation">New chat</button>
        ) : null}
      </div>

      <div className="chat-log" role="log" aria-live="polite" aria-atomic="false">
        {messages.length === 0 && !busy ? (
          <EmptyState
            title="What do you actually want to know?"
            body="I read your real birth chart and your current timing before answering — so ask me something specific, the way you would ask a friend who happens to know the craft."
            hint="Your conversation stays on this device."
          />
        ) : null}

        {messages.length === 0 && !busy ? (
          <div className="chat-starters">
            <div className="label" style={{ marginBottom: 4 }}>Try asking</div>
            {STARTERS.map((s) => <button key={s} className="starter" onClick={() => send(s)}>{s}</button>)}
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i}>
            <div className={`bubble ${m.role}`}>
              {m.role === 'mentor' ? <RichText text={m.text} /> : m.text}
            </div>
            {m.degradedNote ? <div className="msg-degraded">{m.degradedNote}</div> : null}
            {m.sources?.length ? (
              <details className="msg-sources">
                <summary>How I worked this out</summary>
                <ul>{m.sources.map((s) => <li key={s}>{s}</li>)}</ul>
              </details>
            ) : null}
            {m.followUps?.length && i === messages.length - 1 && !busy ? (
              <div className="followups">
                {m.followUps.map((f) => (
                  <button key={f} className="followup" onClick={() => send(f)}>{f}</button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {busy ? (
          <div className="bubble mentor">
            {streaming
              ? <RichText text={streaming} />
              : (
                <span className="think">
                  <span className="think-dots" aria-hidden><i /><i /><i /></span>
                  {activity || 'Reading your chart'}…
                </span>
              )}
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your situation…"
          aria-label="Message the Cosmic Mentor"
        />
        {busy ? (
          <Button type="button" size="sm" variant="ghost" onClick={stop} className="!w-auto shrink-0 px-5">Stop</Button>
        ) : (
          <Button type="submit" size="sm" disabled={!input.trim()} className="!w-auto shrink-0 px-5">Send</Button>
        )}
      </form>
    </div>
  );
}
