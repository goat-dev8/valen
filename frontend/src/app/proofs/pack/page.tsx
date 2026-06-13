'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { fetchProofPack } from '@/lib/public-proofs';

export default function ProofPackPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proof-pack'],
    queryFn: fetchProofPack,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Proof Pack"
        description="Latest public execution, refusal, and payment proofs — no auth required."
      />
      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <div className="grid gap-4 md:grid-cols-3">
            {(['executions', 'refusals', 'payments'] as const).map((kind) => {
              const item = data[kind][0];
              return (
                <div key={kind} className="rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{kind}</p>
                  {item ? (
                    <>
                      <p className="mt-2 font-mono text-xs break-all">{item.id}</p>
                      <p className="mt-2 text-sm">{item.status}</p>
                      <Link href={`/proofs/${kind}/${item.id}`} className="app-link mt-4 inline-block text-sm">
                        Open proof
                      </Link>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[#64748b]">No public {kind.slice(0, -1)} yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </QueryState>
    </div>
  );
}
