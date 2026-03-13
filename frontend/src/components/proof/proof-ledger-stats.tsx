'use client';

import type { OutcomeKind } from '@/lib/proof-outcomes';

type ProofLedgerStatsProps = {
  total: number;
  settled: number;
  refused: number;
  inProgress: number;
  passRate: number;
  activeFilter: 'all' | OutcomeKind | 'pending';
  onFilter: (filter: 'all' | OutcomeKind | 'pending') => void;
};

const FILTERS = [
  { key: 'all' as const, label: 'All outcomes' },
  { key: 'executed' as const, label: 'Settled' },
  { key: 'refused' as const, label: 'Refused' },
  { key: 'pending' as const, label: 'In progress' },
];

export function ProofLedgerStats({
  total,
  settled,
  refused,
  inProgress,
  passRate,
  activeFilter,
  onFilter,
}: ProofLedgerStatsProps) {
  const counts: Record<string, number> = {
    all: total,
    executed: settled,
    refused,
    pending: inProgress,
  };

  return (
    <section className="proof-ledger-stats" aria-label="Outcome summary">
      <div className="proof-ledger-stats__kpis">
        <div className="proof-ledger-stats__kpi">
          <p className="proof-ledger-stats__kpi-label">Total outcomes</p>
          <p className="proof-ledger-stats__kpi-value">{total}</p>
        </div>
        <div className="proof-ledger-stats__kpi proof-ledger-stats__kpi--positive">
          <p className="proof-ledger-stats__kpi-label">Settled</p>
          <p className="proof-ledger-stats__kpi-value">{settled}</p>
        </div>
        <div className="proof-ledger-stats__kpi proof-ledger-stats__kpi--refused">
          <p className="proof-ledger-stats__kpi-label">Refused</p>
          <p className="proof-ledger-stats__kpi-value">{refused}</p>
        </div>
        <div className="proof-ledger-stats__kpi proof-ledger-stats__kpi--pending">
          <p className="proof-ledger-stats__kpi-label">In progress</p>
          <p className="proof-ledger-stats__kpi-value">{inProgress}</p>
        </div>
        <div className="proof-ledger-stats__kpi">
          <p className="proof-ledger-stats__kpi-label">Settlement rate</p>
          <p className="proof-ledger-stats__kpi-value">{passRate}%</p>
        </div>
      </div>

      <div className="proof-ledger-stats__filters" role="tablist" aria-label="Filter outcomes">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeFilter === key}
            onClick={() => onFilter(key)}
            className={`proof-ledger-stats__filter ${activeFilter === key ? 'proof-ledger-stats__filter--active' : ''}`}
          >
            {label}
            <span className="proof-ledger-stats__filter-count">{counts[key]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
