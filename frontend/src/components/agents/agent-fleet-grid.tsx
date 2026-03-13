'use client';

import { useMemo, useState } from 'react';
import { Bot } from 'lucide-react';
import { AgentFleetCard, type AgentFleetCardModel } from '@/components/agents/agent-fleet-card';

type FleetFilter = 'all' | 'active' | 'setup';

const FILTERS: { id: FleetFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'setup', label: 'Setup needed' },
];

export function AgentFleetGrid({
  rows,
  emptyMessage = 'No agents match this filter.',
}: {
  rows: AgentFleetCardModel[];
  emptyMessage?: string;
}) {
  const [filter, setFilter] = useState<FleetFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'active') {
      return rows.filter((row) => row.agent.status === 'active');
    }
    if (filter === 'setup') {
      return rows.filter((row) => row.readinessCount < 4 || !row.hasMandate);
    }
    return rows;
  }, [filter, rows]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#0066FF]" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5E6C7B]">
            Your Agent Fleet ({rows.length})
          </p>
        </div>
        <div className="agent-fleet-filters" role="tablist" aria-label="Filter agents">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`agent-fleet-filter ${filter === item.id ? 'agent-fleet-filter--active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="agent-fleet-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="agent-fleet-grid">
          {filtered.map((row) => (
            <AgentFleetCard key={row.agent.id} model={row} />
          ))}
        </div>
      )}
    </section>
  );
}
