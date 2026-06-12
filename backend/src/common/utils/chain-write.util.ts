import {
  Address,
  Hash,
  PublicClient,
  WalletClient,
  WriteContractParameters,
} from 'viem';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetriableChainWriteError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /nonce too low|replacement transaction underpriced|already known/i.test(message);
}

export async function withChainWriteRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 4,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetriableChainWriteError(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error('Chain write retry exhausted');
}

function resolveSignerAddress(
  account: WriteContractParameters['account'],
): Address {
  if (!account) {
    throw new Error('Wallet account is required for chain writes');
  }
  if (typeof account === 'string') {
    return account as Address;
  }
  return account.address;
}

export async function writeContractWithFreshNonce(
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: WriteContractParameters,
  maxAttempts = 4,
): Promise<Hash> {
  const signerAddress = resolveSignerAddress(params.account);

  return withChainWriteRetry(async () => {
    const nonce = await publicClient.getTransactionCount({
      address: signerAddress,
      blockTag: 'pending',
    });
    return walletClient.writeContract({
      ...params,
      nonce,
    });
  }, maxAttempts);
}
