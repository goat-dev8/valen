import { CreditCard, Fingerprint, Layers, Shield, Zap, type LucideIcon } from 'lucide-react';
import { StandardsStackCard } from '@/components/marketing/standards-stack-card';
import { STANDARDS_FEATURES } from '@/lib/landing-content';
import { cn } from '@/lib/utils';

const ICONS: Record<(typeof STANDARDS_FEATURES)[number]['icon'], LucideIcon> = {
  shield: Shield,
  fingerprint: Fingerprint,
  'credit-card': CreditCard,
  zap: Zap,
  layers: Layers,
};

type StandardsFeaturesProps = {
  className?: string;
};

/** Two-column standards section — protocol alignment with app-themed stack card */
export function StandardsFeatures({ className }: StandardsFeaturesProps) {
  return (
    <div className={cn('standards-features', className)}>
      <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-semibold tracking-tight text-[#012b54] md:text-4xl lg:text-[2.65rem] lg:leading-tight">
            Built on emerging agentic finance standards
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#5E6C7B] md:text-lg">
            ERC-8226 mandates, ERC-8004 identity, x402 payments, Stylus engines, and dual-chain settlement
            — unified under one fail-closed pipeline.
          </p>

          <ul className="standards-features__list mt-8 divide-y border-y border-[#E8ECF0]">
            {STANDARDS_FEATURES.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.label} className="flex items-start gap-3 py-3.5">
                  <span className="standards-features__icon mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] text-[#0066FF]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#012b54]">{item.label}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-[#64748B]">{item.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="standards-features__visual lg:col-span-3">
          <StandardsStackCard />
        </div>
      </div>
    </div>
  );
}
