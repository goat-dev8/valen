import Image from 'next/image';
import { CreditCard, Fingerprint, Layers, Shield, Zap, type LucideIcon } from 'lucide-react';
import { STANDARDS_FEATURES } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

const ICONS: Record<(typeof STANDARDS_FEATURES)[number]['icon'], LucideIcon> = {
  shield: Shield,
  fingerprint: Fingerprint,
  'credit-card': CreditCard,
  zap: Zap,
  layers: Layers,
};

const CHAINS = [
  { name: 'Arbitrum Sepolia', src: '/arbitrum-logo.png' },
  { name: 'Robinhood Chain Testnet', src: '/robinhood.svg' },
];

type StandardsStackCardProps = {
  className?: string;
};

/** App-themed standards stack — replaces stock imagery in integrations section */
export function StandardsStackCard({ className }: StandardsStackCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E8ECF0] bg-gradient-to-b from-[#FAFBFD] to-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F8] pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0066FF]">Protocol stack</p>
          <p className="mt-1 text-sm font-semibold text-[#012b54]">Unified under one pipeline</p>
        </div>
        <div className="flex items-center">
          {CHAINS.map((chain, i) => (
            <Image
              key={chain.name}
              src={chain.src}
              alt={chain.name}
              width={28}
              height={28}
              className="rounded-full border-2 border-white bg-white shadow-sm"
              style={{ marginLeft: i === 0 ? 0 : -8 }}
            />
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {STANDARDS_FEATURES.map((item, i) => {
          const Icon = ICONS[item.icon];
          return (
            <li
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-[#EEF2F8] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(1,43,84,0.04)]"
              style={{ transform: `translateX(${i * 4}px)` }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] text-[#0066FF]">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#012b54]">{item.label}</span>
                <span className="block truncate text-xs text-[#64748B]">{item.detail}</span>
              </span>
              <span className="shrink-0 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0066FF]">
                Live
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF]/60 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0066FF]">Every path ends in proof</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Settled', 'Refused', 'Budget blocked', 'Policy denied'].map((outcome) => (
            <span
              key={outcome}
              className="rounded-full border border-[#BFDBFE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0066FF]"
            >
              {outcome}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
