'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useInviteTeamMember, useTeam } from '@/hooks/use-valen-api';

const ROLE_LABELS: Record<string, string> = {
  organization_owner: 'Owner',
  compliance_officer: 'Compliance',
  risk_officer: 'Risk Officer',
  policy_manager: 'Policy Manager',
  settlement_operator: 'Settlement',
  developer: 'Developer',
  auditor: 'Auditor',
};

const INVITE_ROLES = [
  'compliance_officer',
  'risk_officer',
  'policy_manager',
  'settlement_operator',
  'developer',
  'auditor',
];

export default function TeamPage() {
  const { data, isLoading, error } = useTeam({ limit: 50 });
  const inviteMutation = useInviteTeamMember();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const form = new FormData(e.currentTarget);
    try {
      await inviteMutation.mutateAsync({
        email: String(form.get('email')),
        role: String(form.get('role')),
      });
      setShowForm(false);
      e.currentTarget.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invite failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Organization members, roles, and invitations">
        <button type="button" className="app-btn app-btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </PageHeader>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {showForm && (
        <div className="app-card max-w-lg">
          <h3 className="app-card-title mb-4">Invite Team Member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="app-form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="app-input" required />
            </div>
            <div className="app-form-group">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" className="app-input" required>
                {INVITE_ROLES.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role] ?? role}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="app-btn app-btn-primary" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
              </button>
              <button type="button" className="app-btn app-btn-outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
