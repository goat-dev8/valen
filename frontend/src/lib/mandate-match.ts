import {
  evaluateIntentEligibility,
  findEligibleMandate,
  intentRequirementsFromTemplate,
  resolveMandateSnapshot,
  type IntentRequirements,
} from '@/lib/intent-eligibility';
import type { MandateDto } from '@/types/api';

export type { IntentRequirements };

export function mandateMatchesIntent(input: {
  mandate: MandateDto;
  agentId?: string;
  chainId: number;
  actionType: string;
  templateId?: string;
  targetAddress?: string;
  assetAddress?: string | null;
  policyName?: string | null;
}): boolean {
  if (input.agentId && input.mandate.agentId !== input.agentId) return false;
  const requirements: IntentRequirements = {
    assetSymbol: input.assetAddress ?? 'Asset',
    actionLabel: input.actionType,
    actionType: input.actionType,
    networkId: input.chainId,
    networkLabel: String(input.chainId),
    policyName: input.policyName ?? 'Any',
    templateId: input.templateId,
    targetAddress: input.targetAddress,
    assetAddress: input.assetAddress,
  };
  return evaluateIntentEligibility({
    mandate: input.mandate,
    requirements,
    policyName: input.policyName,
  }).eligible;
}

export { evaluateIntentEligibility, findEligibleMandate, intentRequirementsFromTemplate, resolveMandateSnapshot };
