import { agentTemplateById } from '@/lib/agent-templates';
import { intentTemplateById } from '@/lib/intent-templates';
import {
  bestMandateEvaluation,
  evaluateIntentEligibility,
  findEligibleMandate,
  intentRequirementsFromTemplate,
  resolveMandateSnapshot,
} from '@/lib/intent-eligibility';
import { resolvePolicyTemplateByPolicyId } from '@/lib/policy-mandate-config';
import { policyRiskDisplay } from '@/lib/policy-mandate-config';
import type { ParsedCommand } from '@/lib/command-parser';
import type { AgentDto, MandateDto, PolicyDto } from '@/types/api';
import type { AgentCandidate } from './types';

function templateContext(parsed: ParsedCommand) {
  const template = parsed.templateId ? intentTemplateById(parsed.templateId) : null;
  return { template, chainId: template?.targetChainId ?? (parsed.kind === 'x402' ? 421614 : 421614) };
}

function requirementsForParsed(
  parsed: ParsedCommand,
  targetAddress = '0x0000000000000000000000000000000000000000',
  assetAddress = '',
) {
  const { template } = templateContext(parsed);
  if (template) {
    return intentRequirementsFromTemplate(template, targetAddress, assetAddress || template.assetAddress || '');
  }
  if (parsed.kind === 'x402') {
    return {
      assetSymbol: 'USDC',
      actionLabel: 'x402 Payment',
      actionType: 'x402_payment',
      networkId: 421614,
      networkLabel: 'Arbitrum Sepolia',
      policyName: 'Any',
    };
  }
  return null;
}

export function resolveAgentCandidates(
  parsed: ParsedCommand,
  agents: AgentDto[],
  mandates: MandateDto[],
  policies: PolicyDto[],
): AgentCandidate[] {
  if (parsed.kind === 'agent' || parsed.kind === 'identity') return [];

  const requirements = requirementsForParsed(parsed);
  if (!requirements) return [];

  const activeAgents = agents.filter((agent) => agent.status === 'active');
  const candidates: AgentCandidate[] = [];

  for (const agent of activeAgents) {
    const policy = policies.find((p) => p.id === agent.defaultPolicyId);
    const match = findEligibleMandate(mandates, agent.id, requirements, policy?.name ?? null);
    const evaluation =
      match?.result ??
      bestMandateEvaluation(mandates, agent.id, requirements, policy?.name ?? null);
    if (!evaluation) continue;

    let score = evaluation.eligible ? 100 : 10;
    if (agent.defaultPolicyId) score += 20;

    candidates.push({
      id: agent.id,
      name: agent.name,
      policyId: agent.defaultPolicyId,
      policyName: policy?.name ?? null,
      mandateId: match?.mandate.id ?? null,
      score,
      capabilityMatch: evaluation.eligible ? 'Mandate snapshot match' : evaluation.failureReason ?? 'Scope mismatch',
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function pickAgentCandidate(
  candidates: AgentCandidate[],
  selectedAgentId?: string | null,
): { agent: AgentCandidate | null; requiresSelection: boolean } {
  if (selectedAgentId) {
    const selected = candidates.find((c) => c.id === selectedAgentId) ?? null;
    return { agent: selected, requiresSelection: false };
  }
  const eligible = candidates.filter((c) => c.score >= 100);
  if (eligible.length === 1) return { agent: eligible[0], requiresSelection: false };
  if (eligible.length > 1) return { agent: null, requiresSelection: true };
  if (candidates.length >= 1) return { agent: null, requiresSelection: true };
  return { agent: null, requiresSelection: false };
}

export function riskLevelForAgent(agent: AgentCandidate | null, policies: PolicyDto[]): string | null {
  if (!agent?.policyId) return null;
  const template = resolvePolicyTemplateByPolicyId(policies, agent.policyId);
  return template ? policyRiskDisplay(template.riskLevel) : null;
}

export function chainIdForParsed(parsed: ParsedCommand): number {
  return templateContext(parsed).chainId;
}

export function agentTemplateNameFor(parsed: ParsedCommand): string | null {
  if (parsed.kind !== 'agent') return null;
  return agentTemplateById(parsed.agentTemplateId ?? 'usdc-treasury').name;
}

export { evaluateIntentEligibility, intentRequirementsFromTemplate, resolveMandateSnapshot, requirementsForParsed };
