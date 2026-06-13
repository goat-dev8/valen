'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { fetchPublicProof } from '@/lib/public-proofs';
import { explorerTxUrl } from '@/lib/explorer';

export default function PublicPaymentProofPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proof-payment', id],
    queryFn: () => fetchPublicProof('payments', id),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Payment Proof"
        description="Public proof of a governed x402 USDC payment or refusal."
      />
      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <div className="space-y-4 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              <ChainBadge chainId={data.chainId} />
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-[#64748b]">Payment</dt><dd className="font-mono text-xs break-all">{data.id}</dd></div>
              <div><dt className="text-[#64748b]">Amount</dt><dd>{data.amount ?? 'Unavailable'} USDC</dd></div>
              <div><dt className="text-[#64748b]">Evidence hash</dt><dd className="font-mono text-xs break-all">{data.evidenceHash ?? 'Unavailable'}</dd></div>
            </dl>
            {data.settlementTx && (
              <a href={explorerTxUrl(data.chainId, data.settlementTx)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1 text-sm">
                Settlement tx
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Link href="/proofs/pack" className="app-link text-sm">View proof pack</Link>
          </div>
        )}
      </QueryState>
    </div>
  );
}
