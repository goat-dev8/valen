'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { PublicProofIdentityPanel } from '@/components/app/public-proof-identity-panel';
import { ProofShareBar } from '@/components/proof/proof-share-bar';
import { ProofVerificationSteps } from '@/components/proof/proof-verification-steps';
import { fetchPublicProof } from '@/lib/public-proofs';

export default function PublicRefusalProofPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proof-refusal', id],
    queryFn: () => fetchPublicProof('refusals', id),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Refusal Receipt"
        description="Public proof that VALEN refused a governed action before settlement."
      />
      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              <ChainBadge chainId={data.chainId} />
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-[#64748b]">Execution</dt><dd className="font-mono text-xs break-all">{data.id}</dd></div>
              <div><dt className="text-[#64748b]">Action</dt><dd>{data.action}</dd></div>
              <div><dt className="text-[#64748b]">Asset</dt><dd>{data.asset ?? 'native'}</dd></div>
              <div><dt className="text-[#64748b]">Amount</dt><dd>{data.amount ?? 'Unavailable'}</dd></div>
              <div><dt className="text-[#64748b]">Evidence hash</dt><dd className="font-mono text-xs break-all">{data.evidenceHash ?? 'Unavailable'}</dd></div>
            </dl>
            {data.refusalFactors && (
              <pre className="overflow-x-auto rounded-2xl bg-white p-3 text-xs text-[#334155]">
                {JSON.stringify(data.refusalFactors, null, 2)}
              </pre>
            )}
            <ProofShareBar url={`/proofs/refusals/${data.id}`} label="Copy refusal proof URL" />
            <ProofVerificationSteps />
            <PublicProofIdentityPanel proof={data} />
            <Link href="/proofs/pack" className="app-link text-sm">View proof pack</Link>
          </div>
        )}
      </QueryState>
    </div>
  );
}
