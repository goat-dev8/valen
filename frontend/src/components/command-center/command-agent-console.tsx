'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, Bot, RotateCcw, Sparkles, User, X } from 'lucide-react';
import {
  CommandGateBanner,
  CommandPlanCard,
  CommandPreviewCard,
} from '@/components/command-center/command-preview-card';
import { CommandLifecycleTracker } from '@/components/command-center/command-lifecycle-tracker';
import { VerifyWalletModal } from '@/components/mandate/verify-wallet-modal';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { createAgentDraftFromCommand } from '@/lib/command-agent/agent-factory';
import { executeGovernedCommand } from '@/lib/command-agent/executor';
import { executeX402InConsole } from '@/lib/command-agent/x402-executor';
import { buildCommandExecutionPlan, buildPlanResponse } from '@/lib/command-agent/planner';
import type {
  CommandExecutionPlan,
  CommandExecutionResult,
  CommandSessionState,
  LifecycleStep,
} from '@/lib/command-agent/types';
import { initialLifecycle } from '@/lib/command-agent/types';
import { parseCommand, type ParsedCommand } from '@/lib/command-parser';
import type { CommandGate } from '@/lib/command-gates';
import { evaluateAgentBudget } from '@/lib/agent-budget-validation';
import { formatAgentDisplayName } from '@/lib/agent-display';
import { useConnectedWalletAddress } from '@/hooks/use-connected-wallet-address';
import { useCreateAgent, useCreateExecution, useX402Execute, useX402Initiate } from '@/hooks/use-valen-api';
import { api } from '@/lib/api';
import type { AgentDto, BudgetDto, DashboardSummaryDto, MandateDto, PolicyDto } from '@/types/api';
import { formatApiErrorMessage } from '@/lib/utils';

const SUGGESTIONS = [
  'Pay 1 USDC',
  'Transfer 1 TSLA to wallet',
  'Create x402 payment',
  'Show latest proofs',
  'Show my budgets',
];

type ResultLink = { href: string; label: string };

type ChatEntry = {
  id: string;
  role: 'user' | 'valen' | 'result';
  text: string;
  parsed?: ParsedCommand;
  plan?: CommandExecutionPlan;
  lifecycle?: LifecycleStep[];
  links?: ResultLink[];
};

type CommandAgentConsoleProps = {
  summary?: DashboardSummaryDto | null;
  agents?: AgentDto[];
  mandates?: MandateDto[];
  policies?: PolicyDto[];
  /** Fallback drawer only when in-console execution needs extra user input. */
  onX402Open?: (amount?: string) => void;
};

function stateClass(state: CommandSessionState): string {
  return `command-agent-console__state command-agent-console__state--${state}`;
}

function resultLinksFromExecution(result: CommandExecutionResult): ResultLink[] {
  const links: ResultLink[] = [];
  if (result.proofHref) links.push({ href: result.proofHref, label: 'View proof' });
  if (result.executionId) links.push({ href: `/dashboard/executions/${result.executionId}`, label: 'Execution details' });
  if (result.txHref) links.push({ href: result.txHref, label: 'Transaction' });
  if (result.secondaryHref && result.secondaryLabel) {
    links.push({ href: result.secondaryHref, label: result.secondaryLabel });
  }
  return links;
}

export function CommandAgentConsole({
  summary,
  agents = [],
  mandates = [],
  policies = [],
  onX402Open,
}: CommandAgentConsoleProps) {
  const { token } = useAuth();
  const { orgId } = useOrganization();
  const createExecution = useCreateExecution();
  const createAgent = useCreateAgent();
  const x402Initiate = useX402Initiate();
  const x402Execute = useX402Execute();
  const { address: connectedWallet } = useConnectedWalletAddress();
  const [input, setInput] = useState('');
  const [sessionState, setSessionState] = useState<CommandSessionState>('draft');
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      role: 'valen',
      text: 'VALEN Command Agent — execution console. Plan scopes governance here; Execute runs policy, authority, budget, settlement, and proof in this thread.',
    },
  ]);
  const [activeParsed, setActiveParsed] = useState<ParsedCommand | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [plan, setPlan] = useState<CommandExecutionPlan | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleStep[]>([]);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const budgetQueries = useQueries({
    queries: agents.map((agent) => ({
      queryKey: ['budget', orgId, agent.id],
      queryFn: () => api.budget.get(token!, orgId!, agent.id),
      enabled: Boolean(token && orgId),
      staleTime: 30_000,
    })),
  });

  const budgetsByAgentId = useMemo(() => {
    const map = new Map<string, BudgetDto>();
    agents.forEach((agent, index) => {
      const row = budgetQueries[index]?.data;
      if (row) map.set(agent.id, row);
    });
    return map;
  }, [agents, budgetQueries]);

  const resolvedAgentId = selectedAgentId ?? plan?.agent?.id ?? null;
  const selectedAgentBudget = resolvedAgentId ? budgetsByAgentId.get(resolvedAgentId) ?? null : null;

  const pushEntry = useCallback((entry: ChatEntry) => {
    setEntries((current) => [...current, entry]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
  }, []);

  const clearSelection = useCallback(() => {
    setActiveParsed(null);
    setSelectedAgentId(null);
    setPlan(null);
    setLifecycle([]);
    setSessionState('draft');
    setInput('');
  }, []);

  const rebuildPlan = useCallback(
    (parsed: ParsedCommand, agentId: string | null) => {
      const agentBudget = agentId ? budgetsByAgentId.get(agentId) ?? null : null;
      const nextPlan = buildCommandExecutionPlan({
        parsed,
        agents,
        mandates,
        policies,
        selectedAgentId: agentId,
        agentBudget,
        budgetsByAgentId,
      });
      setPlan(nextPlan);
      setSessionState(nextPlan.readiness === 'ready' ? 'ready' : 'planned');
      return nextPlan;
    },
    [agents, mandates, policies, budgetsByAgentId],
  );

  const planCommand = useCallback(
    (raw: string) => {
      const parsed = parseCommand(raw);
      if (!parsed) return;
      pushEntry({ id: `user-${Date.now()}`, role: 'user', text: raw });
      setActiveParsed(parsed);
      setSelectedAgentId(null);
      const nextPlan = rebuildPlan(parsed, null);
      pushEntry({
        id: `valen-${Date.now()}`,
        role: 'valen',
        text: buildPlanResponse(nextPlan),
        parsed,
        plan: nextPlan,
      });
    },
    [pushEntry, rebuildPlan],
  );

  const handleAgentSelect = useCallback(
    (agentId: string) => {
      if (!agentId) {
        setSelectedAgentId(null);
        if (activeParsed) rebuildPlan(activeParsed, null);
        return;
      }
      setSelectedAgentId(agentId);
      if (!activeParsed) return;
      const nextPlan = rebuildPlan(activeParsed, agentId);
      pushEntry({
        id: `valen-agent-${Date.now()}`,
        role: 'valen',
        text: `Agent set to ${nextPlan.agent ? formatAgentDisplayName(nextPlan.agent.name, nextPlan.agent.id) : agentId}. ${
          nextPlan.readiness === 'ready' ? 'Ready to execute.' : nextPlan.budgetMessage ?? 'Complete remaining setup steps below.'
        }`,
        plan: nextPlan,
      });
    },
    [activeParsed, pushEntry, rebuildPlan],
  );

  const handleRemediate = useCallback(
    (gate: CommandGate) => {
      if (gate.id === 'mandate') {
        pushEntry({
          id: `valen-fix-${Date.now()}`,
          role: 'valen',
          text: `Signed mandate required for ${plan?.agent?.name ?? 'the selected agent'}. Open authority setup to sign on the correct chain, or verify your wallet first if the mandate form is blocked.`,
          links: plan?.agent?.id
            ? [{ href: `/dashboard/agents/${plan.agent.id}?tab=authority`, label: 'Authority setup (optional)' }]
            : [{ href: gate.href, label: 'Authority (optional)' }],
        });
        return;
      }
      if (gate.id === 'budget') {
        pushEntry({
          id: `valen-fix-${Date.now()}`,
          role: 'valen',
          text: plan?.budgetMessage ?? gate.detail ?? 'Budget exhausted — top up the selected agent USDC budget.',
          links: [{ href: '/dashboard/budgets', label: 'Open budgets (optional)' }],
        });
        return;
      }
      if (gate.id === 'policy') {
        pushEntry({
          id: `valen-fix-${Date.now()}`,
          role: 'valen',
          text: 'Assign an active policy to the selected agent before executing governed actions.',
          links: [{ href: gate.href, label: 'Policies (optional)' }],
        });
        return;
      }
      if (gate.remediation === 'inline') {
        setVerifyOpen(true);
        return;
      }
      pushEntry({
        id: `valen-fix-${Date.now()}`,
        role: 'valen',
        text: gate.label,
        links: [{ href: gate.href, label: `${gate.fixLabel} (optional)` }],
      });
    },
    [plan?.agent?.id, plan?.agent?.name, plan?.budgetMessage, pushEntry],
  );

  const pushResult = useCallback(
    (text: string, resultLifecycle?: LifecycleStep[], links?: ResultLink[]) => {
      pushEntry({
        id: `result-${Date.now()}`,
        role: 'result',
        text,
        lifecycle: resultLifecycle,
        links,
      });
    },
    [pushEntry],
  );

  const executeCommand = useCallback(async () => {
    if (!plan || !activeParsed) return;

    if (activeParsed.kind === 'agent') {
      if (!token || !orgId) {
        pushResult('Authentication required to create agent draft.', plan.lifecyclePreview);
        setSessionState('refused');
        return;
      }
      setSessionState('executing');
      setLifecycle(plan.lifecyclePreview);
      try {
        const draft = await createAgentDraftFromCommand({
          parsed: activeParsed,
          agents,
          policies,
          token,
          orgId,
          createAgent: (body) => createAgent.mutateAsync(body),
        });
        const steps = plan.lifecyclePreview.map((step) => {
          if (step.id === 'intent_parsed' || step.id === 'policy_check' || step.id === 'completed') {
            return { ...step, status: 'passed' as const, detail: step.id === 'completed' ? 'Draft created' : step.detail };
          }
          return { ...step, status: 'skipped' as const };
        });
        setLifecycle(steps);
        setSessionState('completed');
        pushResult(
          `Agent draft created — ${draft.name}. Policy ${draft.policyName}. Budget cap ${draft.budgetLabel}. Status ${draft.status}.`,
          steps,
          [
            { href: `/dashboard/agents/${draft.agentId}`, label: 'Review' },
            { href: `/dashboard/agents/studio?agentId=${draft.agentId}&step=6`, label: 'Publish' },
          ],
        );
      } catch (err) {
        setSessionState('refused');
        pushResult(formatApiErrorMessage(err, 'Agent creation failed'), plan.lifecyclePreview);
      }
      return;
    }

    if (plan.readiness !== 'ready' && (activeParsed.kind === 'execution' || activeParsed.kind === 'x402')) {
      pushResult(
        `Execution refused — ${plan.blockers.map((b) => b.label).join('; ')}. Resolve blockers below, then execute again.`,
        plan.lifecyclePreview,
      );
      setSessionState('refused');
      return;
    }

    if (activeParsed.kind === 'x402') {
      setSessionState('executing');
      setLifecycle(plan.lifecyclePreview);
      const budgetValidation = evaluateAgentBudget({
        budget: selectedAgentBudget,
        amountHuman: activeParsed.amount ?? '1',
        required: true,
      });
      const result = await executeX402InConsole({
        plan,
        amount: activeParsed.amount ?? '1',
        recipient: connectedWallet ?? undefined,
        mandates,
        agentBudget: selectedAgentBudget,
        budgetValidation,
        x402Initiate: (body) => x402Initiate.mutateAsync(body),
        x402Execute: (paymentId) => x402Execute.mutateAsync(paymentId),
        onStepUpdate: setLifecycle,
      });
      setLifecycle(result.lifecycle);
      setSessionState(result.status === 'success' ? 'completed' : 'refused');
      pushResult(result.message, result.lifecycle, resultLinksFromExecution(result));
      return;
    }

    if (activeParsed.kind === 'budget') {
      setSessionState('executing');
      const steps = initialLifecycle().map((step, index) => {
        if (step.id === 'intent_parsed') return { ...step, status: 'passed' as const };
        if (step.id === 'budget_check') return { ...step, status: 'passed' as const, detail: 'Budget envelope read' };
        if (step.id === 'completed') return { ...step, status: 'passed' as const, detail: 'Budget status returned' };
        if (index <= 2) return { ...step, status: 'skipped' as const };
        return { ...step, status: 'skipped' as const };
      });
      pushResult(
        `Budget status — remaining ${summary?.budget.remaining ?? '—'} ${summary?.budget.assetSymbol ?? 'USDC'} · cap ${summary?.budget.cap ?? '—'} · spent ${summary?.budget.spent ?? '—'}.`,
        steps,
        [{ href: '/dashboard/budgets', label: 'Manage budgets (optional)' }],
      );
      setSessionState('completed');
      return;
    }

    if (activeParsed.kind === 'proof') {
      setSessionState('executing');
      const proofHref = summary?.latest?.proof?.href ?? '/dashboard/proofs';
      const steps = initialLifecycle().map((step) => {
        if (step.id === 'intent_parsed' || step.id === 'proof_generation' || step.id === 'completed') {
          return {
            ...step,
            status: 'passed' as const,
            detail: step.id === 'proof_generation' ? 'Latest proof resolved' : undefined,
          };
        }
        return { ...step, status: 'skipped' as const };
      });
      pushResult(
        summary?.latest?.proof
          ? `Latest proof for ${summary.latest.proof.actionType ?? 'governed action'}${summary.latest.proof.txHash ? ` · tx ${summary.latest.proof.txHash.slice(0, 10)}…` : ''}.`
          : 'No proofs yet — execute a governed action to generate Outcome Ledger entries.',
        steps,
        [{ href: proofHref, label: 'View Outcome Ledger' }],
      );
      setSessionState('completed');
      return;
    }

    setSessionState('executing');
    setLifecycle(plan.lifecyclePreview);
    const result = await executeGovernedCommand({
      plan,
      agents,
      mandates,
      agentBudget: selectedAgentBudget,
      connectedWallet: connectedWallet ?? undefined,
      createExecution: (body) => createExecution.mutateAsync(body),
      onStepUpdate: setLifecycle,
    });
    setLifecycle(result.lifecycle);
    setSessionState(result.status === 'success' ? 'completed' : 'refused');
    pushResult(result.message, result.lifecycle, resultLinksFromExecution(result));
  }, [
    plan,
    activeParsed,
    onX402Open,
    pushResult,
    connectedWallet,
    createExecution,
    createAgent,
    agents,
    mandates,
    policies,
    token,
    orgId,
    x402Initiate,
    x402Execute,
    selectedAgentBudget,
  ]);

  const canExecute = useMemo(() => {
    if (!plan || !activeParsed) return false;
    if (sessionState === 'executing') return false;
    if (activeParsed.kind === 'agent') return Boolean(token && orgId);
    if (activeParsed.kind === 'budget' || activeParsed.kind === 'proof') return true;
    if (activeParsed.kind === 'x402') return plan.readiness === 'ready' && Boolean(connectedWallet);
    return plan.readiness === 'ready';
  }, [plan, activeParsed, sessionState, connectedWallet, token, orgId]);

  return (
    <>
      <section className="command-agent-console app-panel-floating">
        <div className="command-agent-console__head">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0066FF]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0066FF]">VALEN Command Agent</p>
            </div>
            {sessionState !== 'draft' && (
              <div className="flex items-center gap-2">
                <span className={stateClass(sessionState)}>{sessionState}</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-[#5E6C7B]">AI operations console — plan, execute, and prove without page routing.</p>
          {activeParsed && (
            <div className="command-agent-console__toolbar mt-3">
              <button type="button" className="command-agent-console__tool" onClick={clearSelection}>
                <RotateCcw className="h-3.5 w-3.5" />
                Clear selection
              </button>
              <button type="button" className="command-agent-console__tool" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" />
                New command
              </button>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="command-agent-console__thread">
          {entries.map((entry) => (
            <div key={entry.id} className={`command-agent-console__bubble command-agent-console__bubble--${entry.role}`}>
              <div className="command-agent-console__bubble-icon">
                {entry.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="command-agent-console__bubble-text">{entry.text}</p>
                {entry.parsed && entry.role === 'valen' && entry.plan && (
                  <>
                    <CommandPreviewCard
                      parsed={entry.parsed}
                      plan={entry.plan}
                      selectedAgentId={selectedAgentId}
                      onSelectAgent={handleAgentSelect}
                    />
                    <CommandPlanCard plan={entry.plan} />
                  </>
                )}
                {entry.lifecycle && entry.lifecycle.length > 0 && <CommandLifecycleTracker steps={entry.lifecycle} />}
                {entry.links && entry.links.length > 0 && (
                  <div className="command-agent-console__result-links">
                    {entry.links.map((link) => (
                      <Link key={link.href} href={link.href} className="text-xs font-semibold text-[#0066FF] hover:underline">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {lifecycle.length > 0 && sessionState === 'executing' && <CommandLifecycleTracker steps={lifecycle} />}

        {plan && plan.blockers.length > 0 && (
          <CommandGateBanner gates={plan.blockers} onRemediate={handleRemediate} />
        )}

        <div className="command-agent-console__composer">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim()) {
                planCommand(input);
                setInput('');
              }
            }}
            placeholder="Pay 1 USDC, transfer TSLA, show budgets…"
            className="app-input flex-1 py-3 text-base"
            aria-label="Command agent input"
          />
          <button
            type="button"
            className="app-btn app-btn-outline shrink-0"
            disabled={!input.trim()}
            onClick={() => {
              if (!input.trim()) return;
              planCommand(input);
              setInput('');
            }}
          >
            Plan
          </button>
          <button
            type="button"
            className="app-btn app-btn-primary shrink-0"
            disabled={!canExecute}
            onClick={() => void executeCommand()}
          >
            Execute
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="command-agent-console__suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" className="command-agent-console__chip" onClick={() => planCommand(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      <VerifyWalletModal
        open={verifyOpen}
        chainId={plan?.chainId ?? 421614}
        onClose={() => setVerifyOpen(false)}
        onVerified={() => setVerifyOpen(false)}
      />
    </>
  );
}
