'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { MandateScopeSummary } from '@/components/mandate/mandate-scope-summary';
import { shortAddress } from '@/lib/authority-wallet-signing';
import type { AgentDto, MandateDto } from '@/types/api';

type AuthorityMandateListProps = {
  mandates: MandateDto[];
  agents: AgentDto[];
  isRevoking: boolean;
  onRevoke: (mandateId: string) => void;
};

function MandateCard({
  mandate,
  agentName,
  isRevoking,
  onRevoke,
}: {
  mandate: MandateDto;
  agentName: string;
  isRevoking: boolean;
  onRevoke: (mandateId: string) => void;
}) {
  return (
    <article
      className={`authority-mandate-card ${mandate.status === 'active' ? 'authority-mandate-card--active' : ''}`}
    >
      <div className="authority-mandate-card__header">
        <div>
          <p className="authority-mandate-card__agent">{agentName}</p>
          <p className="authority-mandate-card__id">{mandate.id}</p>
        </div>
        <span
          className={`authority-status-pill ${
            mandate.status === 'active' ? 'authority-status-pill--ok' : 'authority-status-pill--warn'
          }`}
        >
          {mandate.status}
        </span>
      </div>

      <div className="authority-mandate-card__meta">
        <ChainBadge chainId={mandate.chainId} />
        <span>Signer {shortAddress(mandate.signerAddress)}</span>
        <span>Expires {new Date(mandate.validUntil).toLocaleDateString()}</span>
      </div>

      <MandateScopeSummary
        mandate={{
          chainId: mandate.chainId,
          allowedChains: mandate.allowedChains,
          allowedActions: mandate.allowedActions,
          allowedAssets: mandate.allowedAssets,
          allowedTargets: mandate.allowedTargets,
          approvalThreshold: mandate.approvalThreshold,
          expiresAt: mandate.validUntil,
        }}
      />

      <div className="authority-mandate-card__actions">
        <button
          type="button"
          className="app-btn app-btn-outline text-sm"
          onClick={() => navigator.clipboard.writeText(mandate.typedDataHash)}
        >
          <Copy className="h-4 w-4" />
          Copy hash
        </button>
        {mandate.status === 'active' && (
          <button
            type="button"
            className="app-btn app-btn-danger text-sm"
            disabled={isRevoking}
            onClick={() => onRevoke(mandate.id)}
          >
            Revoke
          </button>
        )}
      </div>
    </article>
  );
}

export function AuthorityMandateList({ mandates, agents, isRevoking, onRevoke }: AuthorityMandateListProps) {
  const [expanded, setExpanded] = useState(false);
  const agentMap = useMemo(() => new Map(agents.map((agent) => [agent.id, agent.name])), [agents]);

  const sortedMandates = useMemo(
    () =>
      [...mandates].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [mandates],
  );

  if (!sortedMandates.length) {
    return null;
  }

  const hiddenCount = sortedMandates.length - 1;
  const visibleMandates = expanded ? sortedMandates : sortedMandates.slice(0, 1);

  return (
    <section className="authority-mandate-history" aria-label="Signed mandates">
      <div className="authority-mandate-history__header">
        <h3 className="authority-mandate-history__title">Your mandates</h3>
        <span className="authority-mandate-history__count">{sortedMandates.length} total</span>
      </div>

      <div className="authority-mandate-list">
        {visibleMandates.map((mandate) => (
          <MandateCard
            key={mandate.id}
            mandate={mandate}
            agentName={agentMap.get(mandate.agentId) ?? 'Unknown agent'}
            isRevoking={isRevoking}
            onRevoke={onRevoke}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          className="authority-mandate-history__toggle"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden />
              Show latest only
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden />
              Show {hiddenCount} older mandate{hiddenCount === 1 ? '' : 's'}
            </>
          )}
        </button>
      )}
    </section>
  );
}
