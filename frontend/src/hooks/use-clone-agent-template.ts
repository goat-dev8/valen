'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { api } from '@/lib/api';
import { agentTemplateById, cloneAgentName } from '@/lib/agent-templates';
import { ensurePolicyForAgentTemplate } from '@/lib/ensure-policy-for-template';
import { formatApiErrorMessage } from '@/lib/utils';

export function useCloneAgentTemplate() {
  const { token } = useAuth();
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!token || !orgId) throw new Error('Sign in to clone an agent template');

      const template = agentTemplateById(templateId);
      const [policies, agentsResponse] = await Promise.all([
        api.policies.list(token, orgId),
        api.agents.list(token, orgId, { limit: 100 }),
      ]);

      const { policyId, created: policyCreated } = await ensurePolicyForAgentTemplate(
        token,
        orgId,
        template,
        policies,
      );

      const name = cloneAgentName(
        template,
        agentsResponse.items.map((agent) => agent.name),
      );

      const agent = await api.agents.create(token, orgId, {
        name,
        description: template.description,
        agentType: template.agentType,
        defaultPolicyId: policyId,
        capabilities: template.capabilities,
      });

      if (agent.status !== 'active') {
        await api.agents.activate(token, orgId, agent.id);
      }

      return { agent, template, policyId, policyCreated };
    },
    onSuccess: ({ agent }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      router.push(`/dashboard/agents/studio?agentId=${agent.id}&step=3&cloned=1`);
    },
  });
}

export function formatCloneError(error: unknown): string {
  return formatApiErrorMessage(error, 'Failed to clone agent template');
}
