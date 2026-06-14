import type { ParsedCommand } from '@/lib/command-parser';
import { evaluateAgentBudget, type BudgetValidationResult } from '@/lib/agent-budget-validation';
import type { AgentDto, BudgetDto, MandateDto } from '@/types/api';

export type CommandGate = {
  id: string;
  label: string;
  passed: boolean;
  href: string;
  fixLabel: string;
  remediation?: 'navigate' | 'inline';
  detail?: string;
};

export type CommandGateContext = {
  agentId?: string | null;
  agents?: AgentDto[];
  mandates?: MandateDto[];
  /** Budget row for selected agent only — never org summary / primary agent. */
  agentBudget?: BudgetDto | null;
  paymentAmount?: string | null;
  amountDecimals?: number;
  budgetValidation?: BudgetValidationResult | null;
};

export function evaluateCommandGates(
  parsed: ParsedCommand,
  _summary?: unknown,
  context?: CommandGateContext | string | null,
): { ready: boolean; gates: CommandGate[]; budgetValidation: BudgetValidationResult | null } {
  const gateContext: CommandGateContext =
    typeof context === 'string' || context === null || context === undefined
      ? { agentId: context ?? null }
      : context;

  const { agentId, agents = [], mandates = [], agentBudget, paymentAmount, amountDecimals = 6 } =
    gateContext;

  const needsExecutionGates = parsed.kind === 'execution' || parsed.kind === 'x402';

  if (!needsExecutionGates) {
    return { ready: true, gates: [], budgetValidation: null };
  }

  const selectedAgent = agentId ? agents.find((agent) => agent.id === agentId) : null;
  const agentActive = selectedAgent ? selectedAgent.status === 'active' : Boolean(agentId);

  const agentHasPolicy = selectedAgent ? Boolean(selectedAgent.defaultPolicyId) : Boolean(agentId);

  const agentHasMandate =
    agentId && mandates.length > 0
      ? mandates.some((mandate) => mandate.agentId === agentId && mandate.status === 'active')
      : false;

  const gates: CommandGate[] = [
    {
      id: 'agent',
      label: agentId ? 'Agent selected' : 'Agent selection',
      passed: Boolean(agentId) && agentActive,
      href: '/dashboard/agents',
      fixLabel: agentId ? 'Confirm agent active' : 'Select agent',
      remediation: 'inline',
    },
    {
      id: 'policy',
      label: 'Policy rules',
      passed: agentHasPolicy,
      href: '/dashboard/policies',
      fixLabel: 'Assign policy',
    },
    {
      id: 'mandate',
      label: 'Signed mandate',
      passed: agentHasMandate,
      href: agentId ? `/dashboard/agents/${agentId}?tab=authority` : '/dashboard/authority',
      fixLabel: 'Sign mandate',
    },
  ];

  const isUsdc =
    parsed.templateId?.includes('usdc') ||
    parsed.label.toLowerCase().includes('usdc') ||
    parsed.kind === 'x402';

  let budgetValidation: BudgetValidationResult | null = gateContext.budgetValidation ?? null;

  if (isUsdc && agentId) {
    budgetValidation =
      budgetValidation ??
      evaluateAgentBudget({
        budget: agentBudget,
        amountHuman: paymentAmount ?? parsed.amount ?? '1',
        amountDecimals,
        required: true,
      });

    gates.push({
      id: 'budget',
      label: budgetValidation.allow ? 'USDC budget funded' : budgetValidation.message,
      passed: budgetValidation.allow,
      href: '/dashboard/budgets',
      fixLabel: budgetValidation.allow ? 'Fund budget' : budgetValidation.message,
      detail: budgetValidation.message,
    });
  }

  const ready = gates.every((gate) => gate.passed);
  return { ready, gates, budgetValidation };
}
