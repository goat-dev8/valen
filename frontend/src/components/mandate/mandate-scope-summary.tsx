import { ChainBadge } from '@/components/app/chain-badge';
import { chainName } from '@/lib/constants';

type MandateScope = {
  chainId?: number;
  allowedChains?: number[];
  allowedActions?: string[];
  allowedAssets?: string[];
  allowedTargets?: string[];
  approvalThreshold?: string | null;
  expiresAt?: string | null;
};

function listOrDash(items?: string[]): string {
  if (!items?.length) return 'Any';
  return items.join(', ');
}

/** Human-readable mandate scope for authority and agent pages. */
export function MandateScopeSummary({ mandate }: { mandate: MandateScope }) {
  const chains = mandate.allowedChains?.length
    ? mandate.allowedChains.map((id) => chainName(id)).join(', ')
    : mandate.chainId
      ? chainName(mandate.chainId)
      : 'Not specified';

  return (
    <div className="rounded-2xl border border-[#eef0f3] bg-[#f8fbff] p-4 text-sm leading-6 text-[#31485f]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#007dfc]">Mandate scope</p>
      <ul className="mt-3 space-y-2">
        <li>
          <strong className="text-[#012b54]">Chains:</strong> {chains}
          {mandate.chainId && (
            <span className="ml-2 inline-flex align-middle">
              <ChainBadge chainId={mandate.chainId} />
            </span>
          )}
        </li>
        <li>
          <strong className="text-[#012b54]">Actions:</strong> {listOrDash(mandate.allowedActions)}
        </li>
        <li>
          <strong className="text-[#012b54]">Assets:</strong> {listOrDash(mandate.allowedAssets)}
        </li>
        <li>
          <strong className="text-[#012b54]">Targets:</strong> {listOrDash(mandate.allowedTargets)}
        </li>
        {mandate.approvalThreshold && (
          <li>
            <strong className="text-[#012b54]">Approval:</strong> Required when {mandate.approvalThreshold}
          </li>
        )}
        {mandate.expiresAt && (
          <li>
            <strong className="text-[#012b54]">Expires:</strong> {new Date(mandate.expiresAt).toLocaleString()}
          </li>
        )}
      </ul>
    </div>
  );
}
