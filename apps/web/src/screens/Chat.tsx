import { useEffect, useRef, useState } from 'react';
import type { Aura, Chart, LifeArea } from '@aura/engine';
import { askMentor, isChatLive, type ChatTurn } from '../services/chat';
import { OrbChip } from '../components/AuraOrb';
import { Button } from '@/components/ui/button';

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

const STARTERS = [
  'Should I change jobs this year?',
  'What are my chances in love right now?',
  'What should I focus on this month?',
  'Why do I feel so stuck lately?',
];

export function Chat({ aura, chart, now, goalArea }: { aura: Aura; chart: Chart; now: Date; goalArea?: LifeArea }) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput('');
    const history = messages;
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setBusy(true);
    try {
      const res = await askMentor(msg, aura, chart, now, history, { goalArea });
      setMessages((m) => [...m, { role: 'mentor', text: res.text }]);
    } catch {
      setMessages((m) => [...m, { role: 'mentor', text: 'Something glitched on my end. Try that again in a moment.' }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="chat">
      <div className="chat-head">
        <OrbChip e1="#8E93C8" e2="#AE8FE6" size={38} />
        <div>
          <h2 className="serif-h" style={{ fontSize: 24 }}>Cosmic Mentor</h2>
          <div className="chat-sub">
            Ask anything. I read your real timing before I answer{isChatLive() ? '' : ' (offline mode — add a key in Settings for richer replies)'}.
          </div>
        </div>
      </div>

      <div className="chat-log" role="log" aria-live="polite" aria-atomic="false">
        {messages.length === 0 ? (
          <div className="chat-starters">
            <div className="label" style={{ marginBottom: 4 }}>Try asking</div>
            {STARTERS.map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === 'mentor' ? <RichText text={m.text} /> : m.text}
            </div>
          ))
        )}
        {busy ? <div className="bubble mentor typing">reading your timing…</div> : null}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your situation…"
          aria-label="Message the Cosmic Mentor"
        />
        <Button type="submit" size="sm" disabled={busy || !input.trim()} className="!w-auto shrink-0 px-5">Send</Button>
      </form>
    </div>
  );
}
