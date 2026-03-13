'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AssetPill } from '@/components/app/asset-pill';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { useDashboardSummary } from '@/hooks/use-valen-api';
import { robinhoodAssetByTicker } from '@/lib/known-assets';

export default function RobinhoodTickerPage() {
  const params = useParams();
  const ticker = String(params.ticker ?? '').toUpperCase();
  const asset = robinhoodAssetByTicker(ticker);
  const { data: summary } = useDashboardSummary();

  if (!asset) {
    notFound();
  }

  const latest = summary?.latest.robinhood?.asset === asset.symbol ? summary.latest.robinhood : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/assets" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Tokenized Assets
      </Link>

      <PageHeader
        title={`${asset.symbol} Governed Action`}
        description={`${asset.label} settles as an ERC-20 on Robinhood Testnet through ValenTokenSettlementAdapter when policy allows.`}
      >
        <ChainBadge chainId={46630} />
        <AssetPill asset={asset} />
      </PageHeader>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="app-card">
          <h2 className="text-xl font-semibold text-[#012b54]">Settlement Story</h2>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            {asset.symbol} is a verified Robinhood Chain testnet ERC-20. VALEN governs exposure through policy,
            settles allowed transfers on-chain, and records proof for both allowed and refused paths.
          </p>
          <dl className="app-detail-list mt-5">
            <div><dt>Ticker</dt><dd>{asset.symbol}</dd></div>
            <div><dt>Support level</dt><dd>{asset.supportLevel}</dd></div>
            <div><dt>Settlement mode</dt><dd>{asset.settlementMode}</dd></div>
            <div><dt>Token contract</dt><dd className="font-mono text-xs break-all">{asset.address}</dd></div>
          </dl>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="app-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Allowed Scenario</p>
            <h3 className="mt-3 text-lg font-semibold text-[#012b54]">{asset.scenario?.safePath}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              A within-cap ERC-20 transfer settles through the token adapter and produces proof.
            </p>
            <Link
              href={`/dashboard/executions/new?template=robinhood-${asset.symbol.toLowerCase()}-allowed`}
              className="app-btn app-btn-primary mt-5"
            >
              Build allowed intent
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="app-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Refused Scenario</p>
            <h3 className="mt-3 text-lg font-semibold text-[#012b54]">{asset.scenario?.refusedPath}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              An over-limit action stops before settlement and persists a refusal proof.
            </p>
            <Link
              href={`/dashboard/executions/new?template=robinhood-${asset.symbol.toLowerCase()}-refused`}
              className="app-btn app-btn-outline mt-5"
            >
              Build refused intent
            </Link>
          </div>
        </div>
      </section>

      <section className="app-card">
        <h3 className="app-card-title">Latest Proof For {asset.symbol}</h3>
        {latest?.href ? (
          <Link href={latest.href} className="app-link mt-3 inline-block">
            Open proof {latest.executionId.slice(0, 8)}
          </Link>
        ) : (
          <p className="mt-3 text-sm text-[#64748b]">
            No {asset.symbol}-specific proof is stored yet. Use the templates above to create a governed action.
          </p>
        )}
      </section>
    </div>
  );
}
