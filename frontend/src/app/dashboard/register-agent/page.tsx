'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { useCreateAgent } from '@/hooks/use-valen-api';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';

const AGENT_TYPES = [
  { value: 'hosted', label: 'Hosted' },
  { value: 'external', label: 'External' },
  { value: 'service', label: 'Service' },
  { value: 'experimental', label: 'Experimental' },
];

export default function RegisterAgentPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { orgId } = useOrganization();
  const createMutation = useCreateAgent();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !orgId) return;
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const agent = await createMutation.mutateAsync({
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        agentType: formData.get('agentType') as string,
      });

      // Activate draft agents created before auto-activate deploy
      if (agent.status === 'draft') {
        await api.agents.activate(token, orgId, agent.id);
      }

      router.push(`/dashboard/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register agent');
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/agents" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      <PageHeader title="Register Agent" description="Add an autonomous agent to your organization" />

      <div className="app-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="app-form-group">
            <label htmlFor="name">Agent Name</label>
            <input id="name" name="name" type="text" required minLength={2} className="app-input" placeholder="e.g. Treasury Bot Alpha" />
          </div>
          <div className="app-form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" className="app-input min-h-[80px]" placeholder="What this agent does..." />
          </div>
          <div className="app-form-group">
            <label htmlFor="agentType">Agent Type</label>
            <select id="agentType" name="agentType" className="app-input" required>
              {AGENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registering...' : 'Register Agent'}
          </button>
        </form>
      </div>
    </div>
  );
}
