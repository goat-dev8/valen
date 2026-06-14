import Image from 'next/image';
import { chainName } from '@/lib/constants';
import { chainLogoSrc } from '@/lib/chain-logos';
import { cn } from '@/lib/utils';

const CHAIN_STYLES: Record<number, string> = {
  421614: 'bg-blue-50 text-blue-700 border-blue-200',
  42161: 'bg-blue-50 text-blue-800 border-blue-200',
  46630: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

type ChainBadgeProps = {
  chainId: number;
  className?: string;
  showLogo?: boolean;
  compact?: boolean;
};

const COMPACT_CHAIN_LABEL: Record<number, string> = {
  421614: 'Arbitrum',
  42161: 'Arbitrum',
  46630: 'Robinhood',
};

export function ChainBadge({ chainId, className, showLogo = true, compact = false }: ChainBadgeProps) {
  const logo = showLogo ? chainLogoSrc(chainId) : null;
  const label = compact ? (COMPACT_CHAIN_LABEL[chainId] ?? chainName(chainId)) : chainName(chainId);

  return (
    <span
      className={cn(
        'chain-badge inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        CHAIN_STYLES[chainId] ?? 'bg-slate-50 text-slate-700 border-slate-200',
        className,
      )}
    >
      {logo && (
        <Image
          src={logo}
          alt=""
          width={14}
          height={14}
          className="chain-badge__logo h-3.5 w-3.5 shrink-0 rounded-full object-contain"
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}
