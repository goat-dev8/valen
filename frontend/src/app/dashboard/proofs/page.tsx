'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { ProofLedgerExplainer } from '@/components/proof/proof-ledger-explainer';
import { ProofLedgerStats } from '@/components/proof/proof-ledger-stats';
import { ProofOutcomeCard } from '@/components/proof/proof-outcome-card';
import { useAgents, useDashboardSummary, useExecutions } from '@/hooks/use-valen-api';
import {
  matchesOutcomeSearch,
  OUTCOME_LEDGER_LABEL,
  PENDING_STATUSES,
  REFUSED_STATUSES,
} from '@/lib/proof-outcomes';

type FilterKind = 'all' | 'executed' | 'refused' | 'pending';

export default function OutcomeLedgerPage() {
  const [filter, setFilter] = useState<FilterKind>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useExecutions({ limit: 100 });
  const { data: agents } = useAgents({ limit: 100 });
  const { data: summary } = useDashboardSummary();
  const agentMap = new Map(agents?.items.map((a) => [a.id, a.name]) ?? []);

  const items = data?.items ?? [];

  const counts = useMemo(() => {
    const settled = items.filter((ex) => ex.status === 'executed').length;
    const refused = items.filter((ex) => REFUSED_STATUSES.includes(ex.status)).length;
    const inProgress = items.filter((ex) => PENDING_STATUSES.includes(ex.status)).length;
    const passRate = items.length > 0 ? Math.round((settled / items.length) * 1000) / 10 : 0;
    return { total: items.length, settled, refused, inProgress, passRate };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((ex) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'executed' && ex.status === 'executed') ||
        (filter === 'refused' && REFUSED_STATUSES.includes(ex.status)) ||
        (filter === 'pending' && PENDING_STATUSES.includes(ex.status));
      if (!matchesFilter) return false;
      return matchesOutcomeSearch(ex, search, agentMap.get(ex.agentId));
    });
  }, [items, filter, search, agentMap]);

  const featured = summary?.latest.proof;

  return (
    <div className="proof-ledger-page space-y-6">
      <PageHeader
        title={OUTCOME_LEDGER_LABEL}
        description="Auditable record of every governed outcome — settled, refused, or in progress — each with a public proof URL and on-chain evidence."
      />

      <ProofLedgerExplainer
        featured={
          featured?.href
            ? {
                href: featured.href,
                label: featured.asset
                  ? `${featured.asset} ${(featured.actionType ?? 'action').replace(/_/g, ' ')} proof`
                  : 'Latest governed outcome',
                executionId: featured.executionId,
              }
            : null
        }
      />

      <ProofLedgerStats
        total={counts.total}
        settled={counts.settled}
        refused={counts.refused}
        inProgress={counts.inProgress}
        passRate={counts.passRate}
        activeFilter={filter}
        onFilter={setFilter}
      />

      <section className="proof-ledger-list" aria-label="Outcome list">
        <div className="proof-ledger-list__toolbar">
          <h2 className="proof-ledger-list__heading">Recent outcomes</h2>
          <label className="proof-ledger-search">
            <Search className="h-4 w-4 text-[#8B98A5]" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agent, asset, or ID…"
              className="proof-ledger-search__input"
              aria-label="Search outcomes"
            />
          </label>
        </div>

        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!filtered.length}
          emptyMessage={
            search
              ? 'No outcomes match your search. Try a different agent name, asset, or execution ID.'
              : 'No outcomes yet. Run a governed action to create your first verifiable proof.'
          }
        >
          <div className="proof-ledger-list__items">
            {filtered.map((ex) => (
              <ProofOutcomeCard key={ex.id} execution={ex} agentName={agentMap.get(ex.agentId)} />
            ))}
          </div>
        </QueryState>
      </section>
    </div>
  );
}
