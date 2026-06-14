'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Bot, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { AgentEligibilityEvaluation } from '@/components/execution/agent-eligibility-evaluation';
import { evaluateAgentBudget } from '@/lib/agent-budget-validation';
import { formatAgentDisplayName } from '@/lib/agent-display';
import {
  eligibilityFailureLabel,
  isAgentRunnable,
} from '@/lib/eligibility-failure-label';
import type { IntentEligibilityResult } from '@/lib/intent-eligibility';
import { formatUsdcBaseUnits } from '@/lib/token-amount';
import type { AgentDto, BudgetDto } from '@/types/api';

const MISSING_EVALUATION: IntentEligibilityResult = {
  eligible: false,
  checks: [],
  failureReason: 'No active mandate on agent',
  mandateStatus: 'missing',
};

type IntentAgentPickerProps = {
  agents: AgentDto[];
  evaluations: Map<string, IntentEligibilityResult>;
  budgetsByAgentId: Map<string, BudgetDto>;
  selectedId: string;
  templateName: string;
  paymentAmount?: string;
  requiresBudget?: boolean;
  policyNamesByAgentId?: Map<string, string | null>;
  onSelect: (agentId: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

function budgetLabel(budget: BudgetDto | undefined, requiresBudget: boolean): string {
  if (!requiresBudget) return 'Not required';
  if (!budget) return 'Not configured';
  const remaining = formatUsdcBaseUnits(budget.remaining);
  const status = budget.status ?? 'active';
  if (status !== 'active') return `${remaining} USDC · ${status}`;
  return `${remaining} USDC remaining`;
}

function CompactAgentCard({
  agent,
  evaluation,
  budget,
  policyName,
  requiresBudget,
  paymentAmount,
  selected,
  onSelect,
}: {
  agent: AgentDto;
  evaluation: IntentEligibilityResult;
  budget?: BudgetDto;
  policyName?: string | null;
  requiresBudget: boolean;
  paymentAmount?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const budgetCheck = requiresBudget
    ? evaluateAgentBudget({ budget, amountHuman: paymentAmount ?? '1', required: true })
    : null;
  const runnable = isAgentRunnable(evaluation, budgetCheck, requiresBudget);
  const failureLabel = eligibilityFailureLabel(evaluation, budgetCheck);

  const compactChecks = [
    { label: 'Policy Match', passed: evaluation.checks.find((c) => c.id === 'policy')?.passed ?? false },
    { label: 'Asset Match', passed: evaluation.checks.find((c) => c.id === 'asset')?.passed ?? false },
    { label: 'Network Match', passed: evaluation.checks.find((c) => c.id === 'network')?.passed ?? false },
    { label: 'Action Match', passed: evaluation.checks.find((c) => c.id === 'action')?.passed ?? false },
    { label: 'Active Mandate', passed: evaluation.checks.find((c) => c.id === 'mandate')?.passed ?? false },
    { label: 'Budget Available', passed: !requiresBudget || (budgetCheck?.allow ?? false) },
  ];

  return (
    <div className={`intent-agent-card-wrap ${selected ? 'intent-agent-card-wrap--selected' : ''}`}>
      <button
        type="button"
        onClick={onSelect}
        className={`intent-agent-card w-full ${selected ? 'intent-agent-card--selected' : ''} ${
          runnable ? 'intent-agent-card--ready' : 'intent-agent-card--blocked'
        }`}
      >
        <span className="intent-agent-card__avatar">
          <Bot className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="intent-agent-card__name">{formatAgentDisplayName(agent.name, agent.id)}</span>
          <span className="intent-agent-card__meta">
            {policyName ?? 'No policy'} · {budgetLabel(budget, requiresBudget)}
          </span>
          <span className="intent-agent-card__status">
            {runnable ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Eligible
              </>
            ) : (
              <span className="text-amber-800">{failureLabel}</span>
            )}
          </span>
        </span>
        {selected && <CheckCircle className="h-5 w-5 shrink-0 text-[#0066FF]" aria-hidden />}
      </button>

      <div className="intent-agent-card__checks">
        {compactChecks.map((check) => (
          <span
            key={check.label}
            className={`intent-agent-card__check ${check.passed ? 'intent-agent-card__check--ok' : 'intent-agent-card__check--fail'}`}
          >
            {check.passed ? '✓' : '✗'} {check.label}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="intent-agent-card__details-toggle"
        onClick={() => setDetailsOpen((open) => !open)}
      >
        {detailsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        View Details
      </button>

      {detailsOpen && (
        <AgentEligibilityEvaluation
          agentName={formatAgentDisplayName(agent.name, agent.id)}
          result={evaluation}
          budgetCheck={budgetCheck}
        />
      )}
    </div>
  );
}

export function IntentAgentPicker({
  agents,
  evaluations,
  budgetsByAgentId,
  selectedId,
  templateName,
  paymentAmount,
  requiresBudget = false,
  policyNamesByAgentId,
  onSelect,
  onBack,
  onContinue,
}: IntentAgentPickerProps) {
  const [ineligibleOpen, setIneligibleOpen] = useState(false);

  const { eligible, ineligible } = useMemo(() => {
    const eligibleList: AgentDto[] = [];
    const ineligibleList: AgentDto[] = [];

    for (const agent of agents) {
      const evaluation = evaluations.get(agent.id);
      if (!evaluation) {
        ineligibleList.push(agent);
        continue;
      }
      const budget = budgetsByAgentId.get(agent.id);
      const budgetCheck = requiresBudget
        ? evaluateAgentBudget({ budget, amountHuman: paymentAmount, required: true })
        : null;
      if (isAgentRunnable(evaluation, budgetCheck, requiresBudget)) {
        eligibleList.push(agent);
      } else {
        ineligibleList.push(agent);
      }
    }

    const sortByBudget = (list: AgentDto[]) =>
      [...list].sort((a, b) => {
        const aRem = parseInt(budgetsByAgentId.get(a.id)?.remaining ?? '0', 10);
        const bRem = parseInt(budgetsByAgentId.get(b.id)?.remaining ?? '0', 10);
        return bRem - aRem;
      });

    return {
      eligible: sortByBudget(eligibleList),
      ineligible: ineligibleList,
    };
  }, [agents, evaluations, budgetsByAgentId, requiresBudget, paymentAmount]);

  const selectedEval = selectedId ? evaluations.get(selectedId) : undefined;
  const selectedBudget = selectedId ? budgetsByAgentId.get(selectedId) : undefined;
  const selectedBudgetCheck = requiresBudget
    ? evaluateAgentBudget({ budget: selectedBudget, amountHuman: paymentAmount, required: true })
    : null;
  const selectedRunnable = selectedEval
    ? isAgentRunnable(selectedEval, selectedBudgetCheck, requiresBudget)
    : false;
  const selectedFailure = selectedEval
    ? eligibilityFailureLabel(selectedEval, selectedBudgetCheck)
    : 'Select an agent';

  return (
    <div className="intent-agent-picker">
      <div className="intent-step-intro">
        <p className="intent-step-eyebrow">Step 2</p>
        <h2 className="intent-step-title">Which agent runs this?</h2>
        <p className="intent-step-desc">
          Eligibility uses each agent&apos;s <strong>active mandate snapshot</strong> for{' '}
          <strong>{templateName}</strong>. Budget is checked for the selected agent only.
        </p>
      </div>

      <section className="intent-agent-section">
        <h3 className="intent-agent-section__title">Eligible agents</h3>
        {eligible.length === 0 ? (
          <p className="intent-hint intent-hint--warn">No agents pass mandate scope and budget for this intent.</p>
        ) : (
          <div className="intent-agent-grid space-y-3">
            {eligible.map((agent) => (
              <CompactAgentCard
                key={agent.id}
                agent={agent}
                evaluation={evaluations.get(agent.id) ?? MISSING_EVALUATION}
                budget={budgetsByAgentId.get(agent.id)}
                policyName={policyNamesByAgentId?.get(agent.id)}
                requiresBudget={requiresBudget}
                paymentAmount={paymentAmount}
                selected={agent.id === selectedId}
                onSelect={() => onSelect(agent.id)}
              />
            ))}
          </div>
        )}
      </section>

      {ineligible.length > 0 && (
        <section className="intent-agent-section intent-agent-section--collapsed">
          <button
            type="button"
            className="intent-agent-section__toggle"
            onClick={() => setIneligibleOpen((open) => !open)}
          >
            {ineligibleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Not eligible ({ineligible.length})
          </button>
          {ineligibleOpen && (
            <div className="intent-agent-grid space-y-3 mt-3">
              {ineligible.map((agent) => {
                const evaluation = evaluations.get(agent.id) ?? MISSING_EVALUATION;
                return (
                  <CompactAgentCard
                    key={agent.id}
                    agent={agent}
                    evaluation={evaluation}
                    budget={budgetsByAgentId.get(agent.id)}
                    policyName={policyNamesByAgentId?.get(agent.id)}
                    requiresBudget={requiresBudget}
                    paymentAmount={paymentAmount}
                    selected={agent.id === selectedId}
                    onSelect={() => onSelect(agent.id)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {!selectedRunnable && selectedId && selectedEval && (
        <p className="intent-hint intent-hint--warn">
          {selectedFailure}.{' '}
          {selectedFailure.includes('Budget') ? (
            <>
              Top up budget on{' '}
              <Link href="/dashboard/budgets" className="font-semibold text-[#0066FF] hover:underline">
                Budgets
              </Link>
              .
            </>
          ) : (
            <>
              Re-sign mandate on{' '}
              <Link href="/dashboard/authority" className="font-semibold text-[#0066FF] hover:underline">
                Authority
              </Link>
              .
            </>
          )}
        </p>
      )}

      <div className="intent-step-actions">
        <button type="button" className="app-btn app-btn-outline" onClick={onBack}>
          Back
        </button>
        <button type="button" className="app-btn app-btn-primary" onClick={onContinue} disabled={!selectedRunnable}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
