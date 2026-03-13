'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FileCheck } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { ProofVerificationSteps } from '@/components/proof/proof-verification-steps';
import { fetchProofPack } from '@/lib/public-proofs';
import { AssetIcon } from '@/lib/asset-icons';

export default function ProofPackPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-proof-pack'],
    queryFn: fetchProofPack,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <section className="command-hero rounded-3xl border border-[#dbeafe] bg-gradient-to-br from-[#f8fbff] to-white p-8">
        <div className="flex items-center gap-3">
          <FileCheck className="h-8 w-8 text-[#007dfc]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#007dfc]">VALEN Proof Pack</p>
        </div>
        <h1 className="mt-4 font-serif text-3xl font-semibold text-[#012b54]">This is VALEN&apos;s proof</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
          Every governed agent action produces a public, schema-frozen proof URL with on-chain evidence — whether
          settled or refused. No login required.
        </p>
        <Link href="/login" className="app-btn app-btn-primary mt-6 inline-flex">
          Open Dashboard
        </Link>
      </section>

      <ProofVerificationSteps />

      <PageHeader
        title="Latest samples"
        description="Recent execution, refusal, and x402 payment proofs from production."
      />

      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <div className="grid gap-4 md:grid-cols-3">
            {(['executions', 'refusals', 'payments'] as const).map((kind) => {
              const item = data[kind][0];
              return (
                <div key={kind} className="card-outcome rounded-3xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{kind}</p>
                  {item ? (
                    <>
                      <div className="mt-3 flex items-center gap-2">
                        <AssetIcon symbol={item.asset ?? 'USDC'} size={28} />
                        <p className="text-sm font-semibold capitalize text-[#012b54]">{item.status.replace(/_/g, ' ')}</p>
                      </div>
                      <p className="mt-2 font-mono text-xs break-all text-[#64748b]">{item.id}</p>
                      <Link href={`/proofs/${kind}/${item.id}`} className="app-btn btn-proof mt-4 inline-flex text-sm">
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
