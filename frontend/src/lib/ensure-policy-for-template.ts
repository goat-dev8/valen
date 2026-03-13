import { api } from '@/lib/api';
import type { AgentTemplate } from '@/lib/agent-templates';
import { policyTemplateById } from '@/lib/policy-templates';
import type { PolicyDto } from '@/types/api';

function policyMatchesTemplate(policy: PolicyDto, templateName: string): boolean {
  if (policy.status !== 'active') return false;
  if (policy.name === templateName) return true;
  return policy.name.startsWith(`${templateName} ·`) || policy.name.startsWith(`${templateName} (`);
}

export async function ensurePolicyForAgentTemplate(
  token: string,
  orgId: string,
  agentTemplate: AgentTemplate,
  policies: PolicyDto[],
): Promise<{ policyId: string; created: boolean }> {
  const policyTemplate = policyTemplateById(agentTemplate.policyTemplateId);
  const existing = policies.find((policy) => policyMatchesTemplate(policy, policyTemplate.name));
  if (existing) {
    return { policyId: existing.id, created: false };
  }

  const policy = await api.policies.create(token, orgId, {
    name: policyTemplate.name,
    description: policyTemplate.description,
  });
  const version = await api.policies.createVersion(token, orgId, policy.id, {
    rules: policyTemplate.rules,
  });

  try {
    await api.policies.submitVersion(
      token,
      orgId,
      policy.id,
      version.id,
      `Agent template "${agentTemplate.name}" provisioning`,
    );
    await api.policies.publishVersion(token, orgId, policy.id, version.id, {
      approvalRef: `agent-template:${agentTemplate.id}`,
      comment: 'Published from agent template gallery',
    });
    await api.policies.activateVersion(token, orgId, policy.id, version.id, {
      approvalRef: `agent-template:${agentTemplate.id}`,
      comment: 'Activated for agent template clone',
    });
  } catch {
    // Policy draft may still exist — agent clone can proceed and user can activate manually.
  }

  return { policyId: policy.id, created: true };
}
