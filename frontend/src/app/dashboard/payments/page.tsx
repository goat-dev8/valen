'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Globe, Lock, Zap } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { BudgetFaucetsFab } from '@/components/budget/budget-faucets-fab';
import { X402FlowProgress } from '@/components/payments/x402-flow-progress';
import { X402FlowStepDetails } from '@/components/payments/x402-flow-step-details';
import { X402PaymentActions } from '@/components/payments/x402-payment-actions';
import { X402PaymentConfig } from '@/components/payments/x402-payment-config';
import { X402PaymentSuccess } from '@/components/payments/x402-payment-success';
import { X402PaymentSidebar } from '@/components/payments/x402-payment-sidebar';
import { useX402PaymentFlow } from '@/hooks/use-x402-payment-flow';

const X402_FEATURES = [
  {
    icon: Globe,
    title: 'HTTP-native',
    desc: '402 Payment Required — designed for APIs, paywalls, and agent micropayments.',
  },
  {
    icon: Lock,
    title: 'Budget-governed',
    desc: 'Agent USDC budget and mandate checks before any settlement attempt.',
  },
  {
    icon: Zap,
    title: 'EIP-3009 settle',
    desc: 'Gas-efficient USDC transfer authorization on Arbitrum Sepolia.',
  },
  {
    icon: CreditCard,
    title: 'Public proof',
    desc: 'Every payment or refusal maps to a shareable proof URL.',
  },
];

export default function X402PaymentsPage() {
  const searchParams = useSearchParams();
  const initialAmount = searchParams.get('amount') ?? '0.01';
  const flow = useX402PaymentFlow(initialAmount);

  const canInitiate = Boolean(
    flow.selectedAgent &&
      flow.selectedMandate &&
      flow.matchingAgentIds.has(flow.agentId) &&
      /^0x[a-fA-F0-9]{40}$/.test(flow.recipient) &&
      flow.amount,
  );

  const settled = Boolean(flow.settlementTx);

  return (
    <div className="x402-payments-page">
      <Link href="/dashboard" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Command Center
      </Link>

      <PageHeader
        title="x402 Payments"
        description="Governed HTTP 402 USDC micropayments on Arbitrum Sepolia — initiate, settle with EIP-3009, and share the public proof."
        className="intent-wizard-header"
      />

      <X402FlowProgress
        paymentId={flow.paymentId}
        settlementTx={flow.settlementTx}
        isInitiating={flow.isInitiating}
        isSettling={flow.isSettling}
      />

      <X402FlowStepDetails
        features={X402_FEATURES}
        paymentId={flow.paymentId}
        settlementTx={flow.settlementTx}
        isInitiating={flow.isInitiating}
        isSettling={flow.isSettling}
      />

      <div className="intent-wizard-layout">
        <div className="intent-wizard-main space-y-5">
          {flow.agentsLoading ? (
            <div className="app-panel-floating intent-wizard-panel">
              <p className="text-sm text-[#5E6C7B]">Loading agents…</p>
            </div>
          ) : !flow.agents.length ? (
            <div className="app-panel-floating intent-wizard-panel intent-empty-state">
              <p className="text-sm font-semibold text-[#1A2332]">No active agents</p>
              <p className="mt-2 text-sm text-[#5E6C7B]">Publish an agent with x402 capability before sending payments.</p>
              <Link href="/dashboard/agents/studio" className="app-btn app-btn-primary mt-4">
                Open Agent Studio
              </Link>
            </div>
          ) : settled && flow.paymentId && flow.settlementTx ? (
            <div className="app-panel-floating intent-wizard-panel">
              <X402PaymentSuccess
                paymentId={flow.paymentId}
                settlementTx={flow.settlementTx}
                onReset={flow.resetFlow}
              />
            </div>
          ) : (
            <>
              <div className="app-panel-floating intent-wizard-panel">
                <X402PaymentConfig
                  agents={flow.agents}
                  matchingAgentIds={flow.matchingAgentIds}
                  agentId={flow.agentId}
                  onAgentSelect={flow.setAgentId}
                  amount={flow.amount}
                  onAmountChange={flow.setAmount}
                  recipient={flow.recipient}
                  onRecipientChange={flow.setRecipient}
                  onUseMyWallet={flow.useMyWallet}
                  disabled={Boolean(flow.paymentId)}
                />
              </div>

              <div className="app-panel-floating intent-wizard-panel">
                <X402PaymentActions
                  paymentId={flow.paymentId}
                  settlementTx={flow.settlementTx}
                  canInitiate={canInitiate}
                  isInitiating={flow.isInitiating}
                  isSettling={flow.isSettling}
                  statusMessage={flow.statusMessage}
                  error={flow.error}
                  onInitiate={flow.handleInitiate}
                  onExecute={flow.handleExecute}
                />
              </div>
            </>
          )}
        </div>

        <X402PaymentSidebar
          agentName={flow.selectedAgent?.name}
          amount={flow.amount}
          recipient={flow.recipient}
          mandateId={flow.selectedMandate?.id}
          readiness={flow.readiness}
          agentId={flow.selectedAgent?.id}
          paymentId={flow.paymentId}
        />
      </div>

      <BudgetFaucetsFab />
    </div>
  );
}
