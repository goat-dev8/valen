import type { ExecutionDto } from '@/types/api';

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

type SignableWallet = {
  address?: string;
  getEthereumProvider?: () => Promise<EthereumProvider>;
};

export async function signApprovalProof(input: {
  wallet: SignableWallet | undefined;
  execution: ExecutionDto;
  decision: 'approved' | 'rejected';
  reason: string;
}) {
  if (!input.wallet?.address || !input.wallet.getEthereumProvider) {
    throw new Error('Connect a wallet to sign this approval decision.');
  }

  const message = [
    'VALEN Approval Decision',
    '',
    'Sign this message to approve or reject a high-risk or out-of-threshold agent execution.',
    `Execution: ${input.execution.id}`,
    `Decision: ${input.decision}`,
    `Reason: ${input.reason}`,
    `Agent: ${input.execution.agentId}`,
    `Mandate: ${input.execution.mandateId ?? 'none'}`,
    `Policy: ${input.execution.policyId ?? 'none'}`,
    `Chain ID: ${input.execution.targetChainId}`,
    `Action: ${input.execution.actionType}`,
    `Target: ${input.execution.targetAddress ?? 'none'}`,
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n');

  const provider = await input.wallet.getEthereumProvider();
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, input.wallet.address],
  });

  if (typeof signature !== 'string') {
    throw new Error('Wallet did not return an approval signature.');
  }

  return JSON.stringify({
    type: 'VALEN_APPROVAL_SIGNATURE',
    signer: input.wallet.address,
    signature,
    message,
    decision: input.decision,
    executionId: input.execution.id,
    mandateId: input.execution.mandateId,
    policyId: input.execution.policyId,
    signedAt: new Date().toISOString(),
  });
}
