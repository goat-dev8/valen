import { chainName } from '@/lib/constants';
import { cn } from '@/lib/utils';

const CHAIN_STYLES: Record<number, string> = {
  421614: 'bg-blue-50 text-blue-700 border-blue-200',
  42161: 'bg-blue-50 text-blue-800 border-blue-200',
  46630: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function ChainBadge({ chainId, className }: { chainId: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        CHAIN_STYLES[chainId] ?? 'bg-slate-50 text-slate-700 border-slate-200',
        className,
      )}
    >
      {chainName(chainId)}
    </span>
  );
}
