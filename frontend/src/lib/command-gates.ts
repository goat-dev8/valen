import type { ParsedCommand } from '@/lib/command-parser';
import type { DashboardSummaryDto } from '@/types/api';

export type CommandGate = {
  id: string;
  label: string;
  passed: boolean;
  href: string;
  fixLabel: string;
};

export function evaluateCommandGates(
  parsed: ParsedCommand,
  summary?: DashboardSummaryDto | null,
): { ready: boolean; gates: CommandGate[] } {
  const readiness = summary?.readiness;
  const needsExecutionGates = parsed.kind === 'execution' || parsed.kind === 'x402';

  if (!needsExecutionGates) {
    return { ready: true, gates: [] };
  }

  const gates: CommandGate[] = [
    {
      id: 'agent',
      label: 'Active agent',
      passed: readiness?.agentActive ?? false,
      href: '/dashboard/agents/studio',
      fixLabel: 'Register agent',
    },
    {
      id: 'policy',
      label: 'Policy rules',
      passed: readiness?.rulesActive ?? false,
      href: '/dashboard/policies/new',
      fixLabel: 'Create policy',
    },
    {
      id: 'mandate',
      label: 'Signed mandate',
      passed: readiness?.mandateSigned ?? false,
      href: '/dashboard/authority',
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
