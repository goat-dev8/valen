'use client';

import type { LifecycleStep } from '@/lib/command-agent/types';

export function CommandLifecycleTracker({ steps }: { steps: LifecycleStep[] }) {
  if (!steps.length) return null;

  return (
    <ol className="command-lifecycle">
      {steps.map((step) => (
        <li key={step.id} className={`command-lifecycle__step command-lifecycle__step--${step.status}`}>
          <span className="command-lifecycle__dot" aria-hidden />
          <div>
            <p className="command-lifecycle__label">{step.label}</p>
            {step.detail && <p className="command-lifecycle__detail">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
