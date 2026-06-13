import { ROBINHOOD_STOCK_TOKENS, ROBINHOOD_TESTNET_USDG } from './robinhood-assets';

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
const ROBINHOOD_TICKERS = Object.keys(ROBINHOOD_STOCK_TOKENS) as Array<keyof typeof ROBINHOOD_STOCK_TOKENS>;

function robinhoodStockTemplate(
  ticker: keyof typeof ROBINHOOD_STOCK_TOKENS,
  scenario: 'allowed' | 'refused',
): IntentTemplate {
  const token = ROBINHOOD_STOCK_TOKENS[ticker];
  const isAllowed = scenario === 'allowed';
  return {
    id: `robinhood-${ticker.toLowerCase()}-${scenario}`,
    name: `Robinhood ${ticker} ${isAllowed ? 'Allowed' : 'Refused'}`,
    description: isAllowed
      ? `${ticker} ERC-20 transfer on Robinhood Testnet through the Phase C token adapter.`
      : `${ticker} over-limit scenario refused by Robinhood policy before settlement.`,
    actionType: isAllowed ? 'transfer' : 'robinhood_token_transfer',
    targetChainId: 46630,
    targetAddress: ROBINHOOD_TARGET,
    assetAddress: isAllowed ? token.address : ticker,
    amount: isAllowed ? '1' : '250',
    metadata: {
      robinhood: {
        ticker,
        scenario,
        settlementAsset: ticker,
        policyAssetSupportLevel: 'demo-ready',
        tokenAddress: token.address,
      },
    },
  };
}

export const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    id: 'arbitrum-usdc',
    name: 'USDC Agent Payment',
    description: 'USDC-scoped governed payment on Arbitrum Sepolia with proof-ready settlement.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    amount: '0.001',
  },
  {
    id: 'arbitrum-legacy-eth',
    name: 'Legacy / Gas ETH Transfer',
    description: 'Legacy native ETH transfer on Arbitrum Sepolia.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: 'native',
    amount: '0.001',
  },
  {
    id: 'robinhood-usdg-allowed',
    name: 'Robinhood USDG Allowed',
    description: 'USDG ERC-20 settlement on Robinhood Testnet via the Phase C token adapter.',
    actionType: 'transfer',
    targetChainId: 46630,
    targetAddress: ROBINHOOD_TARGET,
    assetAddress: ROBINHOOD_TESTNET_USDG,
    amount: '0.001',
    metadata: {
      robinhood: { ticker: 'USDG', scenario: 'allowed', settlementAsset: 'USDG' },
    },
  },
  ...ROBINHOOD_TICKERS.flatMap((ticker) => [
    robinhoodStockTemplate(ticker, 'allowed'),
    robinhoodStockTemplate(ticker, 'refused'),
  ]),
];

export function intentTemplateById(id: string) {
  return INTENT_TEMPLATES.find((template) => template.id === id) ?? INTENT_TEMPLATES[0];
}
