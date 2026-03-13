'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import type { AgentDto } from '@/types/api';

type IntentAgentPickerProps = {
  agents: AgentDto[];
  matchingAgentIds: Set<string>;
  selectedId: string;
  templateName: string;
  onSelect: (agentId: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function IntentAgentPicker({
  agents,
  matchingAgentIds,
  selectedId,
  templateName,
  onSelect,
  onBack,
  onContinue,
}: IntentAgentPickerProps) {
  const selectedMatches = selectedId ? matchingAgentIds.has(selectedId) : false;

  return (
    <div className="intent-agent-picker">
      <div className="intent-step-intro">
        <p className="intent-step-eyebrow">Step 2</p>
        <h2 className="intent-step-title">Which agent runs this?</h2>
        <p className="intent-step-desc">
          Only agents with a matching mandate for <strong>{templateName}</strong> can submit this intent.
        </p>
      </div>

      <div className="intent-agent-grid">
        {agents.map((agent) => {
          const matches = matchingAgentIds.has(agent.id);
          const selected = agent.id === selectedId;

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent.id)}
              className={`intent-agent-card ${selected ? 'intent-agent-card--selected' : ''} ${
                matches ? 'intent-agent-card--ready' : 'intent-agent-card--blocked'
              }`}
            >
              <span className="intent-agent-card__avatar">
                <Bot className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="intent-agent-card__name">{agent.name}</span>
                <span className="intent-agent-card__status">
                  {matches ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Mandate matches
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      No matching mandate
                    </>
                  )}
                </span>
              </span>
              {selected && <CheckCircle className="h-5 w-5 shrink-0 text-[#0066FF]" aria-hidden />}
            </button>
          );
        })}
      </div>

      {!selectedMatches && selectedId && (
        <p className="intent-hint intent-hint--warn">
          This agent needs an active mandate for this chain and action.{' '}
          <Link href="/dashboard/authority" className="font-semibold text-[#0066FF] hover:underline">
            Set up authority →
          </Link>
        </p>
      )}

      <div className="intent-step-actions">
        <button type="button" className="app-btn app-btn-outline" onClick={onBack}>
          Back
        </button>
        <button type="button" className="app-btn app-btn-primary" onClick={onContinue} disabled={!selectedId}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
