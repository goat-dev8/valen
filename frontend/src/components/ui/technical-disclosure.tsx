'use client';

import { ChevronDown } from 'lucide-react';

type TechnicalDisclosureProps = {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

/** Collapses UUIDs, hashes, and debug fields (W1). */
export function TechnicalDisclosure({
  title = 'Technical details',
  children,
  defaultOpen = false,
}: TechnicalDisclosureProps) {
  return (
    <details className="rounded-xl border border-[var(--border-color,#E8ECF0)] bg-[var(--valen-bg-subtle,#FAFBFC)]" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-[#5E6C7B]">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </summary>
      <div className="border-t border-[var(--border-color,#E8ECF0)] px-4 py-3 text-sm text-[#5E6C7B]">{children}</div>
    </details>
  );
}
