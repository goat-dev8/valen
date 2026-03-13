'use client';

import { CheckCircle } from 'lucide-react';

const STEP_LABELS = ['Pick action', 'Choose agent', 'Configure', 'Review'] as const;

type IntentWizardNavProps = {
  current: number;
  maxReached: number;
  onStep: (step: number) => void;
};

export function IntentWizardNav({ current, maxReached, onStep }: IntentWizardNavProps) {
  return (
    <nav aria-label="Intent steps" className="intent-wizard-steps">
      {STEP_LABELS.map((label, index) => {
        const num = index + 1;
        const active = num === current;
        const passed = num < current;
        const reachable = num <= maxReached;

        return (
          <button
            key={label}
            type="button"
            aria-current={active ? 'step' : undefined}
            disabled={!reachable}
            onClick={() => reachable && onStep(num)}
            className={`agent-studio-step ${
              active ? 'agent-studio-step--active' : passed ? 'agent-studio-step--passed' : 'agent-studio-step--upcoming'
            }`}
          >
            <span className="agent-studio-step__icon" aria-hidden>
              {passed ? <CheckCircle className="h-4 w-4" /> : <span className="agent-studio-step__num">{num}</span>}
            </span>
            <span className="agent-studio-step__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export { STEP_LABELS as INTENT_WIZARD_LABELS };
