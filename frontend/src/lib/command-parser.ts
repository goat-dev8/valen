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
  href: string;
  templateId?: string;
  amount?: string;
  query?: Record<string, string>;
};

const RULES: Array<{ pattern: RegExp; resolve: (match: RegExpMatchArray, raw: string) => ParsedCommand }> = [
  {
    pattern: /^(?:show|open|view)\s+(?:my\s+)?budgets?/i,
    resolve: () => ({
      kind: 'budget',
      label: 'Review USDC budgets',
      href: '/dashboard/budgets',
    }),
  },
  {
    pattern: /^(?:why|explain).*(?:refus|denied|blocked)/i,
    resolve: () => ({
      kind: 'proof',
      label: 'Review refusal proofs',
      href: '/dashboard/proofs',
    }),
  },
  {
    pattern: /^(?:create|start|run)\s+(?:an?\s+)?x402\s+payment/i,
    resolve: () => ({
      kind: 'x402',
      label: 'Create x402 payment',
      href: '/dashboard/payments',
      amount: '1',
    }),
  },
  {
    pattern: /^(?:transfer|send)\s+([\d.]+)?\s*(tsla|amzn|pltr|nflx|amd)\s+(?:to\s+)?(?:wallet|address)?/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `Transfer ${(m[2] ?? 'TSLA').toUpperCase()} on Robinhood Testnet`,
      href: '/dashboard/executions/new',
      templateId: `robinhood-${(m[2] ?? 'tsla').toLowerCase()}-allowed`,
      amount: m[1] ?? '1',
    }),
  },
  {
    pattern: /^(?:create|launch)\s+(?:a\s+)?treasury\s+agent/i,
    resolve: () => ({
      kind: 'agent',
      label: 'Create treasury agent',
      href: '/dashboard/agents/studio',
    }),
  },
  {
    pattern: /^(?:show|open|view)\s+(?:proof|latest\s+proof)/i,
    resolve: () => ({
      kind: 'proof',
      label: 'Open latest proof',
      href: '/dashboard/proofs',
    }),
  },
  {
    pattern: /^(?:pay|send)\s+([\d.]+)\s*usdc\s+(?:through\s+)?x402/i,
    resolve: (m) => ({
      kind: 'x402',
      label: `Pay ${m[1]} USDC via x402`,
      href: '/dashboard/payments',
      amount: m[1],
    }),
  },
  {
    pattern: /^x402/i,
    resolve: () => ({
      kind: 'x402',
      label: 'x402 USDC payment',
      href: '/dashboard/payments',
    }),
  },
  {
    pattern: /^(?:buy|transfer)\s+([\d.]+)\s*(tsla|amzn|pltr|nflx|amd)/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `${m[2].toUpperCase()} transfer`,
      href: '/dashboard/executions/new',
      templateId: `robinhood-${m[2].toLowerCase()}-allowed`,
      amount: m[1],
    }),
  },
  {
    pattern: /^(?:refused|refuse)\s*(tsla|amzn|pltr|nflx|amd)?/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `Refused ${(m[1] ?? 'TSLA').toUpperCase()} demo`,
      href: '/dashboard/executions/new',
      templateId: `robinhood-${(m[1] ?? 'tsla').toLowerCase()}-refused`,
    }),
  },
  {
    pattern: /^(?:transfer|send)\s+(?:usdg|usd\s*g)/i,
    resolve: () => ({
      kind: 'execution',
      label: 'USDG transfer on Robinhood Testnet',
      href: '/dashboard/executions/new',
      templateId: 'robinhood-usdg-allowed',
    }),
  },
  {
    pattern: /^(?:pay|send|transfer)\s+([\d.]+)\s*usdc/i,
    resolve: (m) => ({
      kind: 'execution',
      label: `Pay ${m[1]} USDC`,
      href: '/dashboard/executions/new',
      templateId: 'arbitrum-usdc',
      amount: m[1],
    }),
  },
  {
    pattern: /^(?:run|demo)\s+usdc/i,
    resolve: () => ({
      kind: 'execution',
      label: 'Allowed USDC demo',
      href: '/dashboard/executions/new',
      templateId: 'arbitrum-usdc',
    }),
  },
  {
    pattern: /^increase\s+budget\s+to\s+([\d.]+)/i,
    resolve: (m) => ({
      kind: 'budget',
      label: `Budget target ${m[1]} USDC`,
      href: '/dashboard/budgets',
      amount: m[1],
    }),
  },
  {
    pattern: /^(?:register|create)\s+(?:erc-?8004|identity)/i,
    resolve: () => ({
      kind: 'identity',
      label: 'Register ERC-8004 identity',
      href: '/dashboard/agents',
    }),
  },
  {
    pattern: /^(?:create|register)\s+(?:a\s+)?(?:new\s+)?(?:governed\s+)?agent/i,
    resolve: () => ({
      kind: 'agent',
      label: 'Create governed agent',
      href: '/dashboard/agents/studio',
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
    href: '/dashboard/executions/new',
  };
}

export function hrefForParsedCommand(parsed: ParsedCommand): string {
  const params = new URLSearchParams();
  if (parsed.templateId) params.set('template', parsed.templateId);
  if (parsed.amount) params.set('amount', parsed.amount);
  if (parsed.query) {
    Object.entries(parsed.query).forEach(([k, v]) => params.set(k, v));
  }
  const qs = params.toString();
  return qs ? `${parsed.href}?${qs}` : parsed.href;
}
