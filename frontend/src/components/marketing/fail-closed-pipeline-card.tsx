import { cn } from '@/lib/utils';

const PIPELINE_STEPS = ['Mandate', 'Policy', 'Engines', 'Budget', 'Proof'] as const;

type FailClosedPipelineCardProps = {
  className?: string;
  variant?: 'hero' | 'compact';
};

/** Gradient showcase card — fail-closed pipeline with step badges */
export function FailClosedPipelineCard({ className, variant = 'hero' }: FailClosedPipelineCardProps) {
  const isHero = variant === 'hero';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-[#E8ECF0] bg-gradient-to-b from-[#EFF6FF] via-[#BFDBFE] to-[#64748B] shadow-xl',
        isHero ? 'min-h-[420px]' : 'min-h-[320px]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,102,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,102,255,0.1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      {isHero && (
        <div className="relative flex min-h-[280px] flex-col items-center justify-center px-8 pt-10">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Intent → Chain</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {PIPELINE_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-lg border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm',
                    i === 2 && 'hero-pipeline-step-engine relative border-white/50 bg-white/25',
                  )}
                >
                  {step}
                </span>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span className="text-white/60" aria-hidden>
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          'absolute inset-x-4 bottom-4 rounded-2xl border border-[#E8ECF0] bg-white shadow-sm',
          isHero ? 'p-6' : 'p-4',
          !isHero && 'relative inset-x-0 bottom-0 mx-4 mb-4 mt-auto',
        )}
      >
        <p className="mb-3 block text-xs font-bold uppercase tracking-[0.14em] text-[#0066FF]">
          Fail-closed pipeline
        </p>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STEPS.map((step) => (
            <span
              key={step}
              className={cn(
                'rounded-full border border-[#BFDBFE] bg-white font-medium text-[#0066FF]',
                isHero ? 'px-4 py-1 text-sm' : 'px-3 py-1 text-xs',
              )}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
