'use client';

import Link from 'next/link';
import { ExternalLink, FileCheck } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { AssetIcon } from '@/lib/asset-icons';
import { STATUS_HUMAN_LABELS } from '@/lib/design-tokens';
import {
  assetSymbol,
  outcomeHeadline,
  outcomeKind,
  publicProofHref,
} from '@/lib/proof-outcomes';
import type { ExecutionDto } from '@/types/api';

const OUTCOME_BORDER = {
  executed: 'border-l-emerald-500',
  refused: 'border-l-red-500',
  pending: 'border-l-amber-500',
};

export function ProofFeed({
  executions,
  limit = 5,
  hideHistoricalFailures = true,
}: {
  executions: ExecutionDto[];
  limit?: number;
  hideHistoricalFailures?: boolean;
}) {
  const filtered = hideHistoricalFailures
    ? executions.filter((ex) => ex.status !== 'failed')
    : executions;
  const items = filtered.slice(0, limit);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dbeafe] bg-[#f8fbff] p-8 text-center">
        <FileCheck className="mx-auto h-8 w-8 text-[#007dfc]" />
        <p className="mt-3 text-sm font-semibold text-[#012b54]">No outcomes yet</p>
        <p className="mt-1 text-sm text-[#64748b]">Run a governed action to create your first proof.</p>
        <Link href="/dashboard/executions/new" className="app-link mt-4 inline-block text-sm font-semibold">
          Governed Intent →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((ex) => {
        const kind = outcomeKind(ex.status);
        const symbol = assetSymbol(ex);
        return (
          <article
            key={ex.id}
            className={`card-outcome rounded-2xl border border-[#eef0f3] border-l-4 bg-white p-4 ${OUTCOME_BORDER[kind]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <AssetIcon symbol={symbol} size={32} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    {STATUS_HUMAN_LABELS[ex.status] ?? ex.status.replace(/_/g, ' ')}
                  </p>
                  <h4 className="mt-1 truncate text-sm font-semibold text-[#012b54]">{outcomeHeadline(ex)}</h4>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ChainBadge chainId={ex.targetChainId} />
                    <span className="text-xs text-[#64748b]">{new Date(ex.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={publicProofHref(ex)} className="app-btn btn-proof text-xs">
                  Open Proof
                </Link>
                <Link href={`/dashboard/executions/${ex.id}`} className="app-btn app-btn-outline text-xs">
                  Pipeline
                </Link>
              </div>
            </div>
          </article>
        );
      })}
      <Link href="/dashboard/proofs" className="app-link inline-block text-sm font-semibold">
        View outcome ledger →
      </Link>
    </div>
  );
}

export function ProofFeedCompact({
  href,
  title,
  subtitle,
  chainId,
}: {
  href: string;
  title: string;
  subtitle: string;
  chainId?: number;
}) {
  return (
    <Link href={href} className="card-outcome block rounded-2xl border border-[#eef0f3] bg-white p-4 transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#007dfc]">Proof</p>
      <h3 className="mt-2 text-lg font-semibold text-[#012b54]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{subtitle}</p>
      {chainId && (
        <div className="mt-3">
          <ChainBadge chainId={chainId} />
        </div>
      )}
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#007dfc]">
        Open <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
