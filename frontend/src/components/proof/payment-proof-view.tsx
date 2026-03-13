'use client';

import Link from 'next/link';
import { CheckCircle, ExternalLink, Package } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PublicProofIdentityPanel } from '@/components/app/public-proof-identity-panel';
import { StatusBadge } from '@/components/app/status-badge';
import { ProofCopyField } from '@/components/proof/proof-copy-field';
import { ProofShareBar } from '@/components/proof/proof-share-bar';
import { ProofVerificationSteps } from '@/components/proof/proof-verification-steps';
import { AssetIcon } from '@/lib/asset-icons';
import { explorerTxUrl } from '@/lib/explorer';
import type { PublicProofDto } from '@/lib/public-proofs';
import { formatProofAmount } from '@/lib/token-amount';

type PaymentProofTone = 'settled' | 'refused' | 'pending';

function paymentProofTone(status: string): PaymentProofTone {
  if (status === 'settled' || status === 'executed') return 'settled';
  if (/refus|reject|fail|denied/i.test(status)) return 'refused';
  return 'pending';
}

function paymentProofTitle(tone: PaymentProofTone): string {
  if (tone === 'settled') return 'Payment settled';
  if (tone === 'refused') return 'Payment refused';
  return 'Payment proof';
}

function truncateTx(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

type PaymentProofViewProps = {
  proof: PublicProofDto;
  proofUrl: string;
};

export function PaymentProofView({ proof, proofUrl }: PaymentProofViewProps) {
  const tone = paymentProofTone(proof.status);
  const symbol = proof.asset ?? 'USDC';
  const amount = formatProofAmount(proof.amount, proof.chainId, proof.asset, 'USDC');

  return (
    <div className={`payment-proof-page payment-proof-page--${tone}`}>
      <header className={`payment-proof-hero payment-proof-hero--${tone}`}>
        <div className="payment-proof-hero__lead">
          <div className="payment-proof-hero__icon-wrap">
            <AssetIcon symbol={symbol} size={40} />
          </div>
          <div className="payment-proof-hero__copy">
            <p className="payment-proof-hero__eyebrow">x402 payment proof</p>
            <h1 className="payment-proof-hero__title">{paymentProofTitle(tone)}</h1>
            <p className="payment-proof-hero__desc">
              Public proof of a governed x402 USDC payment or refusal — schema-frozen at proofVersion{' '}
              {proof.proofVersion}.
            </p>
          </div>
        </div>

        <p className="payment-proof-hero__amount">{amount}</p>

        <div className="payment-proof-hero__meta">
          <StatusBadge status={proof.status} />
          <ChainBadge chainId={proof.chainId} />
          <time dateTime={proof.publishedAt} className="payment-proof-hero__date">
            Published {new Date(proof.publishedAt).toLocaleString()}
          </time>
        </div>

        {tone === 'settled' && (
          <p className="payment-proof-hero__verified">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
            On-chain settlement evidence recorded
          </p>
        )}
      </header>

      <div className="public-proof-layout">
        <div className="public-proof-main">
          <ProofShareBar url={proofUrl} />

          <section className="app-panel-floating payment-proof-evidence">
            <h2 className="payment-proof-section-title">Evidence record</h2>
            <p className="payment-proof-section-desc">
              Immutable identifiers and hashes for independent verification.
            </p>

            <div className="payment-proof-fields">
              <ProofCopyField label="Payment ID" value={proof.id} />
              <div className="payment-proof-field payment-proof-field--amount">
                <p className="payment-proof-field__label">Amount</p>
                <p className="payment-proof-field__value">{amount}</p>
              </div>
              {proof.evidenceHash && <ProofCopyField label="Evidence hash" value={proof.evidenceHash} />}
              {proof.mandateHash && <ProofCopyField label="Mandate hash" value={proof.mandateHash} />}
              {proof.settlementTx && (
                <div className="payment-proof-field">
                  <p className="payment-proof-field__label">Settlement tx</p>
                  <div className="payment-proof-field__value">
                    <a
                      href={explorerTxUrl(proof.chainId, proof.settlementTx)}
                      target="_blank"
                      rel="noreferrer"
                      className="payment-proof-tx-link"
                    >
                      <span className="font-mono text-xs">{truncateTx(proof.settlementTx)}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="payment-proof-actions">
              {proof.settlementTx && (
                <a
                  href={explorerTxUrl(proof.chainId, proof.settlementTx)}
                  target="_blank"
                  rel="noreferrer"
                  className="app-btn app-btn-primary"
                >
                  View on Arbiscan
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Link href="/proofs/pack" className="app-btn app-btn-outline">
                <Package className="h-4 w-4" />
                Proof pack
              </Link>
              <Link href="/dashboard/payments" className="app-btn app-btn-outline">
                New x402 payment
              </Link>
            </div>
          </section>

          {proof.identity && (
            <section className="app-panel-floating payment-proof-identity">
              <h2 className="payment-proof-section-title">Agent identity</h2>
              <PublicProofIdentityPanel proof={proof} />
            </section>
          )}
        </div>

        <aside className="public-proof-sidebar">
          <ProofVerificationSteps variant="sidebar" />
        </aside>
      </div>
    </div>
  );
}
