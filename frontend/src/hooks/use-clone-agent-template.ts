'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { api } from '@/lib/api';
import { agentTemplateById, cloneAgentName } from '@/lib/agent-templates';
import { ensurePolicyForAgentTemplate } from '@/lib/ensure-policy-for-template';
import type { CloneTemplateOptions } from '@/components/agents/clone-template-modal';
import { formatApiErrorMessage } from '@/lib/utils';

export function useCloneAgentTemplate() {
  const { token } = useAuth();
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ templateId, options }: { templateId: string; options: CloneTemplateOptions }) => {
      if (!token || !orgId) throw new Error('Sign in to clone an agent template');

      const template = agentTemplateById(templateId);
      const [policies, agentsResponse] = await Promise.all([
        api.policies.list(token, orgId),
        api.agents.list(token, orgId, { limit: 100 }),
      ]);

      let policyId: string | undefined;
      if (options.policy) {
        const ensured = await ensurePolicyForAgentTemplate(token, orgId, template, policies);
        policyId = ensured.policyId;
      }

      const name = cloneAgentName(template, agentsResponse.items.map((agent) => agent.name));

      const agent = await api.agents.create(token, orgId, {
        name,
        description: template.description,
        agentType: template.agentType,
        defaultPolicyId: policyId,
        capabilities: options.capabilities ? template.capabilities : ['token_transfer'],
        supportedNetworks: options.assets ? template.supportedNetworks : [421614],
        supportedAssets: options.assets ? template.supportedAssets : ['USDC'],
        supportedActions: ['transfer'],
      });

      if (agent.status !== 'active') {
        await api.agents.activate(token, orgId, agent.id);
      }

      return { agent, template, policyId, options };
    },
    onSuccess: ({ agent, options }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      const step = options.authority ? 3 : 2;
      router.push(`/dashboard/agents/studio?agentId=${agent.id}&step=${step}&cloned=1`);
    },
  });
}

export function formatCloneError(error: unknown): string {
  return formatApiErrorMessage(error, 'Failed to clone agent template');
}
