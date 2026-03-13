'use client';

import Link from 'next/link';
import { CheckCircle, Circle, ShieldAlert } from 'lucide-react';
import { BudgetMeter } from '@/components/app/budget-meter';
import { ChainBadge } from '@/components/app/chain-badge';
import { BudgetFaucetsFab } from '@/components/budget/budget-faucets-fab';
import { AssetIcon } from '@/lib/asset-icons';import { X402_CHAIN_ID } from '@/lib/x402-constants';

type ReadinessItem = {
  label: string;
  complete: boolean;
  href?: string;
};

type X402PaymentSidebarProps = {
  agentName?: string;
  amount: string;
  recipient: string;
  mandateId?: string;
  readiness: ReadinessItem[];
  agentId?: string;
  paymentId: string | null;
};

export function X402PaymentSidebar({
  agentName,
  amount,
  recipient,
  mandateId,
  readiness,
  agentId,
  paymentId,
}: X402PaymentSidebarProps) {
  const allReady = readiness.slice(0, 3).every((item) => item.complete);
  const shortRecipient =
    recipient.length >= 10 ? `${recipient.slice(0, 6)}…${recipient.slice(-4)}` : recipient || '—';

  return (
    <aside className="x402-payment-sidebar" aria-label="Payment preview">
      <section className="intent-live-preview">
        <p className="intent-sidebar-eyebrow">Live preview</p>
        <div className="intent-live-preview__hero">
          <AssetIcon symbol="USDC" size={40} />
          <div className="min-w-0">
            <p className="intent-live-preview__action">x402 USDC payment</p>
            <p className="intent-live-preview__amount">{amount || '—'} USDC</p>
          </div>
        </div>
        <dl className="intent-live-preview__details">
          <div>
            <dt>Agent</dt>
            <dd>{agentName ?? 'Not selected'}</dd>
          </div>
          <div>
            <dt>Chain</dt>
            <dd>
              <ChainBadge chainId={X402_CHAIN_ID} />
            </dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd className="font-mono text-xs">{shortRecipient}</dd>
          </div>
          {paymentId && (
            <div>
              <dt>Payment ID</dt>
              <dd className="font-mono text-xs">{paymentId.slice(0, 10)}…</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="intent-readiness-panel">
        <div className="flex items-center justify-between gap-2">
          <p className="intent-sidebar-eyebrow">Readiness</p>
          <span
            className={`intent-readiness-pill ${allReady ? 'intent-readiness-pill--ready' : 'intent-readiness-pill--pending'}`}
          >
            {allReady ? 'Ready' : 'Setup needed'}
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
        {mandateId && (
          <p className="intent-readiness-note">
            Mandate <code className="text-xs">{mandateId.slice(0, 12)}…</code>
          </p>
        )}
      </section>

      <section className="intent-sidebar-card x402-budget-card">
        <p className="intent-sidebar-eyebrow">USDC budget</p>
        <BudgetMeter agentId={agentId} showTopup chainId={X402_CHAIN_ID} />
        <p className="mt-3 text-xs leading-5 text-[#5E6C7B]">
          Top up agent budget after funding your wallet with testnet USDC and gas on Arbitrum Sepolia.
        </p>
        <BudgetFaucetsFab inline />
      </section>

      <section className="intent-sidebar-card intent-sidebar-card--muted">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-[#1A2332]">Refusal path</p>
            <p className="mt-1 text-xs leading-5 text-[#5E6C7B]">
              Exceed budget or use an invalid mandate to test governed refusals with public proof.
            </p>
            <Link href="/dashboard/executions/new?template=arbitrum-usdc" className="mt-2 inline-block text-xs font-semibold text-[#0066FF] hover:underline">
              Try transfer demo →
            </Link>
          </div>
        </div>
      </section>
    </aside>
  );
}
