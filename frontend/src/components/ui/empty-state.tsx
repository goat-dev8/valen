import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dbeafe] bg-[#f8fbff] p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-[#007dfc]" aria-hidden />
      <h3 className="mt-4 text-base font-semibold text-[#012b54]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748b]">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="app-btn app-btn-primary mt-6 inline-flex">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
