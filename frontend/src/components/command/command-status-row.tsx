'use client';

import Link from 'next/link';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusItem = {
  id: string;
  label: string;
  value: string;
  complete: boolean;
  href?: string;
};

export function CommandStatusRow({ items }: { items: StatusItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-center gap-2">
              {item.complete ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">{item.label}</p>
            </div>
            <p className={cn('mt-2 truncate text-sm font-semibold', item.complete ? 'text-[#012b54]' : 'text-[#64748b]')}>
              {item.value}
            </p>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-2xl border border-[#eef0f3] bg-white p-4 transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]"
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={item.id} className="rounded-2xl border border-[#eef0f3] bg-white p-4">
            {content}
          </div>
        );
      })}
    </div>
  );
}
