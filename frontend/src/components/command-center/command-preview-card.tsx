'use client';

import Link from 'next/link';
import { ArrowRight, Bot } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { chainName } from '@/lib/constants';
import type { ParsedCommand } from '@/lib/command-parser';
import { INTENT_TEMPLATES } from '@/lib/intent-templates';

function assetSymbolFor(parsed: ParsedCommand): string | null {
  if (parsed.templateId?.includes('usdc')) return 'USDC';
  if (parsed.templateId?.includes('usdg')) return 'USDG';
  const tickerMatch = parsed.templateId?.match(/robinhood-(\w+)-/);
  if (tickerMatch) return tickerMatch[1].toUpperCase();
  if (parsed.kind === 'x402') return 'USDC';
  return null;
}

function actionLabelFor(parsed: ParsedCommand): string {
  const template = parsed.templateId ? INTENT_TEMPLATES.find((t) => t.id === parsed.templateId) : undefined;
  if (template) return template.name;
  if (parsed.kind === 'x402') return 'x402 USDC payment';
  if (parsed.kind === 'budget') return 'Adjust agent budget';
  if (parsed.kind === 'proof') return 'Open outcome ledger';
  if (parsed.kind === 'agent') return 'Create governed agent';
  if (parsed.kind === 'identity') return 'Register ERC-8004 identity';
  return parsed.label;
}

function chainIdFor(parsed: ParsedCommand): number {
  const template = parsed.templateId ? INTENT_TEMPLATES.find((t) => t.id === parsed.templateId) : undefined;
  if (template) return template.targetChainId;
  if (parsed.kind === 'x402') return 421614;
  return 421614;
}

export function CommandPreviewCard({
  parsed,
  agentName,
  amount,
}: {
  parsed: ParsedCommand;
  agentName?: string | null;
  amount?: string;
}) {
  const symbol = assetSymbolFor(parsed);
  const chainId = chainIdFor(parsed);
  const displayAmount = amount ?? parsed.amount;

  return (
    <div className="command-preview-enter mt-4 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Parsed command</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF]" aria-hidden />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#8B98A5]">Agent</p>
            <p className="text-sm font-medium text-[#1A2332]">{agentName ?? 'Auto-selected agent'}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#8B98A5]">Action</p>
          <p className="text-sm font-medium text-[#1A2332]">{actionLabelFor(parsed)}</p>
        </div>
        {symbol && (
          <div className="flex items-center gap-2">
            <AssetIcon symbol={symbol} size={28} />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#8B98A5]">Asset</p>
              <p className="text-sm font-medium text-[#1A2332]">
                {displayAmount ? `${displayAmount} ` : ''}
                {symbol}
              </p>
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#8B98A5]">Chain</p>
          <span className="mt-1 inline-flex rounded-full border border-[#D1D9E0] bg-white px-2.5 py-0.5 text-xs font-medium text-[#5E6C7B]">
            {chainName(chainId)}
          </span>
        </div>
      </div>
      {parsed.kind === 'unknown' && (
        <p className="mt-3 text-xs text-[#5E6C7B]">
          Opens the governed action builder — refine intent before submission.
        </p>
      )}
    </div>
  );
}

export function CommandGateBanner({ gates }: { gates: import('@/lib/command-gates').CommandGate[] }) {
  const blockers = gates.filter((gate) => !gate.passed);
  if (blockers.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-[#FFFBEB] p-3" role="alert">
      <p className="text-xs font-semibold text-amber-900">Complete setup before running</p>
      <ul className="mt-2 space-y-1.5">
        {blockers.map((gate) => (
          <li key={gate.id} className="flex items-center justify-between gap-2 text-xs text-amber-800">
            <span>{gate.label}</span>
            <Link
              href={gate.href}
              className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:underline"
            >
              {gate.fixLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
