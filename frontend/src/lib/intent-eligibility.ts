import type { MandateDto, PolicyDto } from '@/types/api';
import { chainName } from '@/lib/constants';
import { knownAssetForMandateValue } from '@/lib/known-assets';
import type { IntentTemplate } from '@/lib/intent-templates';

export type MandateScopeSnapshot = {
  version: 1;
  mandateId: string;
  policyId: string | null;
  policyName: string | null;
  riskLevel: string | null;
  actions: string[];
  actionKeys: string[];
  assets: string[];
  networks: number[];
  networkLabels: string[];
  maxPerTransaction: string | null;
  maxTotal: string | null;
  approvalThreshold: string | null;
  validUntil: string;
  signedAt: string;
  agentScopeHash: string;
};

export type IntentRequirements = {
  assetSymbol: string;
  actionLabel: string;
  actionType: string;
  networkId: number;
  networkLabel: string;
  policyName: string | null;
  templateId?: string;
  targetAddress?: string;
  assetAddress?: string | null;
};

export type EligibilityCheck = {
  id: 'asset' | 'action' | 'network' | 'policy' | 'mandate';
  label: string;
  passed: boolean;
  detail: string;
};

export type IntentEligibilityResult = {
  eligible: boolean;
  checks: EligibilityCheck[];
  failureReason: string | null;
  mandateStatus: 'active' | 'stale' | 'revoked' | 'expired' | 'missing' | 'invalid';
};

export function actionDisplayLabel(action: string): string {
  switch (action) {
    case 'transfer':
      return 'Transfer';
    case 'x402_payment':
      return 'x402 Payment';
    case 'demo_trade':
    case 'robinhood_trade':
    case 'robinhood_token_transfer':
      return 'Robinhood Trading';
    case '*':
      return 'All actions';
    default:
      return action.replace(/_/g, ' ');
  }
}

export function normalizeActionKeys(actions: string[]): string[] {
  const keys = new Set<string>();
  for (const action of actions) {
    if (!action || action === '*') {
      keys.add('*');
      continue;
    }
    keys.add(action);
    if (action === 'demo_trade' || action === 'robinhood_trade') {
      keys.add('transfer');
      keys.add('demo_trade');
    }
  }
  return [...keys];
}

export function computeAgentScopeHash(metadata: Record<string, unknown> | null | undefined): string {
  const payload = JSON.stringify({
    supportedNetworks: Array.isArray(metadata?.supportedNetworks) ? metadata!.supportedNetworks : [],
    supportedAssets: Array.isArray(metadata?.supportedAssets) ? metadata!.supportedAssets : [],
    supportedActions: Array.isArray(metadata?.supportedActions) ? metadata!.supportedActions : [],
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `scope-${Math.abs(hash).toString(16)}`;
}

export function buildMandateScopeSnapshot(input: {
  mandateId: string;
  policyId: string | null;
  policyName: string | null;
  riskLevel: string | null;
  allowedChains: number[];
  allowedActions: string[];
  allowedAssets: string[];
  maxPerTransaction: string | null;
  maxTotal: string | null;
  approvalThreshold: string | null;
  validUntil: string;
  signedAt: string;
  agentScopeHash: string;
}): MandateScopeSnapshot {
  const actionKeys = normalizeActionKeys(input.allowedActions);
  return {
    version: 1,
    mandateId: input.mandateId,
    policyId: input.policyId,
    policyName: input.policyName,
    riskLevel: input.riskLevel,
    actions: actionKeys.includes('*')
      ? ['Transfer', 'x402 Payment', 'Robinhood Trading']
      : [...new Set(actionKeys.filter((k) => k !== '*').map(actionDisplayLabel))],
    actionKeys,
    assets: input.allowedAssets.includes('*') ? ['*'] : input.allowedAssets,
    networks: input.allowedChains,
    networkLabels: input.allowedChains.map((id) => chainName(id)),
    maxPerTransaction: input.maxPerTransaction,
    maxTotal: input.maxTotal,
    approvalThreshold: input.approvalThreshold,
    validUntil: input.validUntil,
    signedAt: input.signedAt,
    agentScopeHash: input.agentScopeHash,
  };
}

export function resolveMandateSnapshot(mandate: MandateDto): MandateScopeSnapshot {
  const raw = (mandate as MandateDto & { scopeSnapshot?: MandateScopeSnapshot }).scopeSnapshot;
  if (raw && raw.version === 1) return raw;
  return buildMandateScopeSnapshot({
    mandateId: mandate.id,
    policyId: mandate.policyId,
    policyName: null,
    riskLevel: null,
    allowedChains: mandate.allowedChains,
    allowedActions: mandate.allowedActions,
    allowedAssets: mandate.allowedAssets,
    maxPerTransaction: mandate.maxPerTransaction,
    maxTotal: mandate.maxTotal,
    approvalThreshold: mandate.approvalThreshold,
    validUntil: mandate.validUntil,
    signedAt: mandate.createdAt,
    agentScopeHash: '',
  });
}

function actionMatchesSnapshot(snapshot: MandateScopeSnapshot, actionType: string, templateId?: string): boolean {
  if (snapshot.actionKeys.includes('*')) return true;
  if (snapshot.actionKeys.includes(actionType)) return true;
  if (actionType === 'custom' || actionType === 'robinhood_token_transfer') {
    if (snapshot.actionKeys.includes('demo_trade') || snapshot.actionKeys.includes('transfer')) return true;
  }
  if (templateId?.startsWith('robinhood-') && snapshot.actionKeys.includes('demo_trade')) return true;
  return false;
}

function assetMatchesSnapshot(
  snapshot: MandateScopeSnapshot,
  assetAddress?: string | null,
  assetSymbol?: string,
  chainId?: number,
): boolean {
  if (!snapshot.assets.length || snapshot.assets.includes('*')) return true;
  const asset = assetAddress?.trim();
  if (!asset || asset.toLowerCase() === 'native') return snapshot.assets.includes('native');
  const normalized = asset.toLowerCase();
  if (snapshot.assets.some((entry) => entry.trim().toLowerCase() === normalized || entry === asset)) {
    return true;
  }
  if (assetSymbol && snapshot.assets.some((entry) => entry.toUpperCase() === assetSymbol.toUpperCase())) {
    return true;
  }
  if (chainId != null) {
    const known = knownAssetForMandateValue(chainId, asset);
    if (known) {
      return snapshot.assets.some(
        (entry) =>
          entry === known.symbol ||
          entry.toLowerCase() === known.mandateValue.toLowerCase() ||
          entry.toLowerCase() === known.address.toLowerCase(),
      );
    }
  }
  return false;
}

export function intentRequirementsFromTemplate(
  template: IntentTemplate,
  targetAddress: string,
  assetAddress: string,
): IntentRequirements {
  const known = knownAssetForMandateValue(template.targetChainId, assetAddress);
  return {
    assetSymbol: known?.symbol ?? template.assetAddress ?? 'Asset',
    actionLabel: actionDisplayLabel(template.actionType),
    actionType: template.actionType,
    networkId: template.targetChainId,
    networkLabel: chainName(template.targetChainId),
    policyName: 'Any',
    templateId: template.id,
    targetAddress,
    assetAddress,
  };
}

export function evaluateIntentEligibility(input: {
  mandate: MandateDto;
  requirements: IntentRequirements;
  policyName?: string | null;
}): IntentEligibilityResult {
  const snapshot = resolveMandateSnapshot(input.mandate);
  const { requirements } = input;
  const now = Date.now();
  const validUntil = new Date(input.mandate.validUntil).getTime();

  let mandateStatus: IntentEligibilityResult['mandateStatus'] = 'active';
  if (input.mandate.status === 'stale') mandateStatus = 'stale';
  else if (input.mandate.status === 'revoked') mandateStatus = 'revoked';
  else if (validUntil <= now) mandateStatus = 'expired';
  else if (input.mandate.status !== 'active') mandateStatus = 'invalid';

  const policyName = snapshot.policyName ?? input.policyName ?? null;
  const policyRequired = requirements.policyName;
  const policyPassed =
    !policyRequired || policyRequired === 'Any' || !policyName || policyName === policyRequired;

  const checks: EligibilityCheck[] = [
    {
      id: 'policy',
      label: 'Policy',
      passed: policyPassed,
      detail: policyName ?? '—',
    },
    {
      id: 'network',
      label: 'Network',
      passed: !snapshot.networks.length || snapshot.networks.includes(requirements.networkId),
      detail: requirements.networkLabel,
    },
    {
      id: 'asset',
      label: 'Asset',
      passed: assetMatchesSnapshot(
        snapshot,
        requirements.assetAddress,
        requirements.assetSymbol,
        requirements.networkId,
      ),
      detail: requirements.assetSymbol,
    },
    {
      id: 'action',
      label: 'Action',
      passed: actionMatchesSnapshot(snapshot, requirements.actionType, requirements.templateId),
      detail: requirements.actionLabel,
    },
    {
      id: 'mandate',
      label: 'Mandate',
      passed: mandateStatus === 'active',
      detail:
        mandateStatus === 'active'
          ? 'Active'
          : mandateStatus === 'stale'
            ? 'Stale — re-sign required'
            : mandateStatus === 'expired'
              ? 'Expired'
              : mandateStatus === 'revoked'
                ? 'Revoked'
                : 'Inactive',
    },
  ];

  const failed = checks.find((check) => !check.passed);
  return {
    eligible: !failed && mandateStatus === 'active',
    checks,
    failureReason: failed
      ? failed.id === 'action'
        ? `${failed.detail} missing from mandate scope`
        : `${failed.label} mismatch — ${failed.detail}`
      : null,
    mandateStatus,
  };
}

export function findEligibleMandate(
  mandates: MandateDto[],
  agentId: string,
  requirements: IntentRequirements,
  policyName?: string | null,
): { mandate: MandateDto; result: IntentEligibilityResult } | null {
  for (const mandate of mandates.filter((m) => m.agentId === agentId)) {
    const result = evaluateIntentEligibility({ mandate, requirements, policyName });
    if (result.eligible) return { mandate, result };
  }
  return null;
}

export function bestMandateEvaluation(
  mandates: MandateDto[],
  agentId: string,
  requirements: IntentRequirements,
  policyName?: string | null,
): IntentEligibilityResult | null {
  const agentMandates = mandates.filter((m) => m.agentId === agentId);
  if (!agentMandates.length) return null;
  const evaluations = agentMandates.map((mandate) =>
    evaluateIntentEligibility({ mandate, requirements, policyName }),
  );
  const eligible = evaluations.find((item) => item.eligible);
  if (eligible) return eligible;
  return evaluations[0] ?? null;
}

export function agentScopeFromSnapshot(snapshot: MandateScopeSnapshot) {
  return {
    actions: snapshot.actions,
    assets: snapshot.assets.includes('*') ? ['USDC', 'USDG', 'TSLA', 'AMZN', 'NFLX', 'PLTR', 'AMD'] : snapshot.assets,
    networks: snapshot.networkLabels,
    policyName: snapshot.policyName,
    riskLevel: snapshot.riskLevel,
    validUntil: snapshot.validUntil,
    signedAt: snapshot.signedAt,
  };
}
