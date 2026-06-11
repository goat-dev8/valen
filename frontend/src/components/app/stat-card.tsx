import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  sparkline?: number[];
  className?: string;
  gradient?: boolean;
};

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  sparkline,
  className,
  gradient,
}: StatCardProps) {
  return (
    <div className={cn('app-stat-card', gradient && 'app-stat-card-gradient', className)}>
      {gradient ? (
        <>
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            {change && <p className="mt-1 text-sm text-white/70">{change}</p>}
          </div>
          <div className="app-stat-card-decoration" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#64748b]">{title}</p>
              <p className="mt-1 text-2xl font-semibold text-[#012b54]">{value}</p>
            </div>
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4ff]">
                <Icon className="h-5 w-5 text-[#007dfc]" />
              </div>
            )}
          </div>
          {change && (
            <p
              className={cn(
                'mt-3 text-sm font-medium',
                changeType === 'up' && 'text-emerald-500',
                changeType === 'down' && 'text-red-500',
                changeType === 'neutral' && 'text-[#64748b]',
              )}
            >
              {change}
            </p>
          )}
          {sparkline && (
            <div className="mt-3 flex h-8 items-end gap-0.5">
              {sparkline.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-[#007dfc]/20"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
