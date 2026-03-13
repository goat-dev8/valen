'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { BudgetMeter } from '@/components/app/budget-meter';
import { ChainBadge } from '@/components/app/chain-badge';
import { X402PaymentActions } from '@/components/payments/x402-payment-actions';
import { X402PaymentConfig } from '@/components/payments/x402-payment-config';
import { X402PaymentSuccess } from '@/components/payments/x402-payment-success';
import { useX402PaymentFlow } from '@/hooks/use-x402-payment-flow';
import { X402_CHAIN_ID } from '@/lib/x402-constants';

export function X402PaymentDrawer({
  open,
  onClose,
  initialAmount = '0.01',
}: {
  open: boolean;
  onClose: () => void;
  initialAmount?: string;
}) {
  const flow = useX402PaymentFlow(initialAmount);

  useEffect(() => {
    if (!open) flow.resetFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when drawer closes
  }, [open]);

  if (!open) return null;

  const canInitiate = Boolean(
    flow.selectedAgent &&
      flow.selectedMandate &&
      flow.matchingAgentIds.has(flow.agentId) &&
      /^0x[a-fA-F0-9]{40}$/.test(flow.recipient) &&
      flow.amount,
  );

  const settled = Boolean(flow.settlementTx && flow.paymentId);

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl motion-safe:animate-[slide-in-right_220ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="x402 payment drawer"
      >
        <div className="flex items-center justify-between border-b border-[#E8ECF0] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF]">x402 payment</p>
            <h2 className="text-lg font-bold text-[#1A2332]">Governed USDC settlement</h2>
          </div>
          <button type="button" onClick={onClose} className="app-header-icon" aria-label="Close drawer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!flow.agents.length ? (
            <p className="text-sm text-[#5E6C7B]">No active agents. Open Agent Studio to publish one.</p>
          ) : settled ? (
            <X402PaymentSuccess
              paymentId={flow.paymentId!}
              settlementTx={flow.settlementTx!}
              onReset={flow.resetFlow}
            />
          ) : (
            <>
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

              <div className="rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] p-3 text-sm">
                <ChainBadge chainId={X402_CHAIN_ID} />
              </div>

              <BudgetMeter agentId={flow.selectedAgent?.id} showTopup chainId={X402_CHAIN_ID} />

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
            </>
          )}

          <Link href="/dashboard/payments" className="text-xs font-semibold text-[#0066FF] hover:underline">
            Open full payments page →
          </Link>
        </div>
      </div>
    </div>
  );
}
