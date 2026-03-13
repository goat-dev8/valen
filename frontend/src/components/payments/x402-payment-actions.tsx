'use client';

import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

type X402PaymentActionsProps = {
  paymentId: string | null;
  settlementTx: string | null;
  canInitiate: boolean;
  isInitiating: boolean;
  isSettling: boolean;
  statusMessage: string | null;
  error: string | null;
  onInitiate: () => void;
  onExecute: () => void;
};

export function X402PaymentActions({
  paymentId,
  settlementTx,
  canInitiate,
  isInitiating,
  isSettling,
  statusMessage,
  error,
  onInitiate,
  onExecute,
}: X402PaymentActionsProps) {
  if (settlementTx) return null;

  return (
    <div className="x402-payment-actions">
      {!paymentId ? (
        <div className="x402-payment-actions__block">
          <p className="x402-payment-actions__title">Step 1 · Initiate payment</p>
          <p className="x402-payment-actions__desc">
            Creates a governed x402 payment intent. Compliance and budget gates run before settlement is allowed.
          </p>
          <button
            type="button"
            className="app-btn app-btn-primary"
            disabled={!canInitiate || isInitiating}
            onClick={onInitiate}
          >
            {isInitiating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initiating…
              </>
            ) : (
              <>
                Initiate payment
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="x402-payment-actions__block x402-payment-actions__block--active">
          <p className="x402-payment-actions__title">Step 2 · Settle on-chain</p>
          <p className="x402-payment-actions__desc">
            Payment intent <code className="text-xs">{paymentId.slice(0, 10)}…</code> is ready. Execute EIP-3009 USDC
            settlement on Arbitrum Sepolia.
          </p>
          <button type="button" className="app-btn app-btn-primary" disabled={isSettling} onClick={onExecute}>
            {isSettling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Settling…
              </>
            ) : (
              <>
                Execute settlement
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {error && <p className="intent-error">{error}</p>}
      {statusMessage && (
        <div className="x402-status-banner">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          {statusMessage}
        </div>
      )}
    </div>
  );
}
