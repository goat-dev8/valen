type Permissions = Record<string, unknown>;

function formatList(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return 'none specified';
  return items.map(String).join(', ');
}

function formatLimits(limits: unknown): string[] {
  if (!limits || typeof limits !== 'object') return [];
  return Object.entries(limits as Record<string, unknown>).map(
    ([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${String(value)}`,
  );
}

/** Convert raw policy permission JSON into judge-friendly sentences. */
export function summarizePolicyRules(permissions: Permissions | null | undefined): string[] {
  if (!permissions) return ['No permission rules published for this policy version yet.'];

  const sentences: string[] = [];

  if (permissions.allowedChains) {
    sentences.push(`Agent may act on chains: ${formatList(permissions.allowedChains)}.`);
  }
  if (permissions.allowedActions) {
    sentences.push(`Permitted action types: ${formatList(permissions.allowedActions)}.`);
  }
  if (permissions.allowedAssets) {
    sentences.push(`Permitted assets: ${formatList(permissions.allowedAssets)}.`);
  }
  if (permissions.allowedTargets) {
    sentences.push(`Permitted targets: ${formatList(permissions.allowedTargets)}.`);
  }

  const limits = formatLimits(permissions.amountLimits);
  if (limits.length) {
    sentences.push(`Amount limits — ${limits.join('; ')}.`);
  }

  if (permissions.approvalThreshold) {
    sentences.push(`Human approval required when: ${String(permissions.approvalThreshold)}.`);
  }
  if (permissions.expiresInDays) {
    sentences.push(`Mandates expire after ${String(permissions.expiresInDays)} days unless renewed.`);
  }

  return sentences.length ? sentences : ['Rules are configured but use non-standard keys — see technical grid below.'];
}
