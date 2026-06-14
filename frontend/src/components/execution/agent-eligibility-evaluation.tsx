'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import type { IntentEligibilityResult } from '@/lib/intent-eligibility';

export function AgentEligibilityEvaluation({
  agentName,
  result,
}: {
  agentName: string;
  result: IntentEligibilityResult;
}) {
  return (
    <div
      className={`agent-eligibility-evaluation rounded-xl border p-3 ${
        result.eligible ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#012b54]">{agentName}</p>
        <span
          className={`text-xs font-bold uppercase tracking-wide ${
            result.eligible ? 'text-emerald-700' : 'text-amber-800'
          }`}
        >
          {result.eligible ? 'Eligible' : 'Not eligible'}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Agent evaluation</p>
      <ul className="mt-2 space-y-1">
        {result.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs text-[#334155]">
            {check.passed ? (
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
            )}
            <span>
              <strong>{check.label}</strong> — {check.detail}
            </span>
          </li>
        ))}
      </ul>
      {!result.eligible && result.failureReason && (
        <p className="mt-2 text-xs font-medium text-amber-900">{result.failureReason}</p>
      )}
    </div>
  );
}
