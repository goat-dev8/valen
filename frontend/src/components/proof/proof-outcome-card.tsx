'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, ExternalLink, FileCheck } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { AssetIcon } from '@/lib/asset-icons';
import { STATUS_HUMAN_LABELS } from '@/lib/design-tokens';
import {
  assetSymbol,
  outcomeHeadline,
  outcomeKind,
  outcomeKindLabel,
  publicProofHref,
} from '@/lib/proof-outcomes';
import type { ExecutionDto } from '@/types/api';

const OUTCOME_BADGE = {
  executed: 'proof-outcome-card__badge proof-outcome-card__badge--settled',
  refused: 'proof-outcome-card__badge proof-outcome-card__badge--refused',
  pending: 'proof-outcome-card__badge proof-outcome-card__badge--pending',
};

const OUTCOME_CARD = {
  executed: 'proof-outcome-card proof-outcome-card--settled',
  refused: 'proof-outcome-card proof-outcome-card--refused',
  pending: 'proof-outcome-card proof-outcome-card--pending',
};

function CopyProofLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${href}` : href;

  return (
    <button
      type="button"
      className="app-btn app-btn-outline text-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

export function ProofOutcomeCard({ execution, agentName }: { execution: ExecutionDto; agentName?: string }) {
  const kind = outcomeKind(execution.status);
  const symbol = assetSymbol(execution);
  const proofHref = publicProofHref(execution);
  const humanStatus = STATUS_HUMAN_LABELS[execution.status] ?? execution.status.replace(/_/g, ' ');
  const hasPublicProof = kind !== 'pending';

  return (
    <article className={OUTCOME_CARD[kind]}>
      <div className="proof-outcome-card__main">
        <div className="proof-outcome-card__identity">
          <div className="proof-outcome-card__icon-wrap">
            <AssetIcon symbol={symbol} size={36} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={OUTCOME_BADGE[kind]}>{outcomeKindLabel(kind)}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8B98A5]">{humanStatus}</span>
            </div>
            <h3 className="proof-outcome-card__title">{outcomeHeadline(execution)}</h3>
            <div className="proof-outcome-card__meta">
              {agentName && <span>{agentName}</span>}
              <ChainBadge chainId={execution.targetChainId} />
              <time dateTime={execution.createdAt}>{new Date(execution.createdAt).toLocaleString()}</time>
            </div>
          </div>
        </div>

        <div className="proof-outcome-card__actions">
          {hasPublicProof ? (
            <>
              <Link href={proofHref} className="app-btn btn-proof text-sm">
                <FileCheck className="h-4 w-4" />
                Open proof
              </Link>
              <CopyProofLink href={proofHref} />
            </>
          ) : (
            <Link href={proofHref} className="app-btn app-btn-primary text-sm">
              View pipeline
            </Link>
          )}
          <Link href={`/dashboard/executions/${execution.id}`} className="app-btn app-btn-outline text-sm">
            Pipeline
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <button
        type="button"
        className="proof-outcome-card__id"
        title="Click to copy execution ID"
        onClick={() => navigator.clipboard.writeText(execution.id)}
      >
        {execution.id}
      </button>
    </article>
  );
}

export function ProofOutcomeCardSkeleton() {
  return <div className="proof-outcome-card proof-outcome-card--skeleton" aria-hidden />;
}
