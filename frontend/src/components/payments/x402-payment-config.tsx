'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bot, CheckCircle, ChevronDown, Wallet } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { X402_AMOUNT_PRESETS } from '@/lib/x402-constants';
import type { AgentDto } from '@/types/api';

const COLLAPSED_AGENT_COUNT = 3;

function agentsForDisplay(agents: AgentDto[], agentId: string, showAll: boolean): AgentDto[] {
  if (showAll || agents.length <= COLLAPSED_AGENT_COUNT) return agents;

  const tail = agents.slice(-COLLAPSED_AGENT_COUNT);
  const selected = agents.find((agent) => agent.id === agentId);
  if (selected && !tail.some((agent) => agent.id === selected.id)) {
    return [selected, ...tail.filter((agent) => agent.id !== selected.id)].slice(0, COLLAPSED_AGENT_COUNT);
  }
  return tail;
}

type X402PaymentConfigProps = {
  agents: AgentDto[];
  matchingAgentIds: Set<string>;
  agentId: string;
  onAgentSelect: (id: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  recipient: string;
  onRecipientChange: (value: string) => void;
  onUseMyWallet?: () => void;
  disabled?: boolean;
};

export function X402PaymentConfig({
  agents,
  matchingAgentIds,
  agentId,
  onAgentSelect,
  amount,
  onAmountChange,
  recipient,
  onRecipientChange,
  onUseMyWallet,
  disabled,
}: X402PaymentConfigProps) {
  const [showAllAgents, setShowAllAgents] = useState(false);
  const visibleAgents = useMemo(
    () => agentsForDisplay(agents, agentId, showAllAgents),
    [agents, agentId, showAllAgents],
  );
  const canExpandAgents = agents.length > COLLAPSED_AGENT_COUNT;

  return (
    <div className="x402-payment-config">
      <div className="intent-step-intro">
        <p className="intent-step-eyebrow">HTTP 402 · Arbitrum Sepolia</p>
        <h2 className="intent-step-title">Configure USDC payment</h2>
        <p className="intent-step-desc">
          Choose the governed agent, amount, and recipient. Budget and mandate gates run before settlement.
        </p>
      </div>

      <div className="x402-payment-config__amount-block">
        <label htmlFor="x402-amount" className="x402-payment-config__amount-label">
          Amount
        </label>
        <div className="x402-payment-config__amount-row">
          <AssetIcon symbol="USDC" size={32} />
          <input
            id="x402-amount"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="x402-payment-config__amount-input"
            inputMode="decimal"
            disabled={disabled}
            placeholder="0.00"
          />
          <span className="x402-payment-config__amount-unit">USDC</span>
        </div>
        <div className="x402-amount-presets">
          {X402_AMOUNT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onAmountChange(preset)}
              className={`x402-amount-preset ${amount === preset ? 'x402-amount-preset--active' : ''}`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="x402-payment-config__section">
        <div className="x402-agent-section__header">
          <p className="x402-payment-config__section-label">Paying agent</p>
          {canExpandAgents && (
            <button
              type="button"
              className="x402-agent-section__toggle"
              onClick={() => setShowAllAgents((current) => !current)}
              aria-expanded={showAllAgents}
            >
              {showAllAgents ? 'Show less' : `All ${agents.length} agents`}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllAgents ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <div className={`intent-agent-grid ${showAllAgents ? '' : 'intent-agent-grid--compact'}`}>
          {visibleAgents.map((agent) => {
            const matches = matchingAgentIds.has(agent.id);
            const selected = agent.id === agentId;
            return (
              <button
                key={agent.id}
                type="button"
                disabled={disabled}
                onClick={() => onAgentSelect(agent.id)}
                className={`intent-agent-card ${selected ? 'intent-agent-card--selected' : ''} ${
                  matches ? 'intent-agent-card--ready' : 'intent-agent-card--blocked'
                }`}
              >
                <span className="intent-agent-card__avatar">
                  <Bot className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="intent-agent-card__name">{agent.name}</span>
                  <span className="intent-agent-card__status">
                    {matches ? 'USDC mandate ready' : 'No USDC mandate'}
                  </span>
                </span>
                {selected && <CheckCircle className="h-5 w-5 shrink-0 text-[#0066FF]" aria-hidden />}
              </button>
            );
          })}
        </div>
        {!matchingAgentIds.size && (
          <p className="intent-hint intent-hint--warn">
            No agent has a USDC mandate.{' '}
            <Link href="/dashboard/authority" className="font-semibold text-[#0066FF] hover:underline">
              Set up authority →
            </Link>
          </p>
        )}
      </div>

      <div className="x402-payment-config__section x402-payment-config__recipient-block">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="x402-recipient" className="x402-payment-config__recipient-label">
            Recipient wallet
          </label>
          {onUseMyWallet && (
            <button type="button" className="x402-use-wallet-btn" onClick={onUseMyWallet} disabled={disabled}>
              <Wallet className="h-4 w-4" />
              Use my wallet
            </button>
          )}
        </div>
        <input
          id="x402-recipient"
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
          className="x402-payment-config__recipient-input"
          placeholder="0x…"
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
