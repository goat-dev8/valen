import { agentTemplateById } from '@/lib/agent-templates';
import { agentHasCapabilities, requiredCapabilities } from '@/lib/command-agent/capabilities';
import { mandateMatchesIntent } from '@/lib/mandate-match';
import { intentTemplateById } from '@/lib/intent-templates';
import { resolvePolicyTemplateByPolicyId } from '@/lib/policy-mandate-config';
import { policyRiskDisplay } from '@/lib/policy-mandate-config';
import type { ParsedCommand } from '@/lib/command-parser';
import type { AgentDto, MandateDto, PolicyDto } from '@/types/api';
import type { AgentCandidate } from './types';

const ROBINHOOD_TARGET = '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3';

function templateContext(parsed: ParsedCommand) {
  const template = parsed.templateId ? intentTemplateById(parsed.templateId) : null;
  return {
    template,
    chainId: template?.targetChainId ?? (parsed.kind === 'x402' ? 421614 : 421614),
    actionType: template?.actionType ?? 'transfer',
    targetAddress: template?.targetAddress ?? ROBINHOOD_TARGET,
    assetAddress: template?.assetAddress ?? '',
  };
}

function capabilityLabel(parsed: ParsedCommand): string {
  const required = requiredCapabilities(parsed);
  if (required.includes('x402_payment')) return 'Treasury / x402 capable';
  if (required.includes('robinhood_trade')) return 'Robinhood trading capable';
  return 'Transfer capable';
}

export function resolveAgentCandidates(
  parsed: ParsedCommand,
  agents: AgentDto[],
  mandates: MandateDto[],
  policies: PolicyDto[],
): AgentCandidate[] {
  if (parsed.kind === 'agent' || parsed.kind === 'identity') {
    return [];
  }

  const ctx = templateContext(parsed);
  const requiredCaps = requiredCapabilities(parsed);
  if (!ctx.template && parsed.kind !== 'execution' && parsed.kind !== 'x402') {
    return [];
  }

  const activeAgents = agents.filter((agent) => agent.status === 'active');
  const candidates: AgentCandidate[] = [];

  for (const agent of activeAgents) {
    if (!agentHasCapabilities(agent, requiredCaps)) continue;

    const agentMandates = mandates.filter((m) => m.agentId === agent.id && m.status === 'active');
    const matchingMandate = agentMandates.find((mandate) =>
      ctx.template
        ? mandateMatchesIntent({
            mandate,
            agentId: agent.id,
            chainId: ctx.chainId,
            actionType: ctx.actionType,
            templateId: ctx.template.id,
            targetAddress: ctx.targetAddress,
            assetAddress: ctx.assetAddress,
          })
        : parsed.kind === 'x402'
          ? mandate.allowedActions?.some((a) => a.includes('x402') || a === 'transfer')
          : false,
    );

    if (!matchingMandate && (parsed.kind === 'execution' || parsed.kind === 'x402')) continue;

    const policy = policies.find((p) => p.id === agent.defaultPolicyId);
    let score = 0;
    if (matchingMandate) score += 100;
    if (agent.defaultPolicyId) score += 20;
    if (ctx.template && matchingMandate?.allowedChains?.includes(ctx.chainId)) score += 10;
    if (agentHasCapabilities(agent, requiredCaps)) score += 15;

    candidates.push({
      id: agent.id,
      name: agent.name,
      policyId: agent.defaultPolicyId,
      policyName: policy?.name ?? null,
      mandateId: matchingMandate?.id ?? null,
      score,
      capabilityMatch: capabilityLabel(parsed),
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
  if (candidates.length === 1 && candidates[0].score >= 100) {
    return { agent: candidates[0], requiresSelection: false };
  }
  if (candidates.length >= 1) {
    return { agent: null, requiresSelection: true };
  }
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
