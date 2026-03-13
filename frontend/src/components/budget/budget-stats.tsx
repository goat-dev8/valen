'use client';

type BudgetStatsProps = {
  capUsdc: string;
  spentUsdc: string;
  remainingUsdc: string;
  utilization: number;
  eventCount: number;
  status?: string;
};

export function BudgetStats({
  capUsdc,
  spentUsdc,
  remainingUsdc,
  utilization,
  eventCount,
  status = 'active',
}: BudgetStatsProps) {
  return (
    <section className="budget-stats" aria-label="Budget summary">
      <div className="budget-stats__kpis">
        <div className="budget-stats__kpi">
          <p className="budget-stats__kpi-label">Cap (24h)</p>
          <p className="budget-stats__kpi-value">{capUsdc} USDC</p>
        </div>
        <div className="budget-stats__kpi budget-stats__kpi--spent">
          <p className="budget-stats__kpi-label">Spent</p>
          <p className="budget-stats__kpi-value">{spentUsdc} USDC</p>
        </div>
        <div className="budget-stats__kpi budget-stats__kpi--remaining">
          <p className="budget-stats__kpi-label">Remaining</p>
          <p className="budget-stats__kpi-value">{remainingUsdc} USDC</p>
        </div>
        <div className="budget-stats__kpi">
          <p className="budget-stats__kpi-label">Utilization</p>
          <p className="budget-stats__kpi-value">{utilization}%</p>
        </div>
        <div className="budget-stats__kpi">
          <p className="budget-stats__kpi-label">Events</p>
          <p className="budget-stats__kpi-value">{eventCount}</p>
        </div>
        <div className="budget-stats__kpi">
          <p className="budget-stats__kpi-label">Status</p>
          <p className="budget-stats__kpi-value budget-stats__kpi-value--status">{status}</p>
        </div>
      </div>
      <div className="budget-stats__bar" aria-hidden>
        <div className="budget-stats__bar-fill" style={{ width: `${Math.min(100, utilization)}%` }} />
      </div>
    </section>
  );
}
