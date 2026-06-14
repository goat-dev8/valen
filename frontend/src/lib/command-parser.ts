export type ParsedCommandKind =
  | 'execution'
  | 'x402'
  | 'budget'
  | 'proof'
  | 'agent'
  | 'identity'
  | 'unknown';

export type ParsedCommand = {
  kind: ParsedCommandKind;
  label: string;
  templateId?: string;
  amount?: string;
  /** Agent catalog template when kind is `agent`. */
  agentTemplateId?: string;
  query?: Record<string, string>;
};

const ROBINHOOD_TICKERS = 'tsla|amzn|pltr|nflx|amd';

const RULES: Array<{ pattern: RegExp; resolve: (match: RegExpMatchArray, raw: string) => ParsedCommand }> = [
  {
    pattern: /^(?:show|open|view)\s+(?:my\s+)?budgets?/i,
    resolve: () => ({
      kind: 'budget',
      label: 'Review USDC budgets',
    }),
  },
  {
    pattern: /^(?:why|explain).*(?:refus|denied|blocked)/i,
    resolve: () => ({
      kind: 'proof',
      label: 'Review refusal proofs',
    }),
  },
  {
    pattern: /^(?:create|start|run)\s+(?:an?\s+)?x402\s+payment/i,
    resolve: () => ({
      kind: 'x402',
      label: 'x402 USDC payment',
      amount: '1',
    }),
  },
  {
    pattern: /^(?:transfer|send)\s+([\d.]+)?\s*(tsla|amzn|pltr|nflx|amd)\s+(?:to\s+)?(?:wallet|address)?/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `Transfer ${(m[2] ?? 'TSLA').toUpperCase()} on Robinhood Testnet`,
      templateId: `robinhood-${(m[2] ?? 'tsla').toLowerCase()}-allowed`,
      amount: m[1] ?? '1',
    }),
  },
  {
    pattern: /^(?:create|launch)\s+(?:a\s+)?treasury\s+agent/i,
    resolve: () => ({
      kind: 'agent',
      label: 'Create treasury agent',
      agentTemplateId: 'usdc-treasury',
    }),
  },
  {
    pattern: /^(?:show|open|view)\s+(?:proof|latest\s+proof)/i,
    resolve: () => ({
      kind: 'proof',
      label: 'Latest outcome proof',
    }),
  },
  {
    pattern: /^(?:pay|send)\s+([\d.]+)\s*usdc\s+(?:through\s+)?x402/i,
    resolve: (m) => ({
      kind: 'x402',
      label: `Pay ${m[1]} USDC via x402`,
      amount: m[1],
    }),
  },
  {
    pattern: /^x402/i,
    resolve: () => ({
      kind: 'x402',
      label: 'x402 USDC payment',
      amount: '1',
    }),
  },
  {
    pattern: new RegExp(`^(?:pay|send)\\s+([\\d.]+)\\s*(${ROBINHOOD_TICKERS})\\b`, 'i'),
    resolve: (m) => ({
      kind: 'execution',
      label: `Pay ${m[1]} ${m[2].toUpperCase()} on Robinhood Testnet`,
      templateId: `robinhood-${m[2].toLowerCase()}-allowed`,
      amount: m[1],
    }),
  },
  {
    pattern: /^(?:buy|transfer)\s+([\d.]+)\s*(tsla|amzn|pltr|nflx|amd)/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `${m[2].toUpperCase()} transfer`,
      templateId: `robinhood-${m[2].toLowerCase()}-allowed`,
      amount: m[1],
    }),
  },
  {
    pattern: /^(?:refused|refuse)\s*(tsla|amzn|pltr|nflx|amd)?/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `Refused ${(m[1] ?? 'TSLA').toUpperCase()} demo`,
      templateId: `robinhood-${(m[1] ?? 'tsla').toLowerCase()}-refused`,
    }),
  },
  {
    pattern: /^(?:transfer|send)\s+(?:usdg|usd\s*g)/i,
    resolve: () => ({
      kind: 'execution',
      label: 'USDG transfer on Robinhood Testnet',
      templateId: 'robinhood-usdg-allowed',
    }),
  },
  {
    pattern: /^(?:pay|send|transfer)\s+([\d.]+)\s*usdc/i,
    resolve: (m) => ({
      kind: 'x402',
      label: `Pay ${m[1]} USDC`,
      amount: m[1],
      templateId: 'arbitrum-usdc',
    }),
  },
  {
    pattern: /^(?:run|demo)\s+usdc/i,
    resolve: () => ({
      kind: 'execution',
      label: 'Allowed USDC demo',
      templateId: 'arbitrum-usdc',
    }),
  },
  {
    pattern: /^increase\s+budget\s+to\s+([\d.]+)/i,
    resolve: (m) => ({
      kind: 'budget',
      label: `Budget target ${m[1]} USDC`,
      amount: m[1],
    }),
  },
  {
    pattern: /^(?:register|create)\s+(?:erc-?8004|identity)/i,
    resolve: () => ({
      kind: 'identity',
      label: 'Register ERC-8004 identity',
    }),
  },
  {
    pattern: /^(?:create|register)\s+(?:a\s+)?(?:new\s+)?(?:governed\s+)?agent/i,
    resolve: () => ({
      kind: 'agent',
      label: 'Create governed agent',
      agentTemplateId: 'usdc-treasury',
    }),
  },
];

export function parseCommand(input: string): ParsedCommand | null {
  const raw = input.trim();
  if (!raw) return null;

  for (const rule of RULES) {
    const match = raw.match(rule.pattern);
    if (match) return rule.resolve(match, raw);
  }

  return {
    kind: 'unknown',
    label: raw,
  };
}

/** Optional secondary navigation for palette / legacy surfaces only — not used by Command Agent execution. */
export function hrefForParsedCommand(parsed: ParsedCommand): string {
  const params = new URLSearchParams();
  if (parsed.templateId) params.set('template', parsed.templateId);
  if (parsed.amount) params.set('amount', parsed.amount);
  if (parsed.query) {
    Object.entries(parsed.query).forEach(([k, v]) => params.set(k, v));
  }
  if (parsed.templateId) {
    const qs = params.toString();
    return qs ? `/dashboard/executions/new?${qs}` : '/dashboard/executions/new';
  }
  switch (parsed.kind) {
    case 'budget':
      return '/dashboard/budgets';
    case 'proof':
      return '/dashboard/proofs';
    case 'agent':
      return `/dashboard/agents/studio?template=${parsed.agentTemplateId ?? 'usdc-treasury'}`;
    case 'x402':
      return '/dashboard/payments';
    default:
      return '/dashboard';
  }
}
