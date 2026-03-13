'use client';

import { cn } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/lib/design-tokens';

type PipelineState = 'idle' | 'running' | 'complete' | 'refused';

function stageIndexForStatus(status?: string): number {
  if (!status) return 0;
  switch (status) {
    case 'executed':
      return PIPELINE_STAGES.length;
    case 'settlement_submitted':
      return 4;
    case 'approved':
    case 'approval_required':
      return 3;
    case 'validated':
      return 2;
    case 'created':
      return 1;
    case 'compliance_failed':
      return 1;
    case 'risk_failed':
      return 3;
    case 'policy_rejected':
      return 2;
    default:
      return 1;
  }
}

export function GovernancePipelineStrip({
  status,
  state = 'idle',
  className,
}: {
  status?: string;
  state?: PipelineState;
  className?: string;
}) {
  const activeIndex =
    state === 'idle' ? (status ? stageIndexForStatus(status) : 0) : state === 'complete' ? PIPELINE_STAGES.length : 2;
  const refused = state === 'refused' || ['compliance_failed', 'risk_failed', 'policy_rejected', 'failed'].includes(status ?? '');

  return (
    <section
      className={cn('app-panel-floating p-4 md:p-5', className)}
      aria-label="Governance pipeline"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Governance pipeline</p>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {PIPELINE_STAGES.map((stage, index) => {
          const stepNum = index + 1;
          const done = stepNum < activeIndex;
          const active = stepNum === activeIndex && !refused;
          const failed = refused && stepNum === activeIndex;

          return (
            <div key={stage.id} className="flex flex-1 items-center gap-2 md:flex-col md:gap-1.5">
              <div className="flex w-full items-center gap-2 md:flex-col">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                    done && 'bg-emerald-100 text-emerald-700',
                    active && 'bg-[#0066FF] text-white shadow-[0_0_0_4px_rgba(0,102,255,0.15)]',
                    failed && 'bg-red-100 text-red-700',
                    !done && !active && !failed && 'bg-[#F4F6F8] text-[#8B98A5]',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? '✓' : stepNum}
                </div>
                <p
                  className={cn(
                    'text-xs font-medium md:text-center',
                    active ? 'text-[#0066FF]' : failed ? 'text-red-700' : done ? 'text-[#1A2332]' : 'text-[#8B98A5]',
                  )}
                >
                  {stage.label}
                </p>
              </div>
              {index < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    'hidden h-0.5 flex-1 md:block',
                    done ? 'bg-emerald-400' : 'bg-[#E8ECF0]',
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
      {refused && (
        <p className="mt-3 text-xs text-red-700">
          Refusal is intentional safety — a public proof URL is still generated.
        </p>
      )}
    </section>
  );
}
