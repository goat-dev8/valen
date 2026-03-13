'use client';

import Link from 'next/link';
import { CheckCircle, Plus } from 'lucide-react';
import { AgentStatusBadge } from '@/components/app/status-badge';
import type { AgentDto } from '@/types/api';
import { agentTypeLabel } from '@/lib/agent-types';

export function AgentsListCompact({
  agents,
  mandateAgentIds,
  activeCount = 0,
  systemsHealthy = false,
}: {
  agents: AgentDto[];
  mandateAgentIds: Set<string>;
  activeCount?: number;
  systemsHealthy?: boolean;
}) {
  const total = agents.length;

  return (
    <section className="app-panel-floating p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="app-section-title">Your Agents</h3>
          <p className="mt-0.5 text-sm text-[#8B98A5]">
            {total === 0
              ? 'Create a governed agent to start running actions'
              : `${activeCount || total} agent${(activeCount || total) === 1 ? '' : 's'} under governed finance control`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {systemsHealthy && total > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              All systems healthy
            </span>
          )}
          <Link href="/dashboard/agents/studio" className="app-btn app-btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" />
            Studio
          </Link>
        </div>
      </div>

      {!agents.length ? (
        <div className="app-panel-premium mt-4 border-dashed p-6 text-center">
          <p className="text-sm text-[#5E6C7B]">No governed agents yet.</p>
          <Link href="/dashboard/agents/studio" className="app-btn app-btn-primary mt-4 text-sm">
            Create in Agent Studio
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {agents.slice(0, 8).map((agent) => (
            <li key={agent.id}>
              <Link
                href={`/dashboard/agents/${agent.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#E8ECF0]/80 bg-white px-4 py-3 shadow-[0_4px_16px_-4px_rgba(0,102,255,0.12)] transition hover:-translate-y-0.5 hover:border-[#0066FF]/20 hover:shadow-[0_8px_24px_-4px_rgba(0,102,255,0.18)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1A2332]">{agent.name}</p>
                  <p className="truncate text-xs text-[#8B98A5]">
                    {agentTypeLabel(agent.agentType)}
                    {mandateAgentIds.has(agent.id) ? ' · Mandate active' : ' · Setup pending'}
                  </p>
                </div>
                <AgentStatusBadge status={agent.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {agents.length > 8 && (
        <Link href="/dashboard/agents" className="mt-4 block text-center text-xs font-semibold text-[#0066FF] hover:underline">
          View all {agents.length} agents
        </Link>
      )}
    </section>
  );
}
