import type { ParsedCommand } from '@/lib/command-parser';
import type { AgentDto, DashboardSummaryDto, MandateDto } from '@/types/api';

export type CommandGate = {
  id: string;
  label: string;
  passed: boolean;
  href: string;
  fixLabel: string;
  remediation?: 'navigate' | 'inline';
};

export type CommandGateContext = {
  agentId?: string | null;
  agents?: AgentDto[];
  mandates?: MandateDto[];
};

export function evaluateCommandGates(
  parsed: ParsedCommand,
  summary?: DashboardSummaryDto | null,
  context?: CommandGateContext | string | null,
): { ready: boolean; gates: CommandGate[] } {
  const gateContext: CommandGateContext =
    typeof context === 'string' || context === null || context === undefined
      ? { agentId: context ?? null }
      : context;

  const { agentId, agents = [], mandates = [] } = gateContext;
  const readiness = summary?.readiness;
  const needsExecutionGates = parsed.kind === 'execution' || parsed.kind === 'x402';

  if (!needsExecutionGates) {
    return { ready: true, gates: [] };
  }

  const selectedAgent = agentId ? agents.find((agent) => agent.id === agentId) : null;
  const agentActive = selectedAgent
    ? selectedAgent.status === 'active'
    : agentId
      ? true
      : (readiness?.agentActive ?? false);

  const agentHasPolicy = selectedAgent
    ? Boolean(selectedAgent.defaultPolicyId)
    : agentId
      ? true
      : (readiness?.rulesActive ?? false);

  const agentHasMandate =
    agentId && mandates.length > 0
      ? mandates.some((mandate) => mandate.agentId === agentId && mandate.status === 'active')
      : (readiness?.mandateSigned ?? false);

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

  if (isUsdc) {
    gates.push({
      id: 'budget',
      label: 'USDC budget funded',
      passed: readiness?.usdcBudgetFunded ?? false,
      href: '/dashboard/budgets',
      fixLabel: 'Fund budget',
    });
  }

  const ready = gates.every((gate) => gate.passed);
  return { ready, gates };
}
