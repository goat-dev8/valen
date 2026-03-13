export type IntentTemplate = {
  id: string;
  name: string;
  description: string;
  actionType: string;
  targetChainId: number;
  targetAddress: string;
  assetAddress?: string;
  amount: string;
};

export const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    id: 'arbitrum-usdc',
    name: 'USDC Agent Payment',
    description:
      'Primary USDC-scoped intent on Arbitrum Sepolia. Mandate must allow USDC 0x75fa…AA4d. Settlement relayer delivers native ETH today.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    amount: '0.001',
  },
  {
    id: 'arbitrum-transfer',
    name: 'Arbitrum ETH Transfer',
    description: 'Native ETH transfer on Arbitrum Sepolia through compliance, risk, policy, mandate, and settlement.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: 'native',
    amount: '0.001',
  },
  {
    id: 'robinhood-demo',
    name: 'Robinhood TSLA Action',
    description:
      'Headline Robinhood tokenized-asset path on Testnet. TSLA is mandate/policy scope; settlement relays native ETH.',
    actionType: 'custom',
    targetChainId: 46630,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: 'TSLA',
    amount: '0.001',
  },
];

export function intentTemplateById(id: string) {
  return INTENT_TEMPLATES.find((template) => template.id === id) ?? INTENT_TEMPLATES[0];
}
