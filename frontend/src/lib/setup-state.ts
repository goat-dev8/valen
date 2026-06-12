import type { AgentDto, ExecutionDto, OrganizationDto, PolicyDto } from '@/types/api';

export type SetupStepId =
  | 'organization'
  | 'agent'
  | 'policy'
  | 'wallet'
  | 'mandate'
  | 'intent'
  | 'proof';

export type SetupStep = {
  id: SetupStepId;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  complete: boolean;
  blockedReason?: string;
};

type SetupStateInput = {
  organization?: OrganizationDto | null;
  agents?: AgentDto[];
  policies?: PolicyDto[];
  executions?: ExecutionDto[];
  ownerWalletVerified?: boolean;
  signedMandateCount?: number;
};

export function buildSetupSteps({
  organization,
  agents = [],
  policies = [],
  executions = [],
  ownerWalletVerified = false,
  signedMandateCount = 0,
}: SetupStateInput): SetupStep[] {
  const activeAgents = agents.filter((agent) => agent.status === 'active');
  const completedProofs = executions.filter((execution) => execution.status === 'executed');

  return [
    {
      id: 'organization',
      title: 'Organization selected',
      description: organization
        ? `${organization.name} is active on ${organization.defaultChainId ?? 'the default chain'}.`
        : 'Select or create the organization that owns this agent authority.',
      href: '/dashboard/settings',
      actionLabel: organization ? 'Review organization' : 'Set up organization',
      complete: Boolean(organization),
    },
    {
      id: 'agent',
      title: 'Register an active agent',
      description: activeAgents.length
        ? `${activeAgents.length} active agent${activeAgents.length === 1 ? '' : 's'} can submit governed intents.`
        : 'Create and activate an agent before submitting financial intents.',
      href: activeAgents.length ? '/dashboard/agents' : '/dashboard/register-agent',
      actionLabel: activeAgents.length ? 'View agents' : 'Register agent',
      complete: activeAgents.length > 0,
    },
    {
      id: 'policy',
      title: 'Create a policy',
      description: policies.length
        ? `${policies.length} polic${policies.length === 1 ? 'y is' : 'ies are'} available for agent permissions.`
        : 'Create the compliance and risk policy that will govern agent actions.',
      href: policies.length ? '/dashboard/policies' : '/dashboard/policies/new',
      actionLabel: policies.length ? 'View policies' : 'Create policy',
      complete: policies.length > 0,
    },
    {
      id: 'wallet',
      title: 'Verify owner wallet',
      description: ownerWalletVerified
        ? 'Owner wallet authority has been verified.'
        : 'Prove wallet ownership before signing agent authority.',
      href: '/dashboard/wallets',
      actionLabel: ownerWalletVerified ? 'View authority' : 'Verify wallet',
      complete: ownerWalletVerified,
      blockedReason: ownerWalletVerified ? undefined : 'Open Wallet & Authority and sign an ownership challenge.',
    },
    {
      id: 'mandate',
      title: 'Sign agent mandate',
      description: signedMandateCount
        ? `${signedMandateCount} signed mandate${signedMandateCount === 1 ? '' : 's'} authorize agent actions.`
        : 'Bind an agent to policy, chain, actions, targets, limits, and approval thresholds.',
      href: '/dashboard/wallets',
      actionLabel: signedMandateCount ? 'View mandates' : 'Sign mandate',
      complete: signedMandateCount > 0,
      blockedReason: signedMandateCount ? undefined : 'Sign a mandate on Wallet & Authority after verifying your wallet.',
    },
    {
      id: 'intent',
      title: 'Submit first intent',
      description: executions.length
        ? `${executions.length} intent${executions.length === 1 ? ' has' : 's have'} entered the pipeline.`
        : 'Submit a guided intent once the agent is ready.',
      href: '/dashboard/executions/new',
      actionLabel: executions.length ? 'View intents' : 'Build intent',
      complete: executions.length > 0,
      blockedReason:
        activeAgents.length > 0 && policies.length > 0
          ? undefined
          : 'Complete agent and policy setup first.',
    },
    {
      id: 'proof',
      title: 'View execution proof',
      description: completedProofs.length
        ? `${completedProofs.length} completed execution${completedProofs.length === 1 ? '' : 's'} can be reviewed.`
        : 'A final proof will show the mandate, verdicts, relayer txs, and audit trail.',
      href: completedProofs[0] ? `/dashboard/executions/${completedProofs[0].id}` : '/dashboard/executions',
      actionLabel: completedProofs.length ? 'Open proof source' : 'Open executions',
      complete: completedProofs.length > 0,
      blockedReason: completedProofs.length ? undefined : 'Complete an execution to review mandate, verdict, and relayer proof.',
    },
  ];
}

export function setupProgress(steps: SetupStep[]) {
  const complete = steps.filter((step) => step.complete).length;
  return {
    complete,
    total: steps.length,
    percent: steps.length ? Math.round((complete / steps.length) * 100) : 0,
  };
}
