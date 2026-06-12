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

function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
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

export async function ensureWalletOnChain(provider: EthereumProvider, targetChainId: number): Promise<void> {
  const chainConfig = VALEN_WALLET_CHAINS[targetChainId];
  if (!chainConfig) {
    throw new Error(`VALEN does not support wallet signing on chain ${targetChainId}.`);
  }

  const currentChainId = await getWalletChainId(provider);
  if (currentChainId === targetChainId) {
    return;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHexChainId(targetChainId) }],
    });
  } catch (error) {
    if (isUserRejected(error)) {
      throw new Error(
        `Network switch to ${chainName(targetChainId)} was cancelled. Approve the network change in your wallet, then try again.`,
      );
    }
    if (isChainNotAdded(error)) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chainConfig],
        });
      } catch (addError) {
        if (isUserRejected(addError)) {
          throw new Error(
            `Adding ${chainName(targetChainId)} was cancelled. Approve the network in your wallet, then try again.`,
          );
        }
        throw addError;
      }
    } else {
      throw error;
    }
  }

  const updatedChainId = await getWalletChainId(provider);
  if (updatedChainId !== targetChainId) {
    throw new Error(
      `Your wallet is still on ${chainName(updatedChainId)}. Switch to ${chainName(targetChainId)} in your wallet, then try again.`,
    );
  }
}

export function isWalletChainError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /active chainid|chainid is|network switch|wallet must be on|adding .+ was cancelled|network change/i.test(message);
}

export function formatWalletChainError(error: unknown, targetChainId: number): string {
  if (error instanceof Error && error.message.trim()) {
    if (error.message.includes('Network switch') || error.message.includes('Adding ')) {
      return error.message;
    }
    if (/active chainid|chainid is|chain mismatch/i.test(error.message)) {
      return `Your wallet must be on ${chainName(targetChainId)} before signing. Click "Switch wallet network" and approve the prompt on your phone.`;
    }
    return error.message;
  }
  return `Switch your wallet to ${chainName(targetChainId)} before signing, then try again.`;
}
