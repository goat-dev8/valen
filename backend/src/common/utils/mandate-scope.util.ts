import { createHash } from 'crypto';
import { networkLabel } from './network-label.util';

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

function actionDisplayLabel(action: string): string {
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
  return createHash('sha256').update(payload).digest('hex');
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
    networkLabels: input.allowedChains.map((id) => networkLabel(id)),
    maxPerTransaction: input.maxPerTransaction,
    maxTotal: input.maxTotal,
    approvalThreshold: input.approvalThreshold,
    validUntil: input.validUntil,
    signedAt: input.signedAt,
    agentScopeHash: input.agentScopeHash,
  };
}

export function snapshotFromMandateRow(row: {
  id: string;
  policy_id: string | null;
  status: string;
  allowed_chains: number[];
  allowed_actions: string[];
  allowed_assets: string[];
  max_per_transaction: string | null;
  max_total: string | null;
  approval_threshold: string | null;
  valid_until: Date;
  created_at: Date;
  scope_snapshot: Record<string, unknown> | null;
}): MandateScopeSnapshot {
  if (row.scope_snapshot && typeof row.scope_snapshot === 'object') {
    return row.scope_snapshot as unknown as MandateScopeSnapshot;
  }
  return buildMandateScopeSnapshot({
    mandateId: row.id,
    policyId: row.policy_id,
    policyName: null,
    riskLevel: null,
    allowedChains: row.allowed_chains ?? [],
    allowedActions: row.allowed_actions ?? [],
    allowedAssets: row.allowed_assets ?? [],
    maxPerTransaction: row.max_per_transaction,
    maxTotal: row.max_total,
    approvalThreshold: row.approval_threshold,
    validUntil: row.valid_until.toISOString(),
    signedAt: row.created_at.toISOString(),
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
): boolean {
  if (!snapshot.assets.length || snapshot.assets.includes('*')) return true;
  const asset = assetAddress?.trim();
  if (!asset) return snapshot.assets.includes('native');
  const normalized = asset.toLowerCase();
  if (snapshot.assets.some((entry) => entry.trim().toLowerCase() === normalized || entry === asset)) {
    return true;
  }
  if (assetSymbol && snapshot.assets.some((entry) => entry.toUpperCase() === assetSymbol.toUpperCase())) {
    return true;
  }
  return false;
}

export function evaluateIntentEligibility(input: {
  mandate: {
    id: string;
    status: string;
    agentId: string;
    policyId: string | null;
    validUntil: string;
    scopeSnapshot: MandateScopeSnapshot;
  };
  requirements: IntentRequirements;
  policyName?: string | null;
}): IntentEligibilityResult {
  const { mandate, requirements } = input;
  const snapshot = mandate.scopeSnapshot;
  const now = Date.now();
  const validUntil = new Date(mandate.validUntil).getTime();

  let mandateStatus: IntentEligibilityResult['mandateStatus'] = 'active';
  if (mandate.status === 'stale') mandateStatus = 'stale';
  else if (mandate.status === 'revoked') mandateStatus = 'revoked';
  else if (validUntil <= now) mandateStatus = 'expired';
  else if (mandate.status !== 'active') mandateStatus = 'invalid';

  const policyName = snapshot.policyName ?? input.policyName ?? null;
  const policyRequired = requirements.policyName;
  const policyPassed =
    !policyRequired || !policyName || policyName === policyRequired || policyRequired === 'Any';

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
      passed: assetMatchesSnapshot(snapshot, requirements.assetAddress, requirements.assetSymbol),
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
            ? 'Stale — agent scope changed, re-sign required'
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
    failureReason: failed ? `${failed.label}: ${failed.detail}` : null,
    mandateStatus,
  };
}
