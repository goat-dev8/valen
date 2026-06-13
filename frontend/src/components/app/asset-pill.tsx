import { KnownAsset } from '@/lib/known-assets';
import { cn } from '@/lib/utils';

const SUPPORT_LABEL: Record<KnownAsset['supportLevel'], string> = {
  'demo-ready': 'Demo-ready',
  legacy: 'Legacy',
  'metadata-only': 'Metadata-only',
  unverified: 'Unverified',
};

const SUPPORT_CLASS: Record<KnownAsset['supportLevel'], string> = {
  'demo-ready': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  legacy: 'border-slate-200 bg-slate-50 text-slate-600',
  'metadata-only': 'border-amber-200 bg-amber-50 text-amber-700',
  unverified: 'border-red-200 bg-red-50 text-red-700',
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
      <span>{asset.symbol}</span>
      {!compact && <span className="opacity-80">{SUPPORT_LABEL[asset.supportLevel]}</span>}
    </span>
  );
}
