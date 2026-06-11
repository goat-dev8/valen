'use client';

import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useAgents } from '@/hooks/use-valen-api';
import { ComplianceSubjectRow } from '@/components/app/compliance-subject-row';

export default function CompliancePage() {
  const { data: agents, isLoading, error } = useAgents({ limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" description="Subject attestations, KYC/AML status, and eligibility summaries" />

      <QueryState isLoading={isLoading} error={error} isEmpty={!agents?.items.length} emptyMessage="No agents to show compliance for">
        <div className="app-card">
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Attestations</th>
                  <th>Recent Checks</th>
                </tr>
              </thead>
              <tbody>
                {agents?.items.map((agent) => (
                  <ComplianceSubjectRow key={agent.id} subjectRef={agent.id} name={agent.name} type="agent" />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
