'use client';

import Link from 'next/link';
import { CheckCircle, Circle } from 'lucide-react';
import type { UserJourneyStep } from '@/lib/user-journey';

type UserJourneyRailProps = {
  steps: UserJourneyStep[];
};

export function UserJourneyRail({ steps }: UserJourneyRailProps) {
  return (
    <section className="app-card overflow-x-auto">
      <div className="mb-4">
        <h3 className="app-card-title">Your autonomous finance flow</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          Connect wallet → create agent → set rules → fund with USDC → execute → see proof.
        </p>
      </div>
      <ol className="flex min-w-[720px] gap-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex flex-1 min-w-[110px] flex-col">
            <Link
              href={step.href}
              className="group flex h-full flex-col rounded-2xl border border-[#eef0f3] bg-white p-3 transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]"
            >
              <div className="flex items-center gap-2">
                {step.complete ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                  {index + 1}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-[#012b54] group-hover:text-[#007dfc]">
                {step.title}
              </p>
            </Link>
            {index < steps.length - 1 && (
              <div className="mx-auto mt-2 hidden h-px w-full max-w-[24px] bg-[#dbeafe] lg:block" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
