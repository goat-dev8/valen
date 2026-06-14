'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle } from 'lucide-react';
import { AgentEligibilityEvaluation } from '@/components/execution/agent-eligibility-evaluation';
import type { IntentEligibilityResult } from '@/lib/intent-eligibility';
import type { AgentDto } from '@/types/api';

type IntentAgentPickerProps = {
  agents: AgentDto[];
  evaluations: Map<string, IntentEligibilityResult>;
  selectedId: string;
  templateName: string;
  onSelect: (agentId: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function IntentAgentPicker({
  agents,
  evaluations,
  selectedId,
  templateName,
  onSelect,
  onBack,
  onContinue,
}: IntentAgentPickerProps) {
  const selectedEval = selectedId ? evaluations.get(selectedId) : undefined;
  const selectedEligible = selectedEval?.eligible ?? false;

  return (
    <div className="intent-agent-picker">
      <div className="intent-step-intro">
        <p className="intent-step-eyebrow">Step 2</p>
        <h2 className="intent-step-title">Which agent runs this?</h2>
        <p className="intent-step-desc">
          Eligibility is evaluated from each agent&apos;s <strong>active mandate snapshot</strong> for{' '}
          <strong>{templateName}</strong>.
        </p>
      </div>

      <div className="intent-agent-grid space-y-3">
        {agents.map((agent) => {
          const evaluation = evaluations.get(agent.id);
          const eligible = evaluation?.eligible ?? false;
          const selected = agent.id === selectedId;

          return (
            <div key={agent.id} className="space-y-2">
              <button
                type="button"
                onClick={() => onSelect(agent.id)}
                className={`intent-agent-card w-full ${selected ? 'intent-agent-card--selected' : ''} ${
                  eligible ? 'intent-agent-card--ready' : 'intent-agent-card--blocked'
                }`}
              >
                <span className="intent-agent-card__avatar">
                  <Bot className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="intent-agent-card__name">{agent.name}</span>
                  <span className="intent-agent-card__status">
                    {eligible ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        Eligible — mandate snapshot match
                      </>
                    ) : (
                      <span className="text-amber-800">{evaluation?.failureReason ?? 'Mandate scope mismatch'}</span>
                    )}
                  </span>
                </span>
                {selected && <CheckCircle className="h-5 w-5 shrink-0 text-[#0066FF]" aria-hidden />}
              </button>
              {evaluation && (selected || !eligible) && (
                <AgentEligibilityEvaluation agentName={agent.name} result={evaluation} />
              )}
            </div>
          );
        })}
      </div>

      {!selectedEligible && selectedId && selectedEval && (
        <p className="intent-hint intent-hint--warn">
          {selectedEval.failureReason}. Re-sign mandate with required scope on{' '}
          <Link href="/dashboard/authority" className="font-semibold text-[#0066FF] hover:underline">
            Authority
          </Link>
          .
        </p>
      )}

      <div className="intent-step-actions">
        <button type="button" className="app-btn app-btn-outline" onClick={onBack}>
          Back
        </button>
        <button type="button" className="app-btn app-btn-primary" onClick={onContinue} disabled={!selectedEligible}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
