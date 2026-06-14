import type { AgentCapability, AgentTypeValue } from '@/lib/agent-types';
import type { AgentVisualPattern } from '@/lib/agent-visual-identity';

export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  tagline: string;
  agentType: AgentTypeValue;
  capabilities: AgentCapability[];
  supportedNetworks: number[];
  supportedAssets: string[];
  policyTemplateId: string;
  visualPattern: AgentVisualPattern;
  setupSteps: string[];
  demoIntentTemplateId?: string;
  highlights: string[];
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'usdc-treasury',
    name: 'USDC Treasury Agent',
    description:
      'Governed USDC payments on Arbitrum Sepolia with budget checks, policy gates, and proof-ready settlement.',
    tagline: 'Treasury · USDC · Arbitrum',
    agentType: 'hosted',
    capabilities: ['token_transfer', 'x402_payment'],
    supportedNetworks: [421614],
    supportedAssets: ['USDC'],
    policyTemplateId: 'conservative-transfer',
    visualPattern: 'wave',
    setupSteps: [
      'Clone creates agent + conservative transfer policy if needed',
      'Verify owner wallet on Wallet & Authority',
      'Sign mandate binding chain, policy, and limits',
      'Run USDC demo from Execute or Command Center',
    ],
    demoIntentTemplateId: 'arbitrum-usdc',
    highlights: ['USDC budget', 'Fail-closed compliance', 'Proof receipts'],
  },
  {
    id: 'robinhood-demo',
    name: 'Robinhood Demo Trader',
    description:
      'Demo agent for Robinhood Testnet stock-token flows — allowed and refused paths with operator-relayed proofs.',
    tagline: 'Robinhood · TSLA demo · Proofs',
    agentType: 'hosted',
    capabilities: ['token_transfer', 'robinhood_trade'],
    supportedNetworks: [46630],
    supportedAssets: ['TSLA', 'USDG', 'AMZN', 'NFLX', 'PLTR', 'AMD'],
    policyTemplateId: 'robinhood-tsla-demo',
    visualPattern: 'orbit',
    setupSteps: [
      'Clone provisions Robinhood TSLA demo policy',
      'Verify wallet and sign mandate for chain 46630',
      'Run allowed TSLA template for settlement proof',
      'Run refused TSLA template to show policy block',
    ],
    demoIntentTemplateId: 'robinhood-tsla-allowed',
    highlights: ['Allow/refuse demos', 'Robinhood Testnet', 'Operator proofs'],
  },
  {
    id: 'x402-http-agent',
    name: 'x402 HTTP Agent',
    description:
      'External agent for HTTP-native x402 USDC payments — API keys after mandate, ideal for programmatic paywalls.',
    tagline: 'x402 · API · Headless pay',
    agentType: 'external',
    capabilities: ['x402_payment', 'token_transfer'],
    supportedNetworks: [421614],
    supportedAssets: ['USDC'],
    policyTemplateId: 'conservative-transfer',
    visualPattern: 'grid',
    setupSteps: [
      'Clone agent with transfer guard policy',
      'Verify wallet and sign mandate',
      'Create mandate-bound API key on agent page',
      'Trigger x402 flow from Payments or Command Center',
    ],
    demoIntentTemplateId: 'arbitrum-usdc',
    highlights: ['x402 settlement', 'API access', 'Mandate-bound keys'],
  },
  {
    id: 'settlement-api-bot',
    name: 'Settlement API Bot',
    description:
      'Headless service account for cron jobs and internal services submitting governed intents via the VALEN API.',
    tagline: 'Service · Cron · API intents',
    agentType: 'service',
    capabilities: ['token_transfer', 'x402_payment', 'robinhood_trade'],
    supportedNetworks: [421614, 46630],
    supportedAssets: ['USDC', 'USDG', 'TSLA', 'AMZN', 'NFLX', 'PLTR', 'AMD'],
    policyTemplateId: 'conservative-transfer',
    visualPattern: 'mesh',
    setupSteps: [
      'Clone service agent with default policy',
      'Sign mandate for allowed chains and actions',
      'Issue API key scoped to the mandate',
      'Submit intents from your worker or scheduler',
    ],
    highlights: ['Headless automation', 'Multi-capability', 'Audit trail'],
  },
  {
    id: 'qa-sandbox',
    name: 'QA Sandbox Agent',
    description:
      'Experimental sandbox agent for demos, QA, and policy testing without production traffic.',
    tagline: 'Sandbox · QA · Demos',
    agentType: 'experimental',
    capabilities: ['token_transfer'],
    supportedNetworks: [421614, 46630],
    supportedAssets: ['USDC', 'TSLA'],
    policyTemplateId: 'conservative-transfer',
    visualPattern: 'grid',
    setupSteps: [
      'Clone lightweight sandbox agent',
      'Assign or reuse conservative policy',
      'Complete wallet + mandate when testing real flows',
      'Use for hackathon and QA runs only',
    ],
    demoIntentTemplateId: 'arbitrum-legacy-eth',
    highlights: ['Non-production', 'Fast setup', 'Policy sandbox'],
  },
];

export function agentTemplateById(id: string): AgentTemplate {
  return AGENT_TEMPLATES.find((template) => template.id === id) ?? AGENT_TEMPLATES[0];
}

export function buildAgentTemplateClipboardPayload(template: AgentTemplate) {
  return JSON.stringify(
    {
      templateId: template.id,
      name: template.name,
      description: template.description,
      agentType: template.agentType,
      capabilities: template.capabilities,
      policyTemplateId: template.policyTemplateId,
      setupSteps: template.setupSteps,
      demoIntentTemplateId: template.demoIntentTemplateId,
    },
    null,
    2,
  );
}

export function cloneAgentName(template: AgentTemplate, existingNames: string[]): string {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  if (!taken.has(template.name.toLowerCase())) return template.name;

  let index = 2;
  while (taken.has(`${template.name} ${index}`.toLowerCase())) {
    index += 1;
  }
  return `${template.name} ${index}`;
}

export function agentMatchesTemplate(agentName: string, template: AgentTemplate): boolean {
  const normalized = agentName.toLowerCase();
  const base = template.name.toLowerCase();
  return normalized === base || normalized.startsWith(`${base} `);
}
