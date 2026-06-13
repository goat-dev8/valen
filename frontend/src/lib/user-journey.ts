import type { AgentDto, ExecutionDto, PolicyDto } from '@/types/api';
import { ARBITRUM_SEPOLIA_USDC } from './known-assets';

export type UserJourneyStepId =
  | 'wallet'
  | 'agent'
  | 'rules'
  | 'funded'
  | 'execution'
  | 'proof';

export type UserJourneyStep = {
  id: UserJourneyStepId;
  title: string;
  description: string;
  href: string;
  complete: boolean;
};

type UserJourneyInput = {
  walletConnected: boolean;
  ownerWalletVerified: boolean;
  agents?: AgentDto[];
  policies?: PolicyDto[];
  executions?: ExecutionDto[];
  usdcBalanceFormatted?: string | null;
};

export function buildUserJourneySteps({
  walletConnected,
  ownerWalletVerified,
  agents = [],
  policies = [],
  executions = [],
  usdcBalanceFormatted,
}: UserJourneyInput): UserJourneyStep[] {
  const activeAgents = agents.filter((agent) => agent.status === 'active');
  const activePolicies = policies.filter((policy) => policy.status === 'active');
  const executedProofs = executions.filter((execution) => execution.status === 'executed');
  const usdcAmount = Number(usdcBalanceFormatted ?? '0');
  const funded =
    ownerWalletVerified &&
    walletConnected &&
    (usdcAmount > 0 || activeAgents.length > 0);

  return [
    {
      id: 'wallet',
      title: 'Wallet connected',
      description: walletConnected
        ? ownerWalletVerified
          ? 'Owner wallet verified on-chain.'
          : 'Wallet connected — verify ownership on Fund & Authority.'
        : 'Connect your Privy wallet to start.',
      href: '/dashboard/wallets',
      complete: walletConnected && ownerWalletVerified,
    },
    {
      id: 'agent',
      title: 'Agent created',
      description: activeAgents.length
        ? `${activeAgents.length} active agent${activeAgents.length === 1 ? '' : 's'} ready.`
        : 'Register an agent that will submit governed intents.',
      href: activeAgents.length ? '/dashboard/agents' : '/dashboard/register-agent',
      complete: activeAgents.length > 0,
    },
    {
      id: 'rules',
      title: 'Rules active',
      description: activePolicies.length
        ? `${activePolicies.length} active rule set${activePolicies.length === 1 ? '' : 's'}.`
        : 'Create compliance and risk rules for your agent.',
      href: activePolicies.length ? '/dashboard/policies' : '/dashboard/policies/new',
      complete: activePolicies.length > 0,
    },
    {
      id: 'funded',
      title: 'Funded with USDC',
      description: funded
        ? usdcAmount > 0
          ? `${usdcBalanceFormatted} USDC visible on Arbitrum Sepolia (${ARBITRUM_SEPOLIA_USDC.slice(0, 6)}…).`
          : 'Funding path ready — USDC balance is policy-scoped; relayer settles native ETH today.'
        : 'Verify wallet and review USDC balance before agent spending.',
      href: '/dashboard/wallets',
      complete: funded,
    },
    {
      id: 'execution',
      title: 'Execution run',
      description: executions.length
        ? `${executions.length} intent${executions.length === 1 ? '' : 's'} entered the pipeline.`
        : 'Submit a USDC or Robinhood asset intent.',
      href: '/dashboard/executions/new',
      complete: executions.length > 0,
    },
    {
      id: 'proof',
      title: 'Proof available',
      description: executedProofs.length
        ? `${executedProofs.length} execution proof${executedProofs.length === 1 ? '' : 's'} on-chain.`
        : 'Complete an execution to open mandate, verdict, and relayer proof.',
      href: executedProofs[0]
        ? `/dashboard/executions/${executedProofs[0].id}/proof`
        : '/dashboard/executions',
      complete: executedProofs.length > 0,
    },
  ];
}

export function userJourneyProgress(steps: UserJourneyStep[]) {
  const complete = steps.filter((step) => step.complete).length;
  return {
    complete,
    total: steps.length,
    percent: steps.length ? Math.round((complete / steps.length) * 100) : 0,
  };
}
