'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { usePolicies } from '@/hooks/use-valen-api';

export default function PoliciesPage() {
  const { data, isLoading, error } = usePolicies();

  return (
    <div className="space-y-6">
      <PageHeader title="Policies" description="Compliance and risk rules bound to agent intents at evaluation time">
        <Link href="/dashboard/policies/new" className="app-btn app-btn-primary">
          <Plus className="h-4 w-4" />
          Create Policy
        </Link>
      </PageHeader>

      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.length} emptyMessage="No policies created yet">
        <div className="app-card">
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Active Version</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-[#012b54]">{p.name}</td>
                    <td>
                      <span className={`app-badge capitalize ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#64748b]">{p.activeVersionId?.slice(0, 8) ?? '—'}...</td>
                    <td className="text-[#64748b]">{new Date(p.createdAt).toLocaleDateString()}</td>
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
