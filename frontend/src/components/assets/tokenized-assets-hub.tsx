'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { AssetPill } from '@/components/app/asset-pill';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useDashboardSummary, useMandates } from '@/hooks/use-valen-api';
import { ROBINHOOD_HEADLINE_ASSETS } from '@/lib/known-assets';

const USDC_ASSET = {
  symbol: 'USDC',
  label: 'Arbitrum Sepolia USDC',
  chainId: 421614,
  allowedTemplate: 'arbitrum-usdc',
};

export function TokenizedAssetsHub() {
  const { data: mandates } = useMandates();
  const { data: summary } = useDashboardSummary();
  const robinhoodMandates =
    mandates?.filter((mandate) => mandate.status === 'active' && mandate.allowedChains.includes(46630)) ?? [];
  const latestRobinhood = summary?.latest.robinhood;
  const latestProof = summary?.latest.proof;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tokenized Assets"
        description="Governed USDC on Arbitrum and tokenized equities on Robinhood Testnet — allowed and refused paths with public proof."
      >
        <ChainBadge chainId={46630} />
        <Link href="/dashboard/executions/new?template=arbitrum-usdc" className="app-btn app-btn-primary">
          Governed Intent
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="app-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066FF]">Governed assets</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#1A2332]">Allowed action, refused action, proof either way.</h2>
          <p className="mt-3 text-sm leading-6 text-[#5E6C7B]">
            USDC on Arbitrum Sepolia plus TSLA, AMZN, PLTR, NFLX, AMD, and USDG on Robinhood Testnet — each with governed
            settlement and public proof URLs.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-emerald-800">Allowed path</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">Within-cap transfer settles on-chain with proof.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <p className="mt-2 text-sm font-semibold text-amber-800">Refused path</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">Over-limit actions produce refusal proofs.</p>
            </div>
          </div>
        </div>

        <div className="app-card">
          <h3 className="app-card-title">Readiness</h3>
          <dl className="app-detail-list mt-4">
            <div><dt>Active Robinhood mandates</dt><dd>{robinhoodMandates.length}</dd></div>
            <div><dt>Latest Robinhood proof</dt><dd>{latestRobinhood?.executionId?.slice(0, 8) ?? 'Run an action'}</dd></div>
            <div><dt>Latest USDC proof</dt><dd>{latestProof?.executionId?.slice(0, 8) ?? 'Run USDC demo'}</dd></div>
          </dl>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#1A2332]">Arbitrum Sepolia</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="app-card">
            <div className="flex items-center gap-3">
              <AssetIcon symbol={USDC_ASSET.symbol} size={40} />
              <div>
                <h4 className="text-lg font-semibold">{USDC_ASSET.symbol}</h4>
                <ChainBadge chainId={USDC_ASSET.chainId} />
              </div>
            </div>
            <p className="mt-3 text-sm text-[#5E6C7B]">{USDC_ASSET.label}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/executions/new?template=${USDC_ASSET.allowedTemplate}`}
                className="app-btn app-btn-primary text-xs"
              >
                Run allowed
              </Link>
              <Link href="/dashboard/payments" className="app-btn app-btn-outline text-xs">
                x402 payment
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#1A2332]">Robinhood Testnet</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROBINHOOD_HEADLINE_ASSETS.map((asset) => {
            const ticker = asset.symbol.toLowerCase();
            const allowed = `robinhood-${ticker}-allowed`;
            const refused = `robinhood-${ticker}-refused`;
            return (
              <article key={asset.symbol} className="app-card">
                <AssetPill asset={asset} />
                <h4 className="mt-3 text-xl font-semibold text-[#1A2332]">{asset.symbol}</h4>
                <p className="mt-1 text-sm text-[#5E6C7B]">{asset.label}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/dashboard/executions/new?template=${allowed}`} className="app-btn app-btn-primary text-xs">
                    Run allowed
                  </Link>
                  <Link href={`/dashboard/executions/new?template=${refused}`} className="app-btn app-btn-outline text-xs">
                    Refused demo
                  </Link>
                  <Link href={`/dashboard/assets/${ticker}`} className="text-xs font-semibold text-[#0066FF] hover:underline">
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
