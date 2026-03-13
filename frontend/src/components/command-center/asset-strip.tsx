'use client';

import Link from 'next/link';
import { AssetIcon } from '@/lib/asset-icons';

const STRIP_ASSETS = [
  { symbol: 'USDC', chainId: 421614, allowed: 'arbitrum-usdc', refused: null as string | null },
  { symbol: 'USDG', chainId: 46630, allowed: 'robinhood-usdg-allowed', refused: null },
  { symbol: 'TSLA', chainId: 46630, allowed: 'robinhood-tsla-allowed', refused: 'robinhood-tsla-refused' },
  { symbol: 'AMZN', chainId: 46630, allowed: 'robinhood-amzn-allowed', refused: 'robinhood-amzn-refused' },
  { symbol: 'PLTR', chainId: 46630, allowed: 'robinhood-pltr-allowed', refused: 'robinhood-pltr-refused' },
  { symbol: 'NFLX', chainId: 46630, allowed: 'robinhood-nflx-allowed', refused: 'robinhood-nflx-refused' },
  { symbol: 'AMD', chainId: 46630, allowed: 'robinhood-amd-allowed', refused: 'robinhood-amd-refused' },
];

function templateHref(templateId: string) {
  return `/dashboard/executions/new?template=${templateId}`;
}

export function AssetStrip({ onX402Click }: { onX402Click?: () => void }) {
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
        {STRIP_ASSETS.map((asset) => (
          <Link
            key={asset.symbol}
            href={asset.refused ? `/dashboard/assets/${asset.symbol.toLowerCase()}` : templateHref(asset.allowed!)}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2 transition hover:border-[#0066FF]/40"
            title={`${asset.symbol} on chain ${asset.chainId}`}
          >
            <AssetIcon symbol={asset.symbol} size={32} />
            <span className="text-[10px] font-semibold text-[#1A2332]">{asset.symbol}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
