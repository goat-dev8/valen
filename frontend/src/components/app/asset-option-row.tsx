import { AssetIcon } from '@/lib/asset-icons';
import { chainName } from '@/lib/constants';
import { cn } from '@/lib/utils';

type AssetOptionRowProps = {
  symbol: string;
  label?: string;
  chainId?: number;
  selected?: boolean;
  compact?: boolean;
  className?: string;
};

export function AssetOptionRow({
  symbol,
  label,
  chainId,
  selected,
  compact,
  className,
}: AssetOptionRowProps) {
  const displaySymbol = symbol === 'native' ? 'ETH' : symbol.toUpperCase();
  const title = label ?? displaySymbol;

  return (
    <span
      className={cn(
        'asset-option-row',
        selected && 'asset-option-row--selected',
        compact && 'asset-option-row--compact',
        className,
      )}
    >
      <AssetIcon symbol={displaySymbol} size={compact ? 20 : 24} />
      <span className="asset-option-row__copy">
        <strong className="asset-option-row__symbol">{title}</strong>
        {chainId != null && !compact && (
          <span className="asset-option-row__network">{chainName(chainId)}</span>
        )}
        <span className="asset-option-row__ticker">{displaySymbol}</span>
      </span>
    </span>
  );
}
