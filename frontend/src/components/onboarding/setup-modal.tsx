'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Circle, X } from 'lucide-react';
import type { SetupStep } from '@/lib/setup-state';
import { setupProgress } from '@/lib/setup-state';

type SetupModalProps = {
  open: boolean;
  onClose: () => void;
  steps: SetupStep[];
};

/** First-run setup modal — replaces redirect to /onboarding (R4). */
export function SetupModal({ open, onClose, steps }: SetupModalProps) {
  if (!open) return null;

  const progress = setupProgress(steps);
  const nextStep = steps.find((step) => !step.complete);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#012b54]/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="setup-modal-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#eef0f3] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#eef0f3] p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">Getting started</p>
            <h2 id="setup-modal-title" className="mt-2 text-xl font-semibold text-[#012b54]">
              Set up governed agent finance
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Connect wallet → agent → rules → authority → proof. {progress.complete}/{progress.total} complete.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#64748b] hover:bg-[#f8f9fb]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="h-2 overflow-hidden rounded-full bg-[#eef6ff]">
            <div className="h-full rounded-full bg-[#007dfc] transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        <ul className="space-y-2 p-6">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                onClick={onClose}
                className="flex gap-3 rounded-2xl border border-[#eef0f3] p-4 transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]"
              >
                {step.complete ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#94a3b8]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#012b54]">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{step.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 border-t border-[#eef0f3] p-6">
          <Link
            href={nextStep?.href ?? '/dashboard/executions/new'}
            onClick={onClose}
            className="app-btn app-btn-primary inline-flex items-center gap-2"
          >
            {nextStep?.actionLabel ?? 'Governed Intent'}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" onClick={onClose} className="app-btn app-btn-outline">
            Continue to Command
          </button>
        </div>
      </div>
    </div>
  );
}
