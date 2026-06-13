export type IntentTemplate = {
  id: string;
  name: string;
  description: string;
  actionType: string;
  targetChainId: number;
  targetAddress: string;
  assetAddress?: string;
  amount: string;
  metadata?: Record<string, unknown>;
};

const ROBINHOOD_TARGET = '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3';
const ROBINHOOD_USDG = '0x7E955252E15c84f5768B83c41a71F9eba181802F';
const ROBINHOOD_TICKERS = ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD'] as const;

function robinhoodTemplate(ticker: (typeof ROBINHOOD_TICKERS)[number], scenario: 'allowed' | 'refused'): IntentTemplate {
  const isAllowed = scenario === 'allowed';
  return {
    id: `robinhood-${ticker.toLowerCase()}-${scenario}`,
    name: `Robinhood ${ticker} ${isAllowed ? 'Allowed' : 'Refused'}`,
    description: isAllowed
      ? `${ticker} policy asset within demo limits. Stock token remains metadata-only until its contract is verified; proof labels the policy asset honestly.`
      : `${ticker} over-limit scenario. This should be refused by policy/risk once refusal receipts are active; no fake stock-token settlement is attempted.`,
    actionType: 'robinhood_token_transfer',
    targetChainId: 46630,
    targetAddress: ROBINHOOD_TARGET,
    assetAddress: ticker,
    amount: isAllowed ? '10' : '250',
    metadata: {
      robinhood: {
        ticker,
        scenario,
        policyAssetSupportLevel: 'metadata-only',
        settlementAsset: 'USDG',
      },
    },
  };
}

export const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    id: 'arbitrum-usdc',
    name: 'USDC Agent Payment',
    description:
      'Default VALEN action: a USDC-scoped governed payment on Arbitrum Sepolia with proof-ready asset metadata.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    amount: '0.001',
  },
  {
    id: 'arbitrum-legacy-eth',
    name: 'Legacy / Gas ETH Transfer',
    description: 'Legacy native ETH transfer on Arbitrum Sepolia. Keep for backward-compatible proofs and gas-path fallback.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: 'native',
    amount: '0.001',
  },
  {
    id: 'robinhood-usdg-allowed',
    name: 'Robinhood USDG Allowed',
    description:
      'Real Robinhood Testnet ERC-20 settlement path using official USDG and the Phase C token adapter.',
    actionType: 'transfer',
    targetChainId: 46630,
    targetAddress: ROBINHOOD_TARGET,
    assetAddress: ROBINHOOD_USDG,
    amount: '0.001',
    metadata: {
      robinhood: {
        ticker: 'USDG',
        scenario: 'allowed',
        settlementAsset: 'USDG',
      },
    },
  },
  ...ROBINHOOD_TICKERS.flatMap((ticker) => [
    robinhoodTemplate(ticker, 'allowed'),
    robinhoodTemplate(ticker, 'refused'),
  ]),
];

export function intentTemplateById(id: string) {
  return INTENT_TEMPLATES.find((template) => template.id === id) ?? INTENT_TEMPLATES[0];
}
