import { KnownAsset } from '@/lib/known-assets';
import { AssetIcon } from '@/lib/asset-icons';
import { cn } from '@/lib/utils';

const SUPPORT_LABEL: Record<KnownAsset['supportLevel'], string> = {
  'demo-ready': 'Settlement-ready',
  legacy: 'Legacy',
};

const SUPPORT_CLASS: Record<KnownAsset['supportLevel'], string> = {
  'demo-ready': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  legacy: 'border-slate-200 bg-slate-50 text-slate-600',
};

type AssetPillProps = {
  asset: KnownAsset;
  compact?: boolean;
};

export function AssetPill({ asset, compact = false }: AssetPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        SUPPORT_CLASS[asset.supportLevel],
      )}
    >
      <AssetIcon symbol={asset.symbol} size={18} />
      <span>{asset.symbol}</span>
      {!compact && <span className="opacity-80">{SUPPORT_LABEL[asset.supportLevel]}</span>}
    </span>
  );
}
