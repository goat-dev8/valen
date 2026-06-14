'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { formatUnits } from 'viem';
import { ChainBadge } from '@/components/app/chain-badge';
import { Erc8004Badge } from '@/components/app/erc8004-badge';
import { PageHeader } from '@/components/app/page-header';
import { PipelineTimeline } from '@/components/app/pipeline-timeline';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import {
  useExecution,
  useExecutionCompliance,
  useAgentIdentity,
  useExecutionRisk,
  useExecutionSettlement,
  useExecutionTimeline,
} from '@/hooks/use-valen-api';
import { explorerTxUrl } from '@/lib/explorer';

type ExecutionAssetMetadata = {
  symbol?: string;
  address?: string | null;
  decimals?: number;
  category?: string;
  supportLevel?: string;
};

function isValidTxHash(txHash?: string | null): txHash is string {
  if (!txHash) return false;
  return !/^0x0+$/i.test(txHash);
}

function TxLink({ chainId, txHash, label }: { chainId: number; txHash?: string | null; label: string }) {
  if (!isValidTxHash(txHash)) return <span className="text-[#64748b]">{label}: unavailable</span>;
  return (
    <a href={explorerTxUrl(chainId, txHash)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1">
      {label}: {txHash.slice(0, 14)}...
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function executionAsset(metadata: Record<string, unknown> | undefined): ExecutionAssetMetadata | null {
  const asset = metadata?.asset;
  if (!asset || typeof asset !== 'object' || Array.isArray(asset)) return null;
  return asset as ExecutionAssetMetadata;
}

function humanAmount(raw: string | null, decimals?: number): string {
  if (!raw) return 'Unavailable';
  try {
    return decimals == null ? raw : formatUnits(BigInt(raw), decimals);
  } catch {
    return raw;
  }
}

export default function ExecutionProofPage() {
  const params = useParams();
  const executionId = params.executionId as string;
  const { data: execution, isLoading, error } = useExecution(executionId);
  const { data: identity } = useAgentIdentity(execution?.agentId ?? '');
  const { data: compliance } = useExecutionCompliance(executionId);
  const { data: risk } = useExecutionRisk(executionId);
  const { data: settlement } = useExecutionSettlement(executionId);
  const { data: timeline } = useExecutionTimeline(executionId);
  const asset = executionAsset(execution?.metadata);

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/executions/${executionId}`} className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Execution
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!execution}>
        {execution && (
          <>
            <PageHeader
              title={`Proof ${execution.id.slice(0, 8)}...`}
              description="VALEN operator-relayed proof transaction and audit trail. User wallet signatures are shown only where the user actually signed."
            >
              <ChainBadge chainId={execution.targetChainId} />
              <StatusBadge status={execution.status} />
            </PageHeader>

            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <div className="app-card">
                <h3 className="app-card-title mb-4">Pipeline Proof</h3>
                <PipelineTimeline events={timeline} status={execution.status} />
              </div>

              <div className="space-y-5">
                <div className="app-card">
                  <h3 className="app-card-title mb-3">Chain Of Trust</h3>
                  <dl className="app-detail-list">
                    <div><dt>Agent</dt><dd className="font-mono text-xs break-all">{execution.agentId}</dd></div>
                    <div><dt>Mandate</dt><dd className="font-mono text-xs break-all">{execution.mandateId ?? 'Unavailable'}</dd></div>
                    <div><dt>Mandate Signer</dt><dd className="font-mono text-xs break-all">{identity?.mandates?.find((mandate) => mandate.id === execution.mandateId)?.signerAddress ?? 'Unavailable'}</dd></div>
                    <div><dt>Mandate Hash</dt><dd className="font-mono text-xs break-all">{identity?.mandates?.find((mandate) => mandate.id === execution.mandateId)?.typedDataHash ?? 'Unavailable'}</dd></div>
                    <div><dt>Policy</dt><dd className="font-mono text-xs break-all">{execution.policyId ?? 'Agent default'}</dd></div>
                    <div><dt>Asset</dt><dd>{asset?.symbol ?? execution.assetAddress ?? 'Native ETH'}</dd></div>
                    <div><dt>Asset Address</dt><dd className="font-mono text-xs break-all">{asset?.address ?? execution.assetAddress ?? 'native'}</dd></div>
                    <div><dt>Amount</dt><dd>{humanAmount(execution.valueAmount, asset?.decimals)} {asset?.symbol ?? ''}</dd></div>
                    <div><dt>Verified Wallets</dt><dd>{identity?.verifiedWallets?.length ?? 0}</dd></div>
                    <div><dt>Wallet Bindings</dt><dd>{identity?.walletBindings?.length ?? 0}</dd></div>
                    <div><dt>Payload Hash</dt><dd className="font-mono text-xs break-all">{execution.requestPayloadHash}</dd></div>
                  </dl>
                </div>

                <Erc8004Badge identity={identity?.erc8004} />

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Verdicts</h3>
                  <dl className="app-detail-list">
                    <div><dt>Compliance Checks</dt><dd>{compliance?.length ?? 0}</dd></div>
                    <div><dt>Risk Score</dt><dd>{risk ? `${risk.score} (${risk.tier})` : 'Unavailable'}</dd></div>
                    <div><dt>Approval Required</dt><dd>{risk?.requiresApproval ? 'Yes' : 'No or unavailable'}</dd></div>
                  </dl>
                </div>

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Settlement Proof</h3>
                  {!settlement ? (
                    <p className="text-sm text-[#64748b]">Settlement proof is not available yet.</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <p className="font-medium text-[#012b54]">VALEN operator-relayed proof transaction</p>
                      {asset?.symbol && (
                        <p className="rounded-2xl bg-[#f8fafc] p-3 text-xs leading-5 text-[#64748b]">
                          Settlement asset: <strong className="text-[#012b54]">{asset.symbol}</strong>
                          {asset.decimals != null ? ` · decimals ${asset.decimals}` : ''}
                          {settlement.status === 'erc20_settled' ? ' · ERC-20 adapter executed' : ''}
                        </p>
                      )}
                      <TxLink chainId={settlement.chainId} txHash={settlement.submitTxHash} label="Submit tx" />
                      <TxLink chainId={settlement.chainId} txHash={settlement.approveTxHash} label="Approve tx" />
                      <TxLink chainId={settlement.chainId} txHash={settlement.txHash} label="Execute tx" />
                      <dl className="app-detail-list pt-2">
                        <div><dt>Status</dt><dd>{settlement.status}</dd></div>
                        <div><dt>Block</dt><dd>{settlement.blockNumber ?? 'Unavailable'}</dd></div>
                        <div><dt>On-chain Settlement ID</dt><dd className="font-mono text-xs break-all">{settlement.onChainSettlementId ?? 'Unavailable'}</dd></div>
                        <div><dt>Failure Reason</dt><dd>{settlement.failureReason ?? 'None'}</dd></div>
                        <div><dt>Relayer</dt><dd>{settlement.relayerAddress ?? 'VALEN operator relayer'}</dd></div>
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
