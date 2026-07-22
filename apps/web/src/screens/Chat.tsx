import { useEffect, useRef, useState } from 'react';
import type { Aura, Chart } from '@aura/engine';
import { askMentor, chatEnabled, type ChatTurn } from '../services/chat';
import { OrbChip } from '../components/AuraOrb';
import { Button } from '@/components/ui/button';

const STARTERS = [
  'Why is my relationship so hard right now?',
  'What should I focus on at work this month?',
  'Why do I feel so stuck lately?',
];

export function Chat({ aura, chart, now }: { aura: Aura; chart: Chart; now: Date }) {
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
      const res = await askMentor(msg, aura, chart, now, history);
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
            Ask anything. I read your real timing before I answer{chatEnabled ? '' : ' (offline mode)'}.
          </div>
        </div>
      </div>

      <div className="chat-log">
        {messages.length === 0 ? (
          <div className="chat-starters">
            <div className="label" style={{ marginBottom: 4 }}>Try asking</div>
            {STARTERS.map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)
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
