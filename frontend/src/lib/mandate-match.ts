import { knownAssetForMandateValue } from './known-assets';

export function mandateActionAllowed(
  allowedActions: string[],
  actionType: string,
  templateId?: string,
): boolean {
  if (!allowedActions.length || allowedActions.includes('*')) return true;
  if (allowedActions.includes(actionType)) return true;
  if (actionType === 'custom' || actionType === 'robinhood_token_transfer') {
    if (allowedActions.includes('demo_trade')) return true;
    // Robinhood demo intents are transfer-compatible when scoped by asset/chain.
    if (allowedActions.includes('transfer')) return true;
  }
  if (templateId?.startsWith('robinhood-') && allowedActions.includes('demo_trade')) return true;
  return false;
}

export function mandateTargetAllowed(
  allowedTargets: string[],
  targetAddress?: string | null,
): boolean {
  if (!allowedTargets.length || allowedTargets.includes('*')) return true;
  const normalizedTarget = targetAddress?.toLowerCase() ?? '';
  const normalizedAllowed = allowedTargets.map((target) => target.toLowerCase());
  if (normalizedAllowed.includes(normalizedTarget)) return true;
  if (
    normalizedAllowed.includes('robinhood-demo') &&
    normalizedTarget === '0x0000000000000000000000000000000000000000'
  ) {
    return true;
  }
  return false;
}

export function mandateAssetAllowed(
  allowedAssets: string[],
  assetAddress?: string | null,
  chainId?: number,
): boolean {
  if (!allowedAssets.length || allowedAssets.includes('*')) return true;
  const asset = assetAddress?.trim();
  if (!asset || asset.toLowerCase() === 'native') {
    return allowedAssets.includes('native');
  }
  const normalized = asset.toLowerCase();
  if (allowedAssets.some((entry) => entry.trim().toLowerCase() === normalized || entry === asset)) {
    return true;
  }
  if (allowedAssets.includes('native')) return true;

  if (chainId != null) {
    const known = knownAssetForMandateValue(chainId, asset);
    if (known) {
      return allowedAssets.some(
        (entry) =>
          entry === known.symbol ||
          entry.toLowerCase() === known.mandateValue.toLowerCase() ||
          entry.toLowerCase() === known.address.toLowerCase(),
      );
    }
  }

  return false;
}

export function mandateMatchesIntent(input: {
  mandate: {
    status: string;
    agentId: string;
    allowedChains: number[];
    allowedActions: string[];
    allowedAssets: string[];
    allowedTargets: string[];
  };
  agentId?: string;
  chainId: number;
  actionType: string;
  templateId?: string;
  targetAddress?: string;
  assetAddress?: string | null;
}): boolean {
  const { mandate } = input;
  if (mandate.status !== 'active') return false;
  if (mandate.agentId !== input.agentId) return false;
  if (mandate.allowedChains.length && !mandate.allowedChains.includes(input.chainId)) {
    return false;
  }
  if (!mandateActionAllowed(mandate.allowedActions, input.actionType, input.templateId)) {
    return false;
  }
  if (!mandateTargetAllowed(mandate.allowedTargets, input.targetAddress)) {
    return false;
  }
  if (!mandateAssetAllowed(mandate.allowedAssets, input.assetAddress, input.chainId)) {
    return false;
  }
  return true;
}
