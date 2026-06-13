'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';
import { AssetPill } from '@/components/app/asset-pill';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useDashboardSummary, useMandates } from '@/hooks/use-valen-api';
import { ROBINHOOD_HEADLINE_ASSETS } from '@/lib/known-assets';

export default function RobinhoodDemoPage() {
  const { data: mandates } = useMandates();
  const { data: summary } = useDashboardSummary();
  const robinhoodMandates =
    mandates?.filter((mandate) => mandate.status === 'active' && mandate.allowedChains.includes(46630)) ?? [];
  const latestRobinhood = summary?.latest.robinhood;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Robinhood Token Assets"
        description="Govern and settle Robinhood testnet stock tokens and USDG with rules, ERC-20 settlement, and proof."
      >
        <ChainBadge chainId={46630} />
        <Link href="/dashboard/executions/new?template=robinhood-tsla-allowed" className="app-btn app-btn-primary">
          Run Robinhood Action
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="app-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">Headline Story</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#012b54]">Allowed action, refused action, proof either way.</h2>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            Robinhood Chain testnet publishes verified ERC-20 contracts for TSLA, AMZN, PLTR, NFLX, AMD, and USDG.
            VALEN treats each as a first-class settlement asset through ValenTokenSettlementAdapter when policy allows.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-emerald-800">Allowed path</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Within-cap stock or USDG transfer settles on-chain and produces proof.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <p className="mt-2 text-sm font-semibold text-amber-800">Refused path</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                Over-limit actions are refused before settlement and persist a refusal proof.
              </p>
            </div>
          </div>
        </div>

        <div className="app-card">
          <h3 className="app-card-title">Robinhood Readiness</h3>
          <dl className="app-detail-list mt-4">
            <div><dt>Active Robinhood mandates</dt><dd>{robinhoodMandates.length}</dd></div>
            <div><dt>Settlement assets</dt><dd>TSLA, AMZN, PLTR, NFLX, AMD, USDG</dd></div>
            <div><dt>Latest Robinhood proof</dt><dd>{latestRobinhood?.executionId ?? 'Run a Robinhood action'}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/executions/new?template=robinhood-tsla-allowed" className="app-btn app-btn-primary">
              Build allowed action
            </Link>
            <Link href="/dashboard/executions/new?template=robinhood-tsla-refused" className="app-btn app-btn-outline">
              Build refused TSLA action
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {ROBINHOOD_HEADLINE_ASSETS.map((asset) => (
          <Link
            key={asset.symbol}
            href={`/dashboard/demo/robinhood/${asset.symbol.toLowerCase()}`}
            className="app-card transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]"
          >
            <AssetPill asset={asset} />
            <h3 className="mt-4 text-xl font-semibold text-[#012b54]">{asset.symbol}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{asset.label}</p>
            <p className="mt-2 font-mono text-[10px] text-[#64748b] break-all">{asset.address}</p>
            <div className="mt-4 space-y-2 text-xs text-[#64748b]">
              <p>Allowed: {asset.scenario?.safePath}</p>
              <p>Refused: {asset.scenario?.refusedPath}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
