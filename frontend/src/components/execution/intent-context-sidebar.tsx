'use client';

import Link from 'next/link';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { BudgetMeter } from '@/components/app/budget-meter';
import { SelectedAssetBalance } from '@/components/app/selected-asset-balance';
import { WalletBalancesPanel } from '@/components/app/wallet-balances-panel';
import { AssetIcon } from '@/lib/asset-icons';
import { executionAmountLabel } from '@/lib/amount';
import { chainName } from '@/lib/constants';
import type { IntentTemplate } from '@/lib/intent-templates';
import { intentTemplateSymbol } from '@/lib/intent-template-ui';

type ReadinessItem = {
  label: string;
  complete: boolean;
  href?: string;
};

type IntentContextSidebarProps = {
  template: IntentTemplate;
  targetAddress: string;
  amount: string;
  amountDecimals: number;
  amountSymbol: string;
  assetSymbol: string;
  resolvedAsset: string;
  mandateId?: string;
  agentName?: string;
  approvalExplanation: string;
  readiness: ReadinessItem[];
  showUsdcBudget: boolean;
  agentId?: string;
  connectedWallet?: string;
  wizardStep: number;
};

export function IntentContextSidebar({
  template,
  targetAddress,
  amount,
  amountDecimals,
  amountSymbol,
  assetSymbol,
  resolvedAsset,
  mandateId,
  agentName,
  approvalExplanation,
  readiness,
  showUsdcBudget,
  agentId,
  connectedWallet,
  wizardStep,
}: IntentContextSidebarProps) {
  const symbol = intentTemplateSymbol(template);
  const amountDisplay = amount ? executionAmountLabel(amount, amountDecimals, amountSymbol) : '—';
  const allReady = readiness.every((item) => item.complete);

  return (
    <aside className="intent-context-sidebar" aria-label="Intent preview and readiness">
      <section className="intent-live-preview">
        <p className="intent-sidebar-eyebrow">Live preview</p>
        <div className="intent-live-preview__hero">
          <AssetIcon symbol={symbol} size={40} />
          <div className="min-w-0">
            <p className="intent-live-preview__action">{template.name}</p>
            <p className="intent-live-preview__amount">{amountDisplay}</p>
          </div>
        </div>
        <dl className="intent-live-preview__details">
          <div>
            <dt>Agent</dt>
            <dd>{agentName ?? 'Not selected'}</dd>
          </div>
          <div>
            <dt>Chain</dt>
            <dd>{chainName(template.targetChainId)}</dd>
          </div>
          <div>
            <dt>Asset</dt>
            <dd>{assetSymbol}</dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd className="font-mono text-xs">{targetAddress.slice(0, 8)}…{targetAddress.slice(-6)}</dd>
          </div>
        </dl>
      </section>

      <section className="intent-readiness-panel">
        <div className="flex items-center justify-between gap-2">
          <p className="intent-sidebar-eyebrow">Readiness</p>
          <span
            className={`intent-readiness-pill ${allReady ? 'intent-readiness-pill--ready' : 'intent-readiness-pill--pending'}`}
          >
            {allReady ? 'Ready to submit' : 'Action needed'}
          </span>
        </div>
        <ul className="intent-readiness-list">
          {readiness.map((item) => (
            <li key={item.label} className={`intent-readiness-item ${item.complete ? 'intent-readiness-item--done' : ''}`}>
              {item.complete ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#CBD5E1]" />
              )}
              <span className="flex-1 text-sm font-medium text-[#1A2332]">{item.label}</span>
              {!item.complete && item.href && (
                <Link href={item.href} className="text-xs font-semibold text-[#0066FF] hover:underline">
                  Fix
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="intent-readiness-note">{approvalExplanation}</p>
      </section>

      {showUsdcBudget && agentId ? (
        <section className="intent-sidebar-card">
          <p className="intent-sidebar-eyebrow">USDC budget</p>
          <BudgetMeter agentId={agentId} compact chainId={421614} />
        </section>
      ) : (
        <section className="intent-sidebar-card">
          <p className="intent-sidebar-eyebrow">{amountSymbol} balance</p>
          <SelectedAssetBalance
            walletAddress={connectedWallet}
            chainId={template.targetChainId}
            assetValue={resolvedAsset}
          />
        </section>
      )}

      {connectedWallet && (
        <section className="intent-sidebar-card">
          <p className="intent-sidebar-eyebrow">Wallet on chain</p>
          <WalletBalancesPanel walletAddress={connectedWallet} chainId={template.targetChainId} compact />
        </section>
      )}

      {wizardStep >= 4 && mandateId && (
        <section className="intent-sidebar-card intent-sidebar-card--muted">
          <p className="text-xs leading-5 text-[#5E6C7B]">
            Submitting creates an execution pipeline. You&apos;ll land on the pipeline view, then get a public proof URL
            when the outcome is final.
          </p>
          <Link href="/dashboard/proofs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0066FF]">
            Outcome Ledger
            <ExternalLink className="h-3 w-3" />
          </Link>
        </section>
      )}
    </aside>
  );
}
