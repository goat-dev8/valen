'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { usePolicy } from '@/hooks/use-valen-api';
import { summarizePolicyRules } from '@/lib/policy-rules-summary';

export default function PolicyDetailPage() {
  const params = useParams();
  const policyId = params.policyId as string;
  const { data: policy, isLoading, error } = usePolicy(policyId);
  const activeVersion =
    policy?.versions.find((version) => version.id === policy.activeVersionId) ??
    policy?.versions.find((version) => version.status === 'active') ??
    policy?.versions[0];
  const permissions = (activeVersion?.rules?.permissions as Record<string, unknown> | undefined) ?? null;
  const ruleSentences = summarizePolicyRules(permissions);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/policies" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Policies
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!policy}>
        {policy && (
          <>
            <PageHeader title={policy.name} description={policy.description ?? 'Policy detail and version history'}>
              <span className={`app-badge capitalize ${policy.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
                {policy.status}
              </span>
            </PageHeader>

            <div className="app-card">
              <h3 className="app-card-title mb-3">Policy Info</h3>
              <dl className="app-detail-list">
                <div><dt>ID</dt><dd className="font-mono text-xs">{policy.id}</dd></div>
                <div><dt>Active Version</dt><dd className="font-mono text-xs">{policy.activeVersionId ?? '—'}</dd></div>
                <div><dt>Created</dt><dd>{new Date(policy.createdAt).toLocaleString()}</dd></div>
              </dl>
            </div>

            <div className="app-card">
              <h3 className="app-card-title">Rules in plain English</h3>
              <ul className="mt-4 space-y-2">
                {ruleSentences.map((sentence) => (
                  <li key={sentence} className="flex gap-2 text-sm leading-6 text-[#31485f]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007dfc]" />
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>

            <div className="app-card">
              <h3 className="app-card-title">Permission Rules (technical)</h3>
              {!permissions ? (
                <p className="mt-3 text-sm text-[#64748b]">No permission rules are available for this policy version yet.</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-[#eef0f3] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#64748b]">{key}</p>
                      <p className="mt-2 break-words text-sm font-medium text-[#012b54]">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="app-card">
              <h3 className="app-card-title mb-4">Versions</h3>
              {!policy.versions?.length ? (
                <p className="text-sm text-[#64748b]">No versions yet. Create a version via API to publish rules.</p>
              ) : (
                <div className="app-table-wrap">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Rules Hash</th>
                        <th>Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policy.versions.map((v) => (
                        <tr key={v.id}>
                          <td>v{v.versionNumber}</td>
                          <td className="capitalize">{v.status}</td>
                          <td className="font-mono text-xs">{v.rulesHash.slice(0, 16)}...</td>
                          <td className="text-[#64748b]">{v.publishedAt ? new Date(v.publishedAt).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
