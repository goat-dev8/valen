'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ChevronDown, Circle } from 'lucide-react';
import { useState } from 'react';
import type { SetupStep } from '@/lib/setup-state';
import { setupProgress } from '@/lib/setup-state';

export function SetupChecklistCompact({ steps, defaultOpen = true }: { steps: SetupStep[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const progress = setupProgress(steps);
  const nextStep = steps.find((step) => !step.complete);

  if (progress.percent >= 100) return null;

  return (
    <section className="rounded-xl border border-[#E8ECF0] bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0066FF]">Guided setup</p>
          <p className="mt-0.5 text-sm font-medium text-[#1A2332]">
            {progress.complete}/{progress.total} complete
            {nextStep ? ` · Next: ${nextStep.title}` : ''}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EBF2FF]">
            <div className="h-full rounded-full bg-[#0066FF] transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#8B98A5] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className="flex items-center gap-2 rounded-lg border border-[#F4F6F8] px-3 py-2 text-sm transition hover:border-[#0066FF]/30 hover:bg-[#FAFBFC]"
            >
              {step.complete ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#8B98A5]" />
              )}
              <span className="truncate font-medium text-[#1A2332]">{step.title}</span>
            </Link>
          ))}
          {nextStep && (
            <Link href={nextStep.href} className="app-btn app-btn-primary mt-1 inline-flex w-full justify-center text-sm">
              {nextStep.actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
