'use client';

import { CheckCircle } from 'lucide-react';
import { X402_FLOW_STEPS, getX402FlowStepIndex } from '@/lib/x402-constants';

export function X402FlowProgress({
  paymentId,
  settlementTx,
  isInitiating = false,
  isSettling = false,
}: {
  paymentId: string | null;
  settlementTx: string | null;
  isInitiating?: boolean;
  isSettling?: boolean;
}) {
  const currentIndex = getX402FlowStepIndex(paymentId, settlementTx, { isInitiating, isSettling });

  return (
    <nav aria-label="Payment progress" className="intent-wizard-steps">
      {X402_FLOW_STEPS.map((step, index) => {
        const num = index + 1;
        const active = index === currentIndex;
        const passed = index < currentIndex;

        return (
          <div
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className={`agent-studio-step ${
              active ? 'agent-studio-step--active' : passed ? 'agent-studio-step--passed' : 'agent-studio-step--upcoming'
            }`}
          >
            <span className="agent-studio-step__icon" aria-hidden>
              {passed ? <CheckCircle className="h-4 w-4" /> : <span className="agent-studio-step__num">{num}</span>}
            </span>
            <span className="agent-studio-step__label">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
