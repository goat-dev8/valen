'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import type { SetupStep } from '@/lib/setup-state';
import { setupProgress } from '@/lib/setup-state';

const STEP_LABELS: Record<string, string> = {
  organization: 'Organization',
  agent: 'Governed agent',
  policy: 'Rules & policy',
  wallet: 'Wallet authority',
  mandate: 'Signed mandate',
  intent: 'First intent',
  proof: 'Execution proof',
};

export function GuidedSetupPanel({ steps }: { steps: SetupStep[] }) {
  const progress = setupProgress(steps);
  const nextStep = steps.find((step) => !step.complete);
  const currentIndex = nextStep ? steps.findIndex((s) => s.id === nextStep.id) : steps.length;

  if (progress.percent >= 100) {
    return (
      <section className="app-panel-floating flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A2332]">Setup complete</p>
            <p className="text-xs text-[#5E6C7B]">Your governed agent stack is ready. Run actions from the command panel.</p>
          </div>
        </div>
        <Link href="/dashboard/proofs" className="app-btn app-btn-outline text-sm">
          Outcome Ledger
        </Link>
      </section>
    );
  }

  return (
    <section className="app-panel-floating overflow-hidden">
      <div className="border-b border-[#E8ECF0]/80 bg-gradient-to-r from-[#EBF2FF]/60 to-white px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066FF]/10 shadow-sm">
              <Sparkles className="h-5 w-5 text-[#0066FF]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0066FF]">Guided setup</p>
              <h2 className="mt-0.5 text-lg font-semibold text-[#1A2332]">Launch your governed agent</h2>
              <p className="mt-1 max-w-xl text-sm text-[#5E6C7B]">
                Wallet → agent → policy → mandate → intent → proof. Each step unlocks the next.
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-[#1A2332]">
              {progress.complete}
              <span className="text-base font-medium text-[#8B98A5]">/{progress.total}</span>
            </p>
            <p className="text-xs text-[#8B98A5]">{progress.percent}% complete</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#3B8BFF] transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <ol className="divide-y divide-[#F4F6F8] px-2 py-2 md:px-4">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isPast = step.complete;
          const label = STEP_LABELS[step.id] ?? step.title;

          return (
            <li key={step.id}>
              <div
                className={`flex flex-col gap-3 rounded-xl p-3 transition md:flex-row md:items-center md:justify-between md:p-4 ${
                  isCurrent ? 'bg-[#EBF2FF]/40 ring-1 ring-[#0066FF]/15' : 'hover:bg-[#FAFBFC]'
                }`}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isPast
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                          ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/25'
                          : 'bg-[#F4F6F8] text-[#8B98A5]'
                    }`}
                  >
                    {isPast ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A2332]">{label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-[#5E6C7B]">{step.description}</p>
                    {step.blockedReason && !step.complete && (
                      <p className="mt-1 text-xs text-amber-700">{step.blockedReason}</p>
                    )}
                  </div>
                </div>
                {!step.complete && (
                  <Link
                    href={step.href}
                    className={`app-btn shrink-0 text-sm ${isCurrent ? 'app-btn-primary' : 'app-btn-outline'}`}
                  >
                    {step.actionLabel}
                    {isCurrent && <ArrowRight className="h-3.5 w-3.5" />}
                  </Link>
                )}
                {step.complete && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Done
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <div className="border-t border-[#E8ECF0]/80 bg-[#FAFBFC] px-5 py-4 md:px-6">
          <Link href={nextStep.href} className="app-btn app-btn-primary w-full justify-center sm:w-auto">
            Continue: {STEP_LABELS[nextStep.id] ?? nextStep.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
