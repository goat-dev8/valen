import { agentTypeRequiresApiKey } from './agent-types';

export type AgentReadinessStep = {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
  href: string;
  optional: boolean;
};

type BuildAgentReadinessStepsInput = {
  agentId: string;
  agentStatus: string;
  agentType: string;
  defaultPolicyId: string | null;
  policyName?: string;
  hasVerifiedWallet: boolean;
  mandateCount: number;
  mandateBoundApiKeyCount: number;
};

export function buildAgentReadinessSteps({
  agentId,
  agentStatus,
  agentType,
  defaultPolicyId,
  policyName,
  hasVerifiedWallet,
  mandateCount,
  mandateBoundApiKeyCount,
}: BuildAgentReadinessStepsInput): AgentReadinessStep[] {
  const requiresApiKey = agentTypeRequiresApiKey(agentType);

  const steps: AgentReadinessStep[] = [
    {
      id: 'active',
      label: 'Active agent',
      complete: agentStatus === 'active',
      detail: agentStatus === 'active' ? 'Agent can receive intents.' : 'Activate the agent first.',
      href: `/dashboard/agents/${agentId}`,
      optional: false,
    },
    {
      id: 'policy',
      label: 'Assigned policy',
      complete: Boolean(defaultPolicyId),
      detail: defaultPolicyId ? policyName ?? defaultPolicyId : 'Assign a default policy.',
      href: '/dashboard/policies',
      optional: false,
    },
    {
      id: 'wallet',
      label: 'Verified owner wallet',
      complete: hasVerifiedWallet,
      detail: hasVerifiedWallet
        ? 'Owner wallet authority is verified.'
        : 'Verify wallet ownership from Wallet & Authority.',
      href: '/dashboard/wallets',
      optional: false,
    },
    {
      id: 'mandate',
      label: 'Signed mandate',
      complete: mandateCount > 0,
      detail: mandateCount ? `${mandateCount} active mandate(s).` : 'Sign a mandate for this agent.',
      href: '/dashboard/wallets',
      optional: false,
    },
  ];

  if (requiresApiKey) {
    steps.push({
      id: 'api-key',
      label: 'Mandate-bound API key',
      complete: mandateBoundApiKeyCount > 0,
      detail: mandateBoundApiKeyCount
        ? `${mandateBoundApiKeyCount} active key(s) for programmatic access.`
        : 'Required for external and service agents calling the Valen API.',
      href: '#api-keys',
      optional: false,
    });
  } else {
    steps.push({
      id: 'api-key',
      label: 'API key',
      complete: mandateBoundApiKeyCount > 0,
      detail: mandateBoundApiKeyCount
        ? `${mandateBoundApiKeyCount} active key(s) available.`
        : 'Optional — dashboard users submit intents through the UI.',
      href: '#api-keys',
      optional: true,
    });
  }

  return steps;
}

export function agentReadinessSummary(steps: AgentReadinessStep[]) {
  const requiredSteps = steps.filter((step) => !step.optional);
  const completeRequired = requiredSteps.filter((step) => step.complete).length;
  const readinessComplete = requiredSteps.every((step) => step.complete);
  const nextStep =
    steps.find((step) => !step.complete && !step.optional) ??
    steps.find((step) => !step.complete);

  return {
    requiredSteps,
    completeRequired,
    totalRequired: requiredSteps.length,
    readinessComplete,
    nextStep,
  };
}
