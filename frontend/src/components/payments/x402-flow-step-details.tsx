'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { getX402FlowStepIndex } from '@/lib/x402-constants';

export type X402FlowFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type X402FlowStepDetailsProps = {
  features: X402FlowFeature[];
  paymentId: string | null;
  settlementTx: string | null;
  isInitiating?: boolean;
  isSettling?: boolean;
};

export function X402FlowStepDetails({
  features,
  paymentId,
  settlementTx,
  isInitiating = false,
  isSettling = false,
}: X402FlowStepDetailsProps) {
  const activeIndex = getX402FlowStepIndex(paymentId, settlementTx, { isInitiating, isSettling });

  return (
    <section className="x402-flow-details" aria-label="Active step details">
      <div className="x402-flow-details__grid">
        {features.map(({ icon: Icon, title, desc }, index) => {
          const active = index === activeIndex;
          const passed = index < activeIndex;

          return (
            <div
              key={title}
              className={`x402-flow-details__card ${active ? 'x402-flow-details__card--active' : ''} ${
                passed ? 'x402-flow-details__card--passed' : ''
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <div className="x402-flow-details__head">
                <span className="x402-flow-details__icon">
                  {passed ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <p className="x402-flow-details__title">{title}</p>
              </div>
              {active && <p className="x402-flow-details__desc">{desc}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
