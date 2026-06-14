'use client';

import Link from 'next/link';
import { Bot, ChevronDown } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { ChainBadge } from '@/components/app/chain-badge';
import { chainName } from '@/lib/constants';
import type { CommandExecutionPlan } from '@/lib/command-agent/types';
import type { ParsedCommand } from '@/lib/command-parser';
import { INTENT_TEMPLATES } from '@/lib/intent-templates';
import type { CommandGate } from '@/lib/command-gates';

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
  if (parsed.kind === 'budget') return 'Review USDC budget';
  if (parsed.kind === 'proof') return 'Latest outcome proof';
  if (parsed.kind === 'agent') return 'Create governed agent';
  if (parsed.kind === 'identity') return 'Register ERC-8004 identity';
  return parsed.label;
}

function chainIdFor(parsed: ParsedCommand, plan?: CommandExecutionPlan | null): number {
  if (plan?.chainId) return plan.chainId;
  const template = parsed.templateId ? INTENT_TEMPLATES.find((t) => t.id === parsed.templateId) : undefined;
  if (template) return template.targetChainId;
  if (parsed.kind === 'x402') return 421614;
  return 421614;
}

export function CommandPreviewCard({
  parsed,
  plan,
  selectedAgentId,
  onSelectAgent,
  agentName,
}: {
  parsed: ParsedCommand;
  plan?: CommandExecutionPlan | null;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  /** Legacy prop for CommandSurface quick preview */
  agentName?: string | null;
}) {
  const symbol = assetSymbolFor(parsed);
  const chainId = chainIdFor(parsed, plan);
  const displayAmount = parsed.amount;
  const agent = plan?.agent ?? null;
  const candidates = plan?.agentCandidates ?? [];
  const displayAgentName = agent?.name ?? agentName ?? null;

  return (
    <div className="command-preview-enter mt-4 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Parsed command</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 sm:col-span-2">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#8B98A5]">Agent</p>
            {displayAgentName ? (
              <p className="text-sm font-medium text-[#1A2332]">{displayAgentName}</p>
            ) : plan?.parsed.kind === 'agent' ? (
              <p className="text-sm font-medium text-[#5E6C7B]">None — new agent will be created on execute</p>
            ) : plan?.requiresAgentSelection ? (
              <p className="text-sm font-medium text-amber-800">Select a matching agent to continue</p>
            ) : (
              <p className="text-sm font-medium text-amber-800">No capable agent — execute create-agent command or select below</p>
            )}
            {candidates.length > 0 && onSelectAgent && (
              <div className="relative mt-2">
                <select
                  className="app-input py-2 pr-8 text-sm"
                  value={selectedAgentId ?? agent?.id ?? ''}
                  onChange={(e) => onSelectAgent(e.target.value)}
                >
                  <option value="">Choose matching agent…</option>
                  {candidates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.policyName ? ` · ${item.policyName}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B98A5]" />
              </div>
            )}
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
          <div className="mt-1">
            <ChainBadge chainId={chainId} compact />
            <span className="ml-2 text-xs text-[#5E6C7B]">{chainName(chainId)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommandPlanCard({ plan }: { plan: CommandExecutionPlan }) {
  const budgetLabel =
    plan.budgetStatus === 'passed' ? 'Passed' : plan.budgetStatus === 'blocked' ? 'Blocked' : 'Not required';
  const authorityLabel =
    plan.authorityStatus === 'passed' ? 'Passed' : plan.authorityStatus === 'blocked' ? 'Blocked' : 'Not required';

  return (
    <div className="command-plan-card mt-4 rounded-xl border border-[#DBEAFE] bg-[#F8FBFF] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0066FF]">Plan</p>
      <dl className="command-plan-card__grid mt-3">
        <div className="command-plan-card__wide">
          <dt>Intent</dt>
          <dd>{plan.intentLabel}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>
            {plan.parsed.kind === 'agent'
              ? 'None — creating new agent'
              : plan.agent?.name ?? (plan.requiresAgentSelection ? 'Selection required' : 'None matched')}
          </dd>
        </div>
        <div>
          <dt>Policy</dt>
          <dd>{plan.policyName ?? '—'}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{plan.riskLevel ?? '—'}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>{budgetLabel}</dd>
        </div>
        <div>
          <dt>Authority</dt>
          <dd>{authorityLabel}</dd>
        </div>
        <div className="command-plan-card__wide">
          <dt>Settlement</dt>
          <dd>{plan.settlementPath}</dd>
        </div>
        <div className="command-plan-card__wide">
          <dt>Proof</dt>
          <dd>{plan.proofPath}</dd>
        </div>
        <div className="command-plan-card__wide">
          <dt>Status</dt>
          <dd className="font-semibold">{plan.statusLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

export function CommandGateBanner({
  gates,
  onRemediate,
}: {
  gates: CommandGate[];
  onRemediate?: (gate: CommandGate) => void;
}) {
  const blockers = gates.filter((gate) => !gate.passed);
  if (blockers.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-[#FFFBEB] p-3" role="alert">
      <p className="text-xs font-semibold text-amber-900">Setup required before execution</p>
      <ul className="mt-2 space-y-1.5">
        {blockers.map((gate) => (
          <li key={gate.id} className="flex items-center justify-between gap-2 text-xs text-amber-800">
            <span>{gate.label}</span>
            {gate.id === 'agent-select' ? null : onRemediate ? (
              <button
                type="button"
                className="font-semibold text-amber-900 hover:underline"
                onClick={() => onRemediate(gate)}
              >
                {gate.fixLabel} →
              </button>
            ) : (
              <Link href={gate.href} className="font-semibold text-amber-900 hover:underline">
                {gate.fixLabel} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
