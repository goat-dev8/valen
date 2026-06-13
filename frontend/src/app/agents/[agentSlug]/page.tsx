'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Erc8004Badge } from '@/components/app/erc8004-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { fetchPublicAgent } from '@/lib/public-proofs';

export default function PublicAgentPage() {
  const params = useParams();
  const slug = params.agentSlug as string;
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-agent', slug],
    queryFn: () => fetchPublicAgent(slug),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title={data?.name ?? 'Agent Profile'}
        description="Public ERC-8004-ready agent identity — no login required."
      />
      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <div className="space-y-4 rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <Erc8004Badge identity={data.erc8004} />
            <p className="text-sm text-[#64748b]">{data.description ?? 'No description published.'}</p>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-[#64748b]">Slug</dt><dd>{data.slug}</dd></div>
              <div><dt className="text-[#64748b]">Type</dt><dd>{data.agentType}</dd></div>
              <div><dt className="text-[#64748b]">Status</dt><dd>{data.status}</dd></div>
              <div><dt className="text-[#64748b]">Primary wallet</dt><dd className="font-mono text-xs break-all">{data.walletBindings?.[0]?.walletAddress ?? 'Unavailable'}</dd></div>
            </dl>
            {data.latestProof && (
              <Link href={data.latestProof.href} className="app-link text-sm">
                Latest proof →
              </Link>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}
