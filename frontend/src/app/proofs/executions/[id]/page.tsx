'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { PublicProofIdentityPanel } from '@/components/app/public-proof-identity-panel';
import { fetchPublicProof } from '@/lib/public-proofs';
import { explorerTxUrl } from '@/lib/explorer';
import { formatProofAmount } from '@/lib/token-amount';

export default function PublicExecutionProofPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proof-execution', id],
    queryFn: () => fetchPublicProof('executions', id),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Execution Proof"
        description="Public, schema-frozen proof of a governed VALEN execution."
      />
      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <div className="space-y-4 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              <ChainBadge chainId={data.chainId} />
              <span className="text-xs text-[#64748b]">proofVersion {data.proofVersion}</span>
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-[#64748b]">Execution</dt><dd className="font-mono text-xs break-all">{data.id}</dd></div>
              <div><dt className="text-[#64748b]">Action</dt><dd>{data.action}</dd></div>
              <div><dt className="text-[#64748b]">Asset</dt><dd className="font-mono text-xs break-all">{data.asset ?? 'native'}</dd></div>
              <div><dt className="text-[#64748b]">Amount</dt><dd>{formatProofAmount(data.amount, data.chainId, data.asset)}</dd></div>
              <div><dt className="text-[#64748b]">Mandate signer</dt><dd className="font-mono text-xs break-all">{data.mandateSigner ?? 'Unavailable'}</dd></div>
              <div><dt className="text-[#64748b]">Evidence hash</dt><dd className="font-mono text-xs break-all">{data.evidenceHash ?? 'Unavailable'}</dd></div>
            </dl>
            {data.settlementTx && (
              <a href={explorerTxUrl(data.chainId, data.settlementTx)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1 text-sm">
                Settlement tx
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <PublicProofIdentityPanel proof={data} />
            <p className="text-xs text-[#64748b]">Published {new Date(data.publishedAt).toLocaleString()}</p>
            <Link href="/proofs/pack" className="app-link text-sm">View proof pack</Link>
          </div>
        )}
      </QueryState>
    </div>
  );
}
