export type AgentTypeValue = 'hosted' | 'external' | 'service' | 'experimental';

export type AgentCapability = 'token_transfer' | 'robinhood_trade' | 'x402_payment';

export type AgentTypeOption = {
  value: AgentTypeValue;
  label: string;
  tagline: string;
  description: string;
  audience: string;
  requiresApiKey: boolean;
  recommended?: boolean;
};

export const AGENT_TYPE_OPTIONS: AgentTypeOption[] = [
  {
    value: 'hosted',
    label: 'Hosted',
    tagline: 'Dashboard & org-managed wallet',
    description:
      'Operate from the Valen dashboard. Link org wallets, sign mandates, and submit intents through the UI.',
    audience: 'Treasury bots, demo agents, and operators working inside Valen.',
    requiresApiKey: false,
    recommended: true,
  },
  {
    value: 'external',
    label: 'External',
    tagline: 'Programmatic AI or third-party agent',
    description:
      'Call the Valen API from your own infrastructure. Requires mandate-bound API keys after wallet and mandate setup.',
    audience: 'LLM agents, partner bots, and integrations outside the dashboard.',
    requiresApiKey: true,
  },
  {
    value: 'service',
    label: 'Service',
    tagline: 'Backend service account',
    description:
      'Headless automation for cron jobs, webhooks, or internal services that submit intents via API.',
    audience: 'Backend workers, schedulers, and internal microservices.',
    requiresApiKey: true,
  },
  {
    value: 'experimental',
    label: 'Experimental',
    tagline: 'Sandbox & testing',
    description:
      'Same dashboard flow as hosted, but clearly marked for demos, QA, and non-production experiments.',
    audience: 'Hackathon demos, QA runs, and policy sandboxing.',
    requiresApiKey: false,
  },
];

export const AGENT_CAPABILITY_OPTIONS: Array<{
  value: AgentCapability;
  label: string;
  description: string;
}> = [
  {
    value: 'token_transfer',
    label: 'Token transfers',
    description: 'USDC and governed token payments on Arbitrum Sepolia.',
  },
  {
    value: 'robinhood_trade',
    label: 'Robinhood assets',
    description: 'USDG and stock-token demo flows on Robinhood Testnet.',
  },
  {
    value: 'x402_payment',
    label: 'x402 payments',
    description: 'HTTP-native payment settlement with proof receipts.',
  },
];

export function agentTypeOption(value: string | undefined | null): AgentTypeOption {
  return AGENT_TYPE_OPTIONS.find((option) => option.value === value) ?? AGENT_TYPE_OPTIONS[0];
}

export function agentTypeRequiresApiKey(value: string | undefined | null): boolean {
  return agentTypeOption(value).requiresApiKey;
}

export function agentTypeLabel(value: string | undefined | null): string {
  return agentTypeOption(value).label;
}

export function defaultCapabilitiesForType(value: AgentTypeValue): AgentCapability[] {
  if (value === 'experimental') {
    return ['token_transfer'];
  }
  return ['token_transfer', 'robinhood_trade', 'x402_payment'];
}

export function setupStepsForType(value: AgentTypeValue): string[] {
  const base = [
    'Agent activates automatically on registration',
    'Assign a default policy (or pick one during registration)',
    'Verify owner wallet on Wallet & Authority',
    'Sign a mandate binding policy, chain, and limits',
  ];

  if (agentTypeRequiresApiKey(value)) {
    return [...base, 'Create a mandate-bound API key for programmatic access', 'Submit intents via API or dashboard'];
  }

  return [...base, 'Submit intents from the dashboard Execute page'];
}
