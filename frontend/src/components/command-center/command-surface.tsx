'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CommandGateBanner, CommandPreviewCard } from '@/components/command-center/command-preview-card';
import { evaluateCommandGates } from '@/lib/command-gates';
import { hrefForParsedCommand, parseCommand, type ParsedCommand } from '@/lib/command-parser';
import { INTENT_TEMPLATES } from '@/lib/intent-templates';
import type { DashboardSummaryDto } from '@/types/api';

const QUICK_CHIPS = [
  { label: 'Allowed USDC', templateId: 'arbitrum-usdc' },
  { label: 'Refused TSLA', templateId: 'robinhood-tsla-refused' },
  { label: 'x402 Payment', action: 'x402' as const },
  { label: 'Outcome ledger', href: '/dashboard/proofs' },
];

function templateHref(templateId: string): string {
  const template = INTENT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return `/dashboard/executions/new?template=${templateId}`;
  const params = new URLSearchParams({ template: templateId, amount: template.amount });
  return `/dashboard/executions/new?${params.toString()}`;
}

type CommandSurfaceProps = {
  summary?: DashboardSummaryDto | null;
  onParsed?: (cmd: ParsedCommand) => void;
  onX402Open?: (amount?: string) => void;
};

export function CommandSurface({ summary, onParsed, onX402Open }: CommandSurfaceProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedCommand | null>(null);

  const handleChange = useCallback((value: string) => {
    setInput(value);
    setPreview(value.trim() ? parseCommand(value) : null);
  }, []);

  const gateState = useMemo(
    () => (preview ? evaluateCommandGates(preview, summary) : { ready: true, gates: [] }),
    [preview, summary],
  );

  const runCommand = useCallback(() => {
    const parsed = parseCommand(input);
    if (!parsed) return;
    if (parsed.kind === 'x402' && onX402Open) {
      onParsed?.(parsed);
      onX402Open(parsed.amount);
      return;
    }
    const { ready } = evaluateCommandGates(parsed, summary);
    if (!ready) return;
    onParsed?.(parsed);
    router.push(hrefForParsedCommand(parsed));
  }, [input, onParsed, onX402Open, router, summary]);

  const canRun =
    Boolean(preview) &&
    (preview?.kind === 'x402' ? Boolean(onX402Open) && gateState.ready : gateState.ready);

  return (
      <section className="app-panel-floating p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#0066FF]" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0066FF]">Agent command</p>
      </div>
      <p className="mt-2 text-sm text-[#5E6C7B]">
        Run governed actions in plain English — USDC, tokenized assets, x402, and proofs.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canRun) runCommand();
          }}
          placeholder='Try "Pay 0.001 USDC" or "Refused TSLA"'
          className="app-input flex-1 py-3 text-base"
          aria-label="Command input"
        />
        <button
          type="button"
          onClick={runCommand}
          disabled={!canRun}
          className="app-btn app-btn-primary shrink-0 px-6"
        >
          Run
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {preview && (
        <>
          <CommandPreviewCard parsed={preview} agentName={summary?.agent?.name} />
          <CommandGateBanner gates={gateState.gates} />
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              if ('action' in chip && chip.action === 'x402') {
                onX402Open?.('0.01');
                return;
              }
              if ('href' in chip && chip.href) {
                router.push(chip.href);
                return;
              }
              router.push(templateHref(chip.templateId!));
            }}
            className="rounded-full border border-[#E8ECF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5E6C7B] shadow-sm transition hover:border-[#0066FF]/40 hover:text-[#0066FF] hover:shadow"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}
