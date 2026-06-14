'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, Sparkles, User } from 'lucide-react';
import { CommandGateBanner, CommandPreviewCard } from '@/components/command-center/command-preview-card';
import { evaluateCommandGates } from '@/lib/command-gates';
import { buildCommandResponse, buildCommandResult } from '@/lib/command-responses';
import { hrefForParsedCommand, parseCommand, type ParsedCommand } from '@/lib/command-parser';
import type { DashboardSummaryDto } from '@/types/api';

const SUGGESTIONS = [
  'Pay 1 USDC',
  'Create treasury agent',
  'Show latest proofs',
  'Transfer 1 TSLA to wallet',
  'Create x402 payment',
  'Explain policy refusal',
  'Show my budgets',
];

type ChatEntry = {
  id: string;
  role: 'user' | 'valen' | 'result';
  text: string;
  parsed?: ParsedCommand;
};

type CommandAgentConsoleProps = {
  summary?: DashboardSummaryDto | null;
  onParsed?: (cmd: ParsedCommand) => void;
  onX402Open?: (amount?: string) => void;
};

export function CommandAgentConsole({ summary, onParsed, onX402Open }: CommandAgentConsoleProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      role: 'valen',
      text: 'I am VALEN Command Agent. Tell me what to pay, transfer, prove, or configure — I will plan the governed action, run policy gates, and route you to settlement and proof.',
    },
  ]);
  const [activeParsed, setActiveParsed] = useState<ParsedCommand | null>(null);
  const [lastHref, setLastHref] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const gateState = useMemo(
    () => (activeParsed ? evaluateCommandGates(activeParsed, summary) : { ready: true, gates: [] }),
    [activeParsed, summary],
  );

  const pushEntry = useCallback((entry: ChatEntry) => {
    setEntries((current) => [...current, entry]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
  }, []);

  const planCommand = useCallback(
    (raw: string) => {
      const parsed = parseCommand(raw);
      if (!parsed) return;
      pushEntry({ id: `user-${Date.now()}`, role: 'user', text: raw });
      setActiveParsed(parsed);
      pushEntry({
        id: `valen-${Date.now()}`,
        role: 'valen',
        text: buildCommandResponse(parsed),
        parsed,
      });
    },
    [pushEntry],
  );

  const executeCommand = useCallback(() => {
    if (!activeParsed) return;
    if (activeParsed.kind === 'x402' && onX402Open) {
      onParsed?.(activeParsed);
      onX402Open(activeParsed.amount ?? '1');
      pushEntry({
        id: `result-${Date.now()}`,
        role: 'result',
        text: buildCommandResult(activeParsed, '/dashboard/payments'),
        parsed: activeParsed,
      });
      setLastHref('/dashboard/payments');
      return;
    }
    const { ready } = evaluateCommandGates(activeParsed, summary);
    if (!ready) return;
    onParsed?.(activeParsed);
    const href = hrefForParsedCommand(activeParsed);
    setLastHref(href);
    pushEntry({
      id: `result-${Date.now()}`,
      role: 'result',
      text: buildCommandResult(activeParsed, href),
      parsed: activeParsed,
    });
    router.push(href);
  }, [activeParsed, onParsed, onX402Open, pushEntry, router, summary]);

  const canExecute =
    Boolean(activeParsed) &&
    (activeParsed?.kind === 'x402' ? Boolean(onX402Open) && gateState.ready : gateState.ready);

  return (
    <section className="command-agent-console app-panel-floating">
      <div className="command-agent-console__head">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#0066FF]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0066FF]">VALEN Command Agent</p>
        </div>
        <p className="mt-1 text-sm text-[#5E6C7B]">
          Conversational governed operations — plan, preview, execute, and prove.
        </p>
      </div>

      <div ref={scrollRef} className="command-agent-console__thread">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`command-agent-console__bubble command-agent-console__bubble--${entry.role}`}
          >
            <div className="command-agent-console__bubble-icon">
              {entry.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div>
              <p className="command-agent-console__bubble-text">{entry.text}</p>
              {entry.parsed && entry.role === 'valen' && (
                <CommandPreviewCard parsed={entry.parsed} agentName={summary?.agent?.name} />
              )}
              {entry.role === 'result' && lastHref && (
                <div className="command-agent-console__result-links">
                  <Link href={lastHref} className="app-link text-sm">
                    Open governed flow
                  </Link>
                  <Link href="/dashboard/proofs" className="app-link text-sm">
                    Outcome ledger
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeParsed && <CommandGateBanner gates={gateState.gates} />}

      <div className="command-agent-console__composer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              planCommand(input);
              setInput('');
            }
          }}
          placeholder="Pay 1 USDC, transfer TSLA, show budgets, create x402 payment…"
          className="app-input flex-1 py-3 text-base"
          aria-label="Command agent input"
        />
        <button
          type="button"
          className="app-btn app-btn-outline shrink-0"
          disabled={!input.trim()}
          onClick={() => {
            if (!input.trim()) return;
            planCommand(input);
            setInput('');
          }}
        >
          Plan
        </button>
        <button type="button" className="app-btn app-btn-primary shrink-0" disabled={!canExecute} onClick={executeCommand}>
          Execute
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="command-agent-console__suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="command-agent-console__chip"
            onClick={() => planCommand(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
