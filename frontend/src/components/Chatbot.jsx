import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const OPENER = {
  role: 'assistant',
  content: 'Ask me how matching works, what projects are open, or how to set up a profile.'
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([OPENER]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages, open]);

  async function send() {
    const question = draft.trim();
    if (!question || busy) return;

    const history = messages.filter((m) => m !== OPENER);
    setMessages([...messages, { role: 'user', content: question }]);
    setDraft('');
    setBusy(true);

    try {
      const { reply } = await api.chat(question, history);
      setMessages((previous) => [...previous, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages((previous) => [...previous, { role: 'assistant', content: `The assistant is unreachable: ${error.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div className="mb-3 flex h-[26rem] w-[21rem] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="label">Support</p>
              <p className="font-display font-semibold">Ask SkillMatch</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close the assistant" className="text-ink-soft hover:text-ink">
              &#10005;
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user' ? 'ml-auto bg-ink text-white' : 'bg-mist text-ink'
                }`}
              >
                {message.content}
              </div>
            ))}
            {busy && <p className="label">Thinking</p>}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2 border-t border-line p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') send(); }}
              placeholder="Type your question"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-teal focus:outline-none"
            />
            <button type="button" onClick={send} disabled={busy} className="rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-teal"
      >
        {open ? 'Hide assistant' : 'Ask a question'}
      </button>
    </div>
  );
}
