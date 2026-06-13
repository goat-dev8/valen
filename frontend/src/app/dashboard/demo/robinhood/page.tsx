'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';
import { AssetPill } from '@/components/app/asset-pill';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useDashboardSummary, useMandates } from '@/hooks/use-valen-api';
import { ROBINHOOD_HEADLINE_ASSETS, ROBINHOOD_TESTNET_USDG } from '@/lib/known-assets';

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
        description="Govern tokenized stock actions with rules and proof. Stock tickers are first-class policy assets; USDG is the real settlement rail currently published in Robinhood docs."
      >
        <ChainBadge chainId={46630} />
        <Link href="/dashboard/executions/new?template=robinhood-usdg-allowed" className="app-btn app-btn-primary">
          Run Robinhood Action
          <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="app-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">Headline Story</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#012b54]">Allowed action, refused action, proof either way.</h2>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            Robinhood Chain exposes USDG as an official ERC-20 and documents five stock-token tickers for the faucet.
            VALEN treats every ticker as a governed asset now, while clearly marking stock-token settlement as
            metadata-only until the faucet/explorer reveals verified token contracts.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-emerald-800">Allowed path</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Small USDG-backed Robinhood action settles through the Phase C token adapter and shows proof.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <p className="mt-2 text-sm font-semibold text-amber-800">Refused path</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                Over-limit ticker action is classified as refused and never pretends to settle unpublished stock tokens.
              </p>
            </div>
          </div>
        </div>

        <div className="app-card">
          <h3 className="app-card-title">Robinhood Readiness</h3>
          <dl className="app-detail-list mt-4">
            <div><dt>Active Robinhood mandates</dt><dd>{robinhoodMandates.length}</dd></div>
            <div><dt>Real settlement rail</dt><dd className="font-mono text-xs break-all">USDG {ROBINHOOD_TESTNET_USDG}</dd></div>
            <div><dt>Latest Robinhood proof</dt><dd>{latestRobinhood?.executionId ?? 'Run a Robinhood action'}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/executions/new?template=robinhood-usdg-allowed" className="app-btn app-btn-primary">
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
