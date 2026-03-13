'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '@/components/app/stat-card';
import type { LucideIcon } from 'lucide-react';

type StatItem = {
  title: string;
  value: string | number;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
};

export function AdvancedStatsDrawer({ stats }: { stats: StatItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-[#eef0f3] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[#012b54]">Advanced metrics</p>
          <p className="text-xs text-[#64748b]">Operator and audit statistics — hidden in Judge Mode by default</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-[#64748b] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid gap-4 border-t border-[#eef0f3] p-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}
    </section>
  );
}
