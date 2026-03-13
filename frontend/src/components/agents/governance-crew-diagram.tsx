'use client';

import { cn } from '@/lib/utils';

const ACTORS = [
  { id: 'mandate', label: 'Your Mandate', color: 'bg-[#EBF2FF] text-[#0066FF]' },
  { id: 'policy', label: 'Policy Engine', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'budget', label: 'Budget Guard', color: 'bg-amber-50 text-amber-800' },
  { id: 'relayer', label: 'Settlement Relayer', color: 'bg-violet-50 text-violet-700' },
  { id: 'proof', label: 'Proof Recorder', color: 'bg-[#F4F6F8] text-[#1A2332]' },
];

export function GovernanceCrewDiagram({ active = false, className }: { active?: boolean; className?: string }) {
  return (
    <section
      className={cn('rounded-2xl border border-[#E8ECF0] bg-white p-4', className)}
      aria-label="Governance actors"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Governance crew</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {ACTORS.map((actor, index) => (
          <div key={actor.id} className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                actor.color,
                active && index === 0 && 'motion-safe:animate-pulse ring-2 ring-[#0066FF]/20',
              )}
            >
              {actor.label}
            </span>
            {index < ACTORS.length - 1 && (
              <span className="hidden text-[#8B98A5] sm:inline" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
