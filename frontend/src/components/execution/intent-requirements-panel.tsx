'use client';

import type { IntentRequirements } from '@/lib/intent-eligibility';

export function IntentRequirementsPanel({ requirements }: { requirements: IntentRequirements }) {
  return (
    <div className="intent-requirements-panel rounded-xl border border-[#DBEAFE] bg-[#F8FBFF] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0066FF]">Intent requirements</p>
      <dl className="intent-requirements-panel__grid mt-3">
        <div>
          <dt>Asset</dt>
          <dd>{requirements.assetSymbol}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{requirements.actionLabel}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{requirements.networkLabel}</dd>
        </div>
        <div>
          <dt>Required policy</dt>
          <dd>{requirements.policyName ?? 'Any'}</dd>
        </div>
      </dl>
    </div>
  );
}
