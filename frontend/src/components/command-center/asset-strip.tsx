'use client';

import Link from 'next/link';
import { AssetIcon } from '@/lib/asset-icons';
import { governedHomeAssets } from '@/lib/known-assets';

function templateHref(templateId: string) {
  return `/dashboard/executions/new?template=${templateId}`;
}

function assetTemplateId(symbol: string): string {
  if (symbol === 'USDC') return 'arbitrum-usdc';
  if (symbol === 'USDG') return 'robinhood-usdg-allowed';
  return `robinhood-${symbol.toLowerCase()}-allowed`;
}

export function AssetStrip({ onX402Click }: { onX402Click?: () => void }) {
  const assets = governedHomeAssets();

  return (
    <section aria-label="Governed assets" className="app-panel-floating p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Governed assets</p>
        <Link href="/dashboard/assets" className="text-xs font-semibold text-[#0066FF] hover:underline">
          View all
        </Link>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onX402Click}
          className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2 transition hover:border-[#0066FF]/40"
        >
          <AssetIcon symbol="USDC" size={32} />
          <span className="text-[10px] font-semibold text-[#1A2332]">x402</span>
        </button>
        {assets.map((asset) => (
          <Link
            key={`${asset.symbol}-${asset.address}`}
            href={
              asset.category === 'rwa-stock-token'
                ? `/dashboard/assets/${asset.symbol.toLowerCase()}`
                : templateHref(assetTemplateId(asset.symbol))
            }
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2 transition hover:border-[#0066FF]/40"
            title={`${asset.symbol} · chain ${asset.symbol === 'USDC' ? '421614' : '46630'}`}
          >
            <AssetIcon symbol={asset.symbol} size={32} />
            <span className="text-[10px] font-semibold text-[#1A2332]">{asset.symbol}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
