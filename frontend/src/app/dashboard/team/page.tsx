'use client';

import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useTeam } from '@/hooks/use-valen-api';

const ROLE_LABELS: Record<string, string> = {
  organization_owner: 'Owner',
  compliance_officer: 'Compliance',
  risk_officer: 'Risk Officer',
  policy_manager: 'Policy Manager',
  settlement_operator: 'Settlement',
  developer: 'Developer',
  auditor: 'Auditor',
};

export default function TeamPage() {
  const { data, isLoading, error } = useTeam({ limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Organization members, roles, and invitations">
        <button type="button" className="app-btn app-btn-primary">
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </PageHeader>

      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.items.length} emptyMessage="No team members found">
        <div className="app-card">
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007dfc] text-xs font-semibold text-white">
                          {(m.displayName ?? m.email ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#012b54]">{m.displayName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="text-[#64748b]">{m.email ?? '—'}</td>
                    <td>{ROLE_LABELS[m.role] ?? m.role}</td>
                    <td>
                      <span className={`app-badge capitalize ${m.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
