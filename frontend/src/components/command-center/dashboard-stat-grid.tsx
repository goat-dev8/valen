'use client';

import { StatCard } from '@/components/app/stat-card';
import type { LucideIcon } from 'lucide-react';

type DashboardStat = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
};

export function DashboardStatGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Dashboard metrics">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </section>
  );
}
