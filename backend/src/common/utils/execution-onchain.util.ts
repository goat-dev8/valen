export function hasStoredOnChainAttestation(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  const onchain = metadata?.onchain;
  if (!onchain || typeof onchain !== 'object' || Array.isArray(onchain)) {
    return false;
  }
  const complianceHash = (onchain as Record<string, unknown>).complianceHash;
  return typeof complianceHash === 'string' && complianceHash.startsWith('0x');
}
