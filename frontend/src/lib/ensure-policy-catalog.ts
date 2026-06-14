import { api } from '@/lib/api';
import { POLICY_TEMPLATES, policyTemplateById, type PolicyTemplate } from '@/lib/policy-templates';
import type { PolicyDto } from '@/types/api';

function policyMatchesTemplate(policy: PolicyDto, templateName: string): boolean {
  if (policy.status !== 'active') return false;
  if (policy.name === templateName) return true;
  return policy.name.startsWith(`${templateName} ·`) || policy.name.startsWith(`${templateName} (`);
}

export function resolvePolicyForTemplate(template: PolicyTemplate, policies: PolicyDto[]): PolicyDto | undefined {
  return policies.find((policy) => policyMatchesTemplate(policy, template.name));
}

export async function ensurePolicyFromTemplate(
  token: string,
  orgId: string,
  templateId: string,
  policies: PolicyDto[],
): Promise<{ policyId: string; created: boolean }> {
  const template = policyTemplateById(templateId);
  const existing = resolvePolicyForTemplate(template, policies);
  if (existing) {
    return { policyId: existing.id, created: false };
  }

  const policy = await api.policies.create(token, orgId, {
    name: template.name,
    description: template.description,
  });
  const version = await api.policies.createVersion(token, orgId, policy.id, {
    rules: template.rules,
  });

  try {
    await api.policies.submitVersion(token, orgId, policy.id, version.id, `Seed template ${template.id}`);
    await api.policies.publishVersion(token, orgId, policy.id, version.id, {
      approvalRef: `policy-template:${template.id}`,
      comment: 'Published from default governance catalog',
    });
    await api.policies.activateVersion(token, orgId, policy.id, version.id, {
      approvalRef: `policy-template:${template.id}`,
      comment: 'Activated for governed agent catalog',
    });
  } catch {
    return { policyId: policy.id, created: true };
  }

  return { policyId: policy.id, created: true };
}

export async function ensurePolicyCatalog(
  token: string,
  orgId: string,
  policies: PolicyDto[],
): Promise<{ ensured: number; created: number }> {
  let created = 0;
  let ensured = 0;
  let catalog = [...policies];

  for (const template of POLICY_TEMPLATES) {
    const existing = resolvePolicyForTemplate(template, catalog);
    if (existing) {
      ensured += 1;
      continue;
    }
    const result = await ensurePolicyFromTemplate(token, orgId, template.id, catalog);
    created += result.created ? 1 : 0;
    ensured += 1;
        catalog = [
      ...catalog,
      {
        id: result.policyId,
        organizationId: orgId,
        name: template.name,
        description: template.description,
        status: 'active',
        activeVersionId: null,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return { ensured, created };
}
