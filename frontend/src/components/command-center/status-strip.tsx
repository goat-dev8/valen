'use client';

import Link from 'next/link';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusStripItem = {
  id: string;
  label: string;
  value: string;
  complete: boolean;
  href?: string;
  emphasis?: boolean;
};

/** P1–P4 status row — agent-first (W1/W2). */
export function StatusStrip({ items }: { items: StatusStripItem[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
      {items.map((item) => {
        const inner = (
          <>
            <div className="flex items-center gap-2">
              {item.complete ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#8B98A5]" />
              )}
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B98A5]">{item.label}</p>
            </div>
            <p
              className={cn(
                'mt-1.5 truncate font-semibold',
                item.emphasis ? 'text-base text-[#1A2332]' : 'text-sm',
                item.complete ? 'text-[#1A2332]' : 'text-[#5E6C7B]',
              )}
            >
              {item.value}
            </p>
          </>
        );

        const className = cn(
          'min-w-[140px] shrink-0 rounded-xl border bg-white p-3 transition',
          item.emphasis ? 'border-[#0066FF]/30 bg-[#EBF2FF]/40 md:min-w-[180px] md:p-4' : 'border-[#E8ECF0]',
          item.href && 'hover:border-[#0066FF]/40 hover:bg-[#FAFBFC]',
        );

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className={className}>
              {inner}
            </Link>
          );
        }
        return (
          <div key={item.id} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
