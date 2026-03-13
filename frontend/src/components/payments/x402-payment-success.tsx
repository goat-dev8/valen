'use client';

import Link from 'next/link';
import { CheckCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { explorerTxUrl } from '@/lib/explorer';
import { X402_CHAIN_ID } from '@/lib/x402-constants';

type X402PaymentSuccessProps = {
  paymentId: string;
  settlementTx: string;
  onReset: () => void;
};

export function X402PaymentSuccess({ paymentId, settlementTx, onReset }: X402PaymentSuccessProps) {
  return (
    <div className="x402-payment-success">
      <div className="x402-payment-success__icon-wrap">
        <CheckCircle className="h-10 w-10 text-emerald-600" aria-hidden />
      </div>
      <h2 className="x402-payment-success__title">Payment settled</h2>
      <p className="x402-payment-success__desc">
        Your governed x402 payment completed with on-chain evidence.
      </p>
      <div className="x402-payment-success__links">
        <Link href={`/proofs/payments/${paymentId}`} className="app-btn btn-proof">
          Open public proof
          <ExternalLink className="h-4 w-4" />
        </Link>
        <a
          href={explorerTxUrl(X402_CHAIN_ID, settlementTx)}
          target="_blank"
          rel="noreferrer"
          className="app-btn app-btn-outline"
        >
          View on Arbiscan
        </a>
        <Link href="/dashboard/proofs" className="app-btn app-btn-outline">
          Outcome Ledger
        </Link>
      </div>
      <button type="button" className="x402-reset-btn" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
        New payment
      </button>
    </div>
  );
}
