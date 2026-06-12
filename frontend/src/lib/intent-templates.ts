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
    id: 'arbitrum-transfer',
    name: 'Arbitrum Transfer',
    description: 'Submit a standard Arbitrum Sepolia transfer through compliance, risk, policy, mandate, and settlement.',
    actionType: 'transfer',
    targetChainId: 421614,
    targetAddress: '0x0000000000000000000000000000000000000000',
    amount: '0.01',
  },
  {
    id: 'robinhood-demo',
    name: 'Robinhood Demo Intent',
    description: 'Run the Robinhood Testnet demo path using the same mandate and proof model.',
    actionType: 'custom',
    targetChainId: 46630,
    targetAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: 'TSLA',
    amount: '1',
  },
];

export function intentTemplateById(id: string) {
  return INTENT_TEMPLATES.find((template) => template.id === id) ?? INTENT_TEMPLATES[0];
}
