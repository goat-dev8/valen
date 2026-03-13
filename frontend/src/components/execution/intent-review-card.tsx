import { ChainBadge } from '@/components/app/chain-badge';
import { AssetIcon } from '@/lib/asset-icons';
import { chainName } from '@/lib/constants';
import { executionAmountLabel } from '@/lib/amount';

type IntentReviewProps = {
  agentName: string;
  templateName: string;
  actionType: string;
  chainId: number;
  amount: string;
  amountDecimals: number;
  amountSymbol: string;
  targetAddress: string;
  assetSymbol: string;
  mandateId?: string;
  approvalExplanation: string;
};

/** Plain-English summary before submitting a governed action. */
export function IntentReviewCard({
  agentName,
  templateName,
  actionType,
  chainId,
  amount,
  amountDecimals,
  amountSymbol,
  targetAddress,
  assetSymbol,
  mandateId,
  approvalExplanation,
}: IntentReviewProps) {
  const amountLabel = amount
    ? executionAmountLabel(amount, amountDecimals, amountSymbol)
    : 'No amount specified';

  return (
    <div className="intent-review-card">
      <p className="intent-review-card__eyebrow">Governed intent summary</p>
      <p className="intent-review-card__sentence">
        Agent <strong>{agentName}</strong> will request a{' '}
        <strong className="capitalize">{actionType.replace(/_/g, ' ')}</strong> of{' '}
        <strong>{amountLabel}</strong> on <strong>{chainName(chainId)}</strong>, sending to{' '}
        <code className="intent-review-card__address">{targetAddress.slice(0, 10)}…{targetAddress.slice(-4)}</code>.
      </p>
      <div className="intent-review-card__chips">
        <AssetIcon symbol={assetSymbol} size={36} />
        <ChainBadge chainId={chainId} />
        <span className="intent-review-card__template">{templateName}</span>
      </div>
      <div className="intent-review-card__details">
        <p>
          <span className="font-semibold text-[#1A2332]">Governance path:</span> Compliance, risk, and policy gates run
          before on-chain settlement.
        </p>
        <p>
          <span className="font-semibold text-[#1A2332]">Outcome:</span> Public proof URL — settled or refused — with
          mandate hash and transaction evidence.
        </p>
        {mandateId && (
          <p>
            <span className="font-semibold text-[#1A2332]">Mandate:</span>{' '}
            <code className="text-xs">{mandateId.slice(0, 12)}…</code>
          </p>
        )}
        <p>{approvalExplanation}</p>
      </div>
    </div>
  );
}
