'use client';

type PolicyFilter = 'all' | 'active' | 'draft';

type PolicyStatsProps = {
  total: number;
  active: number;
  draft: number;
  assignedAgents: number;
  activeFilter: PolicyFilter;
  onFilter: (filter: PolicyFilter) => void;
};

const FILTERS: { key: PolicyFilter; label: string }[] = [
  { key: 'all', label: 'All policies' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
];

export function PolicyStats({
  total,
  active,
  draft,
  assignedAgents,
  activeFilter,
  onFilter,
}: PolicyStatsProps) {
  const counts: Record<PolicyFilter, number> = { all: total, active, draft };

  return (
    <section className="policy-stats" aria-label="Policy summary">
      <div className="policy-stats__kpis">
        <div className="policy-stats__kpi">
          <p className="policy-stats__kpi-label">Total policies</p>
          <p className="policy-stats__kpi-value">{total}</p>
        </div>
        <div className="policy-stats__kpi policy-stats__kpi--active">
          <p className="policy-stats__kpi-label">Active</p>
          <p className="policy-stats__kpi-value">{active}</p>
        </div>
        <div className="policy-stats__kpi policy-stats__kpi--draft">
          <p className="policy-stats__kpi-label">Draft</p>
          <p className="policy-stats__kpi-value">{draft}</p>
        </div>
        <div className="policy-stats__kpi">
          <p className="policy-stats__kpi-label">Agents assigned</p>
          <p className="policy-stats__kpi-value">{assignedAgents}</p>
        </div>
      </div>

      <div className="policy-stats__filters" role="tablist" aria-label="Filter policies">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeFilter === key}
            onClick={() => onFilter(key)}
            className={`policy-stats__filter ${activeFilter === key ? 'policy-stats__filter--active' : ''}`}
          >
            {label}
            <span className="policy-stats__filter-count">{counts[key]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export type { PolicyFilter };
