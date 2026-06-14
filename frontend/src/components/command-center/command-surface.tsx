'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CommandGateBanner, CommandPreviewCard } from '@/components/command-center/command-preview-card';
import { evaluateCommandGates } from '@/lib/command-gates';
import { parseCommand, type ParsedCommand } from '@/lib/command-parser';
import type { DashboardSummaryDto } from '@/types/api';

const QUICK_CHIPS = ['Pay 1 USDC', 'Transfer 1 TSLA to wallet', 'Create treasury agent', 'Show my budgets'];

type CommandSurfaceProps = {
  summary?: DashboardSummaryDto | null;
  onParsed?: (cmd: ParsedCommand) => void;
};

/** Legacy compact command input — execution happens in CommandAgentConsole, not here. */
export function CommandSurface({ summary, onParsed }: CommandSurfaceProps) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedCommand | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleChange = useCallback((value: string) => {
    setInput(value);
    setPreview(value.trim() ? parseCommand(value) : null);
    setNotice(null);
  }, []);

  const gateState = useMemo(
    () => (preview ? evaluateCommandGates(preview, summary) : { ready: true, gates: [] }),
    [preview, summary],
  );

  const runCommand = useCallback(() => {
    const parsed = parseCommand(input);
    if (!parsed) return;
    onParsed?.(parsed);
    setNotice('Use the Command Agent panel below — Plan then Execute to run governance in-console.');
  }, [input, onParsed]);

  return (
    <section className="app-panel-floating p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#0066FF]" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0066FF]">Quick command</p>
      </div>
      <p className="mt-2 text-sm text-[#5E6C7B]">Parse intents here — execution runs in the Command Agent console.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && preview) runCommand();
          }}
          placeholder='Try "Pay 1 USDC" or "Transfer 1 TSLA"'
          className="app-input flex-1 py-3 text-base"
          aria-label="Command input"
        />
        <button type="button" onClick={runCommand} disabled={!preview} className="app-btn app-btn-primary shrink-0 px-6">
          Parse
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {notice && <p className="mt-3 text-sm font-medium text-[#0066FF]">{notice}</p>}

      {preview && (
        <>
          <CommandPreviewCard parsed={preview} />
          <CommandGateBanner gates={gateState.gates} />
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChange(chip)}
            className="rounded-full border border-[#E8ECF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5E6C7B] shadow-sm transition hover:border-[#0066FF]/40 hover:text-[#0066FF] hover:shadow"
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}
