import {
  POLICY_TEMPLATES,
  type PolicyRiskLevel,
  type PolicyTemplate,
} from '@/lib/policy-templates';
import type { PolicyDto } from '@/types/api';

export type PolicyMandateDefaults = {
  templateId: string;
  policyName: string;
  riskLevel: PolicyRiskLevel;
  approvalMode: string;
  allowedChains: number[];
  allowedAssets: string[];
  allowedActions: string[];
  allowedTargets: string[];
  maxPerTransaction: string;
  maxTotal: string;
  approvalThreshold: string;
  expiresInDays: number;
};

export const MANDATE_ACTION_OPTIONS = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'x402_payment', label: 'x402 payment' },
  { value: 'demo_trade', label: 'Trade' },
] as const;

function policyMatchesTemplate(policy: PolicyDto, templateName: string): boolean {
  if (policy.status !== 'active') return false;
  if (policy.name === templateName) return true;
  return policy.name.startsWith(`${templateName} ·`) || policy.name.startsWith(`${templateName} (`);
}

export function resolvePolicyTemplateForPolicy(policy: PolicyDto): PolicyTemplate | null {
  return POLICY_TEMPLATES.find((template) => policyMatchesTemplate(policy, template.name)) ?? null;
}

export function resolvePolicyTemplateByPolicyId(
  policies: PolicyDto[],
  policyId: string,
): PolicyTemplate | null {
  const policy = policies.find((item) => item.id === policyId);
  return policy ? resolvePolicyTemplateForPolicy(policy) : null;
}

export function normalizePolicyAssetSymbol(asset: string): string {
  const upper = asset.trim().toUpperCase();
  if (upper === 'NATIVE') return 'ETH';
  return upper;
}

export function normalizePolicyAssets(assets: unknown): string[] {
  if (!Array.isArray(assets)) return [];
  return [...new Set(assets.map((asset) => normalizePolicyAssetSymbol(String(asset))))];
}

function normalizeTargets(targets: unknown): string[] {
  if (!Array.isArray(targets) || !targets.length) return ['*'];
  return targets.map(String);
}

export function formatGovernedActionLabel(action: string): string {
  if (action === 'x402_payment') return 'x402 payment';
  if (action === 'demo_trade') return 'Trade';
  return action.replace(/_/g, ' ');
}

export function mandateDefaultsFromTemplate(template: PolicyTemplate): PolicyMandateDefaults {
  const permissions = (template.rules.permissions ?? {}) as Record<string, unknown>;
  const amountLimits = (permissions.amountLimits ?? {}) as Record<string, string>;
  const defaultAssets =
    template.defaultAssets ??
    normalizePolicyAssets(permissions.allowedAssets ?? template.supportedAssets);

  return {
    templateId: template.id,
    policyName: template.name,
    riskLevel: template.riskLevel,
    approvalMode: template.approvalMode,
    allowedChains: Array.isArray(permissions.allowedChains)
      ? (permissions.allowedChains as number[])
      : template.supportedChains,
    allowedAssets: defaultAssets,
    allowedActions: Array.isArray(permissions.allowedActions)
      ? (permissions.allowedActions as string[])
      : ['transfer'],
    allowedTargets: normalizeTargets(permissions.allowedTargets),
    maxPerTransaction: amountLimits.maxPerTransaction ?? '',
    maxTotal: amountLimits.maxTotal ?? '',
    approvalThreshold: String(permissions.approvalThreshold ?? template.approvalMode),
    expiresInDays: Number(permissions.expiresInDays ?? 30),
  };
}

export function mandateDefaultsFromPolicyId(
  policies: PolicyDto[],
  policyId: string,
): PolicyMandateDefaults | null {
  const template = resolvePolicyTemplateByPolicyId(policies, policyId);
  return template ? mandateDefaultsFromTemplate(template) : null;
}

export function policyRiskDisplay(level: PolicyRiskLevel): string {
  if (level === 'low') return 'Low';
  if (level === 'medium') return 'Medium';
  return 'High';
}
