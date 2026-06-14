import { evaluateCommandGates } from '@/lib/command-gates';
import { chainName } from '@/lib/constants';
import { intentTemplateById } from '@/lib/intent-templates';
import type { ParsedCommand } from '@/lib/command-parser';
import type { DashboardSummaryDto, AgentDto, MandateDto, PolicyDto } from '@/types/api';
import {
  agentTemplateNameFor,
  chainIdForParsed,
  pickAgentCandidate,
  resolveAgentCandidates,
  riskLevelForAgent,
} from './resolver';
import { initialLifecycle, type CommandExecutionPlan } from './types';

function gateStatus(passed: boolean | undefined): 'passed' | 'blocked' {
  return passed ? 'passed' : 'blocked';
}

export function buildCommandExecutionPlan(input: {
  parsed: ParsedCommand;
  agents: AgentDto[];
  mandates: MandateDto[];
  policies: PolicyDto[];
  summary?: DashboardSummaryDto | null;
  selectedAgentId?: string | null;
}): CommandExecutionPlan {
  const { parsed, agents, mandates, policies, summary, selectedAgentId } = input;
  const isAgentCreate = parsed.kind === 'agent';
  const candidates = resolveAgentCandidates(parsed, agents, mandates, policies);
  const { agent, requiresSelection } = isAgentCreate
    ? { agent: null, requiresSelection: false }
    : pickAgentCandidate(candidates, selectedAgentId);
  const chainId = chainIdForParsed(parsed);
  const template = parsed.templateId ? intentTemplateById(parsed.templateId) : null;
  const gateState = evaluateCommandGates(parsed, summary, {
    agentId: agent?.id ?? null,
    agents,
    mandates,
  });

  const budgetGate = gateState.gates.find((g) => g.id === 'budget');
  const mandateGate = gateState.gates.find((g) => g.id === 'mandate');
  const policyGate = gateState.gates.find((g) => g.id === 'policy');

  const needsBudget =
    parsed.kind === 'x402' ||
    parsed.templateId?.includes('usdc') ||
    parsed.label.toLowerCase().includes('usdc');

  const authorityRequirements = isAgentCreate
    ? ['Policy catalog resolved', 'Draft agent record created in-console']
    : ['Verified owner wallet on authority chain', 'Active signed mandate binding agent, policy, and scope'];

  const budgetRequirements = needsBudget
    ? ['USDC agent budget with remaining allowance']
    : ['Budget check not required for this asset scope'];

  const blockers = isAgentCreate ? [] : [...gateState.gates.filter((g) => !g.passed)];
  if (requiresSelection) {
    blockers.unshift({
      id: 'agent-select',
      label: 'Explicit agent selection required',
      passed: false,
      href: '/dashboard/agents',
      fixLabel: 'Select agent below',
    });
  }
  if (!agent && parsed.kind === 'execution') {
    blockers.unshift({
      id: 'agent-match',
      label: 'No agent with matching mandate scope',
      passed: false,
      href: '/dashboard/agents/studio',
      fixLabel: 'Create agent in-console',
    });
  }
  if (!agent && parsed.kind === 'x402') {
    blockers.unshift({
      id: 'agent-match',
      label: 'No treasury-capable agent with USDC mandate',
      passed: false,
      href: '/dashboard/agents/studio',
      fixLabel: 'Create treasury agent',
    });
  }

  const readiness = isAgentCreate || parsed.kind === 'budget' || parsed.kind === 'proof'
    ? 'ready'
    : blockers.length === 0
      ? 'ready'
      : 'blocked';

  const settlementPath = isAgentCreate
    ? 'Agent draft persisted — publish after authority setup'
    : template
      ? `${template.name} on ${chainName(chainId)}`
      : parsed.kind === 'x402'
        ? 'x402 EIP-3009 settlement in-console'
        : parsed.label;

  const proofPath = isAgentCreate ? 'Proof after first governed execution' : 'Outcome Ledger public proof';

  return {
    parsed,
    intentLabel: parsed.label,
    agent,
    agentCandidates: candidates,
    requiresAgentSelection: requiresSelection,
    agentTemplateName: agentTemplateNameFor(parsed),
    policyName: isAgentCreate
      ? agentTemplateNameFor(parsed)?.includes('Treasury')
        ? 'Conservative Treasury Guard'
        : 'Policy from agent template'
      : (agent?.policyName ?? null),
    riskLevel: isAgentCreate ? 'Low' : riskLevelForAgent(agent, policies),
    chainId,
    budgetStatus: isAgentCreate ? 'not_required' : needsBudget ? gateStatus(budgetGate?.passed) : 'not_required',
    authorityStatus: isAgentCreate ? 'not_required' : gateStatus(mandateGate?.passed && policyGate?.passed),
    authorityRequirements,
    budgetRequirements,
    settlementPath,
    proofPath,
    executionRoute: settlementPath,
    proofRoute: proofPath,
    statusLabel: readiness === 'ready' ? 'Ready to Execute' : 'Blocked — resolve setup',
    readiness,
    blockers,
    lifecyclePreview: initialLifecycle(),
  };
}

export function buildPlanResponse(plan: CommandExecutionPlan): string {
  if (plan.parsed.kind === 'agent') {
    return `Planning operation — create ${plan.agentTemplateName ?? 'governed agent'} with policy binding. No existing agent selected. Execute to create the draft in-console.`;
  }

  const agentLine = plan.agent
    ? `Resolved agent ${plan.agent.name} (${plan.agent.capabilityMatch}).`
    : plan.requiresAgentSelection
      ? `${plan.agentCandidates.length} capable agents match — select one below.`
      : 'No capable agent with matching mandate found.';

  return [
    'Planning operation complete.',
    agentLine,
    plan.policyName ? `Policy ${plan.policyName}. Risk ${plan.riskLevel ?? '—'}.` : '',
    plan.readiness === 'ready'
      ? 'Governance checks pass. Execute to run validation, settlement, and proof generation here.'
      : `Blocked: ${plan.blockers.map((b) => b.label).join('; ')}.`,
  ]
    .filter(Boolean)
    .join(' ');
}
