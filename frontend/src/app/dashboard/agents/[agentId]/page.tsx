'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { AgentStatusBadge, StatusBadge } from '@/components/app/status-badge';
import { useAgent, useActivateAgent, useExecutions } from '@/hooks/use-valen-api';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const reserved = agentId === 'new' || agentId === 'register';
  const { data: agent, isLoading, error } = useAgent(reserved ? '' : agentId);
  const { data: executions } = useExecutions({ agentId: reserved ? undefined : agentId, limit: 10 });
  const activateMutation = useActivateAgent();

  useEffect(() => {
    if (reserved) {
      router.replace('/dashboard/register-agent');
    }
  }, [reserved, router]);

  if (reserved) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/agents" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!agent}>
        {agent && (
          <>
            <PageHeader title={agent.name} description={`${agent.agentType} agent`}>
              <AgentStatusBadge status={agent.status} />
              {agent.status === 'draft' && (
                <button
                  type="button"
                  className="app-btn app-btn-primary"
                  disabled={activateMutation.isPending}
                  onClick={() => activateMutation.mutate(agent.id)}
                >
                  {activateMutation.isPending ? 'Activating...' : 'Activate Agent'}
                </button>
              )}
            </PageHeader>

            <div className="app-card">
              <h3 className="app-card-title mb-3">Agent Profile</h3>
              <dl className="app-detail-list">
                <div><dt>ID</dt><dd className="font-mono text-xs">{agent.id}</dd></div>
                <div><dt>Type</dt><dd className="capitalize">{agent.agentType}</dd></div>
                <div><dt>Default Policy</dt><dd>{agent.defaultPolicyId ?? '—'}</dd></div>
                <div><dt>Description</dt><dd>{agent.description ?? '—'}</dd></div>
                <div><dt>Created</dt><dd>{new Date(agent.createdAt).toLocaleString()}</dd></div>
              </dl>
            </div>

            <div className="app-card">
              <h3 className="app-card-title mb-4">Recent Executions</h3>
              {!executions?.items.length ? (
                <p className="text-sm text-[#64748b]">No executions for this agent yet.</p>
              ) : (
                <div className="app-table-wrap">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Action</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.items.map((ex) => (
                        <tr key={ex.id}>
                          <td>
                            <Link href={`/dashboard/executions/${ex.id}`} className="app-link font-mono text-xs">
                              {ex.id.slice(0, 8)}...
                            </Link>
                          </td>
                          <td className="capitalize">{ex.actionType.replace(/_/g, ' ')}</td>
                          <td><StatusBadge status={ex.status} /></td>
                          <td className="text-[#64748b]">{new Date(ex.createdAt).toLocaleString()}</td>
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
