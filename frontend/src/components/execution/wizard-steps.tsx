import { CheckCircle } from 'lucide-react';

type WizardStepsProps = {
  steps: string[];
  current: number;
  onStep?: (step: number) => void;
};

export function WizardSteps({ steps, current, onStep }: WizardStepsProps) {
  return (
    <nav aria-label="Progress" className="flex flex-wrap gap-2">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <button
            key={label}
            type="button"
            disabled={!onStep || stepNum > current}
            onClick={() => onStep?.(stepNum)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'border-[#007dfc] bg-[#e8f4ff] text-[#007dfc]'
                : done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-[#eef0f3] bg-white text-[#94a3b8]'
            }`}
          >
            {done ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs">{stepNum}</span>
            )}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
