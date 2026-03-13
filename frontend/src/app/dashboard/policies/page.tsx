'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { PolicyCard, PolicyCardSkeleton } from '@/components/policies/policy-card';
import { PolicyExplainer } from '@/components/policies/policy-explainer';
import { PolicyStats, type PolicyFilter } from '@/components/policies/policy-stats';
import { useAgents, usePolicies } from '@/hooks/use-valen-api';

function matchesPolicySearch(
  policy: { id: string; name: string; description: string | null; status: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    policy.name.toLowerCase().includes(q) ||
    policy.id.toLowerCase().includes(q) ||
    policy.status.toLowerCase().includes(q) ||
    (policy.description?.toLowerCase().includes(q) ?? false)
  );
}

export default function PoliciesPage() {
  const [filter, setFilter] = useState<PolicyFilter>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = usePolicies();
  const { data: agentsData } = useAgents({ limit: 100 });

  const policies = data ?? [];
  const agents = agentsData?.items ?? [];

  const agentCountByPolicy = useMemo(() => {
    const map = new Map<string, number>();
    for (const agent of agents) {
      if (!agent.defaultPolicyId) continue;
      map.set(agent.defaultPolicyId, (map.get(agent.defaultPolicyId) ?? 0) + 1);
    }
    return map;
  }, [agents]);

  const counts = useMemo(() => {
    const active = policies.filter((p) => p.status === 'active').length;
    const draft = policies.filter((p) => p.status === 'draft').length;
    const assignedAgents = agents.filter((a) => a.defaultPolicyId).length;
    return { total: policies.length, active, draft, assignedAgents };
  }, [policies, agents]);

  const filtered = useMemo(() => {
    return policies.filter((policy) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && policy.status === 'active') ||
        (filter === 'draft' && policy.status === 'draft');
      if (!matchesFilter) return false;
      return matchesPolicySearch(policy, search);
    });
  }, [policies, filter, search]);

  return (
    <div className="policy-ledger-page space-y-6">
      <Link href="/dashboard" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Command Center
      </Link>

      <PageHeader
        title="Rules & Policies"
        description="Compliance and risk rules bound to agent intents at evaluation time."
      >
        <Link href="/dashboard/policies/new" className="app-btn app-btn-primary">
          <Plus className="h-4 w-4" />
          Create Policy
        </Link>
      </PageHeader>

      <PolicyExplainer />

      {!isLoading && !error && policies.length > 0 && (
        <PolicyStats
          total={counts.total}
          active={counts.active}
          draft={counts.draft}
          assignedAgents={counts.assignedAgents}
          activeFilter={filter}
          onFilter={setFilter}
        />
      )}

      <section className="policy-ledger-list" aria-label="Policy list">
        <div className="policy-ledger-list__toolbar">
          <h2 className="policy-ledger-list__heading">Your policies</h2>
          <label className="policy-ledger-search">
            <Search className="h-4 w-4 text-[#8B98A5]" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, status, or ID…"
              className="policy-ledger-search__input"
              aria-label="Search policies"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="policy-ledger-list__items">
            {Array.from({ length: 3 }).map((_, i) => (
              <PolicyCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="app-card border-red-200 bg-red-50 py-8 text-center">
            <p className="text-sm font-medium text-red-700">{error.message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="policy-ledger-empty-state">
            <p className="policy-ledger-empty-state__text">
              {search
                ? 'No policies match your search. Try a different name or ID.'
                : policies.length
                  ? 'No policies in this filter. Try another status tab.'
                  : 'No policies created yet. Start from a template to define compliance and permission rules.'}
            </p>
            {!search && policies.length === 0 && (
              <Link href="/dashboard/policies/new" className="app-btn app-btn-primary">
                <Plus className="h-4 w-4" />
                Create your first policy
              </Link>
            )}
          </div>
        ) : (
          <div className="policy-ledger-list__items">
            {filtered.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                agentCount={agentCountByPolicy.get(policy.id) ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
