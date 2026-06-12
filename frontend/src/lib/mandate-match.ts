export function mandateActionAllowed(
  allowedActions: string[],
  actionType: string,
  templateId?: string,
): boolean {
  if (!allowedActions.length || allowedActions.includes('*')) return true;
  if (allowedActions.includes(actionType)) return true;
  if (actionType === 'custom') {
    if (allowedActions.includes('demo_trade')) return true;
    // Robinhood demo intents use actionType custom; transfer mandates on chain 46630 are valid.
    if (allowedActions.includes('transfer')) return true;
  }
  if (templateId === 'robinhood-demo' && allowedActions.includes('demo_trade')) return true;
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
): boolean {
  if (!allowedAssets.length || allowedAssets.includes('*')) return true;
  const asset = assetAddress?.trim();
  if (!asset || asset.toLowerCase() === 'native') {
    return allowedAssets.includes('native');
  }
  return allowedAssets.includes(asset) || allowedAssets.includes('native');
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
  if (!mandateAssetAllowed(mandate.allowedAssets, input.assetAddress)) {
    return false;
  }
  return true;
}
