import { chainName } from '@/lib/constants';

export type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

type AddEthereumChainParameter = {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export const VALEN_WALLET_CHAINS: Record<number, AddEthereumChainParameter> = {
  421614: {
    chainId: '0x66eee',
    chainName: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  },
  46630: {
    chainId: '0xb626',
    chainName: 'Robinhood Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
    blockExplorerUrls: ['https://explorer.testnet.chain.robinhood.com'],
  },
};

/** Common misconfiguration when decimal chain id is used as hex (46630 → 0x46630 = 288304). */
export const MISCONFIGURED_CHAIN_IDS: Record<number, number> = {
  288304: 46630,
};

function toHexChainId(chainId: number): string {
  return VALEN_WALLET_CHAINS[chainId]?.chainId ?? `0x${chainId.toString(16)}`;
}

function isUserRejected(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined;
  return code === 4001;
}

function isChainNotAdded(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined;
  return code === 4902;
}

export async function getWalletChainId(provider: EthereumProvider): Promise<number> {
  const chainId = await provider.request({ method: 'eth_chainId' });
  return Number.parseInt(String(chainId), 16);
}

async function addTargetChain(provider: EthereumProvider, targetChainId: number): Promise<void> {
  const chainConfig = VALEN_WALLET_CHAINS[targetChainId];
  if (!chainConfig) {
    throw new Error(`VALEN does not support wallet signing on chain ${targetChainId}.`);
  }

  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [chainConfig],
    });
  } catch (error) {
    if (isUserRejected(error)) {
      throw new Error(
        `Adding ${chainName(targetChainId)} was cancelled. Approve the network in your wallet, then try again.`,
      );
    }
    // Ignore "chain already added" style errors and continue to switch.
  }
}

async function switchTargetChain(provider: EthereumProvider, targetChainId: number): Promise<void> {
  const hexChainId = toHexChainId(targetChainId);
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    if (isUserRejected(error)) {
      throw new Error(
        `Network switch to ${chainName(targetChainId)} was cancelled. Approve the network change in your wallet, then try again.`,
      );
    }
    if (isChainNotAdded(error)) {
      await addTargetChain(provider, targetChainId);
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      return;
    }
    throw error;
  }
}

export async function ensureWalletOnChain(provider: EthereumProvider, targetChainId: number): Promise<void> {
  if (!VALEN_WALLET_CHAINS[targetChainId]) {
    throw new Error(`VALEN does not support wallet signing on chain ${targetChainId}.`);
  }

  let currentChainId = await getWalletChainId(provider);
  if (currentChainId === targetChainId) {
    return;
  }

  // Ensure the correct chain definition exists, then switch. This is idempotent for new users.
  await addTargetChain(provider, targetChainId);
  await switchTargetChain(provider, targetChainId);

  currentChainId = await getWalletChainId(provider);
  if (currentChainId === targetChainId) {
    return;
  }

  const misconfiguredTarget = MISCONFIGURED_CHAIN_IDS[currentChainId];
  if (misconfiguredTarget === targetChainId) {
    throw new Error(
      `Your wallet added ${chainName(targetChainId)} with the wrong chain ID (${currentChainId}). VALEN will add the correct network now — approve the new network prompt, then try again.`,
    );
  }

  throw new Error(
    `Your wallet is still on ${chainName(currentChainId)}. Approve the ${chainName(targetChainId)} network prompt on your phone, then try again.`,
  );
}

export function isWalletChainError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /active chainid|chainid is|network switch|wallet must be on|adding .+ was cancelled|network change|wrong chain id|approve the .+ network/i.test(
    message,
  );
}

export function formatWalletChainError(error: unknown, targetChainId: number): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return `Approve the ${chainName(targetChainId)} network switch in your wallet, then try again.`;
}

export function resolveDisplayChainId(chainId: number | null | undefined): number | null {
  if (!chainId) return null;
  return MISCONFIGURED_CHAIN_IDS[chainId] ?? chainId;
}
