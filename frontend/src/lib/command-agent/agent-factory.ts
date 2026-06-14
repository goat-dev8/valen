import { agentTemplateById, cloneAgentName, type AgentTemplate } from '@/lib/agent-templates';
import { ensurePolicyFromTemplate } from '@/lib/ensure-policy-catalog';
import { policyTemplateById } from '@/lib/policy-templates';
import type { ParsedCommand } from '@/lib/command-parser';
import type { AgentDto, PolicyDto } from '@/types/api';

export type AgentDraftResult = {
  agentId: string;
  name: string;
  policyName: string;
  budgetLabel: string;
  status: string;
};

function resolveAgentTemplate(parsed: ParsedCommand): AgentTemplate {
  return agentTemplateById(parsed.agentTemplateId ?? 'usdc-treasury');
}

export async function createAgentDraftFromCommand(input: {
  parsed: ParsedCommand;
  agents: AgentDto[];
  policies: PolicyDto[];
  token: string;
  orgId: string;
  createAgent: (body: {
    name: string;
    description?: string;
    agentType: string;
    defaultPolicyId?: string;
    capabilities?: string[];
    supportedNetworks?: number[];
    supportedAssets?: string[];
    supportedActions?: string[];
  }) => Promise<AgentDto>;
}): Promise<AgentDraftResult> {
  const template = resolveAgentTemplate(input.parsed);
  const policyTemplate = policyTemplateById(template.policyTemplateId);
  const { policyId } = await ensurePolicyFromTemplate(
    input.token,
    input.orgId,
    template.policyTemplateId,
    input.policies,
  );
  const name = cloneAgentName(
    template,
    input.agents.map((agent) => agent.name),
  );

  const created = await input.createAgent({
    name,
    description: template.description,
    agentType: template.agentType,
    defaultPolicyId: policyId,
    capabilities: template.capabilities,
    supportedNetworks: template.supportedNetworks,
    supportedAssets: template.supportedAssets,
    supportedActions: ['transfer', ...(template.capabilities.includes('x402_payment') ? ['x402_payment'] : [])],
  });

  const budgetLabel =
    (policyTemplate.rules as { permissions?: { amountLimits?: { maxTotal?: string } } })?.permissions?.amountLimits
      ?.maxTotal ?? '1000 USDC';

  return {
    agentId: created.id,
    name: created.name,
    policyName: policyTemplate.name,
    budgetLabel,
    status: created.status,
  };
}
