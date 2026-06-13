'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { BUILDATHON_BASELINE_EXECUTIONS } from '@/lib/buildathon-baseline';
import type { ExecutionDto } from '@/types/api';

type BuildathonProofBaselineProps = {
  executions?: ExecutionDto[];
};

export function BuildathonProofBaseline({ executions = [] }: BuildathonProofBaselineProps) {
  const executedById = new Map(
    executions.filter((row) => row.status === 'executed').map((row) => [row.id, row]),
  );

  return (
    <section className="app-card">
      <div className="app-card-header">
        <div>
          <h3 className="app-card-title">Buildathon Proof Baseline</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Frozen dual-chain evidence for judges — Arbitrum Sepolia + Robinhood Testnet executions verified on Render.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {BUILDATHON_BASELINE_EXECUTIONS.map((baseline) => {
          const live = executedById.get(baseline.id);
          const statusLabel = live?.status === 'executed' ? 'Live match' : 'Reference proof';

          return (
            <div
              key={baseline.id}
              className="rounded-2xl border border-[#eef0f3] bg-[#f8fbff] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ChainBadge chainId={baseline.chainId} />
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#012b54]">{baseline.assetNarrative}</p>
              <p className="mt-1 font-mono text-xs text-[#64748b]">{baseline.id}</p>
              <p className="mt-2 text-xs leading-5 text-[#64748b]">{baseline.note}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={baseline.proofHref} className="app-btn app-btn-primary text-sm">
                  Open proof
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={baseline.detailHref} className="app-btn app-btn-outline text-sm">
                  Execution detail
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-[#64748b]">
        Primary flow routes: Mission Control → Fund & Authority → Rules → Intent Builder → Proof.
        Admin routes (Governance, Treasury, Contracts) are supporting evidence only.
      </p>
    </section>
  );
}
