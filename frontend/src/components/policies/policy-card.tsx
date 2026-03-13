'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronRight, Copy, FileText } from 'lucide-react';
import type { PolicyDto } from '@/types/api';

type PolicyCardProps = {
  policy: PolicyDto;
  agentCount: number;
};

function policyStatusTone(status: string): 'active' | 'draft' | 'other' {
  if (status === 'active') return 'active';
  if (status === 'draft') return 'draft';
  return 'other';
}

export function PolicyCard({ policy, agentCount }: PolicyCardProps) {
  const [copied, setCopied] = useState(false);
  const tone = policyStatusTone(policy.status);

  const copyId = async () => {
    await navigator.clipboard.writeText(policy.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className={`policy-card policy-card--${tone}`}>
      <div className="policy-card__main">
        <div className="policy-card__identity">
          <div className="policy-card__icon-wrap">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="policy-card__badges">
              <span className={`policy-card__badge policy-card__badge--${tone}`}>{policy.status}</span>
              {agentCount > 0 && (
                <span className="policy-card__meta-tag">
                  {agentCount} agent{agentCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <h3 className="policy-card__title">{policy.name}</h3>
            {policy.description && <p className="policy-card__desc">{policy.description}</p>}
            <div className="policy-card__meta">
              <span>
                Version{' '}
                <code className="policy-card__code">
                  {policy.activeVersionId ? `${policy.activeVersionId.slice(0, 8)}…` : '—'}
                </code>
              </span>
              <span>Created {new Date(policy.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="policy-card__actions">
          <Link href={`/dashboard/policies/${policy.id}`} className="app-btn app-btn-primary text-sm">
            Open policy
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button type="button" className="app-btn app-btn-outline text-sm" onClick={copyId}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy ID'}
          </button>
        </div>
      </div>

      <button type="button" className="policy-card__id" title="Click to copy policy ID" onClick={copyId}>
        {policy.id}
      </button>
    </article>
  );
}

export function PolicyCardSkeleton() {
  return <div className="policy-card policy-card--skeleton" aria-hidden />;
}
