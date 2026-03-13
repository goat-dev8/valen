import { CheckCircle } from 'lucide-react';

type AuthorityPanel = 'verify' | 'mandate';

type AuthorityWizardStepsProps = {
  verifyComplete: boolean;
  mandateComplete: boolean;
  activePanel: AuthorityPanel | null;
  onStepClick: (step: AuthorityPanel) => void;
};

const STEPS: { id: AuthorityPanel; label: string }[] = [
  { id: 'verify', label: 'Verify wallet' },
  { id: 'mandate', label: 'Sign mandate' },
];

export function AuthorityWizardSteps({
  verifyComplete,
  mandateComplete,
  activePanel,
  onStepClick,
}: AuthorityWizardStepsProps) {
  const completeMap = { verify: verifyComplete, mandate: mandateComplete };

  return (
    <nav aria-label="Authority setup steps" className="agent-studio-steps authority-wizard-steps">
      {STEPS.map((step, index) => {
        const done = completeMap[step.id];
        const active = activePanel === step.id;
        const num = index + 1;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.id)}
            className={`agent-studio-step ${
              active ? 'agent-studio-step--active' : done ? 'agent-studio-step--passed' : 'agent-studio-step--upcoming'
            }`}
          >
            <span className="agent-studio-step__icon" aria-hidden>
              {done ? <CheckCircle className="h-4 w-4" /> : <span className="agent-studio-step__num">{num}</span>}
            </span>
            <span className="agent-studio-step__label">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export type { AuthorityPanel };
