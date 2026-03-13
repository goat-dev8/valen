export const X402_CHAIN_ID = 421614;
export const X402_USDC_ADDRESS = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';
export const X402_TEMPLATE_ID = 'usdc-agent-payment';
export const X402_MERCHANT_URL = 'https://valenai.vercel.app/dashboard/payments';

export const X402_AMOUNT_PRESETS = ['0.01', '0.05', '0.1', '0.5', '1'] as const;

export const X402_FLOW_STEPS = [
  { id: 'configure', label: 'Configure' },
  { id: 'initiate', label: 'Initiate' },
  { id: 'settle', label: 'Settle' },
  { id: 'proof', label: 'Proof' },
] as const;

export function getX402FlowStepIndex(
  paymentId: string | null,
  settlementTx: string | null,
  options?: { isInitiating?: boolean; isSettling?: boolean },
): number {
  if (settlementTx) return 3;
  if (options?.isSettling || paymentId) return 2;
  if (options?.isInitiating) return 1;
  return 0;
}
