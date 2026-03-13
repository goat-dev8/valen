import { getAddress } from 'viem';

export type SignableWallet = {
  address?: string;
  chainId?: unknown;
  getEthereumProvider?: () => Promise<EthereumProvider>;
};

export type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

export function normalizeChainId(chainId: unknown): number | null {
  if (typeof chainId === 'number') return chainId;
  if (typeof chainId === 'string') {
    const last = chainId.split(':').pop();
    const parsed = Number(last);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function shortAddress(address?: string | null) {
  if (!address) return 'Unavailable';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function commaList(value: FormDataEntryValue | null, fallback: string[] = []) {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function requestPersonalSignature(wallet: SignableWallet, message: string): Promise<string> {
  if (!wallet.address || !wallet.getEthereumProvider) {
    throw new Error('Connected wallet does not expose a signing provider');
  }

  const provider = await wallet.getEthereumProvider();
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, wallet.address],
  });

  if (typeof signature !== 'string') {
    throw new Error('Wallet did not return a signature');
  }

  return signature;
}

export async function requestTypedDataSignature(
  wallet: SignableWallet,
  typedData: Record<string, unknown>,
): Promise<string> {
  if (!wallet.address || !wallet.getEthereumProvider) {
    throw new Error('Connected wallet does not expose a signing provider');
  }

  const provider = await wallet.getEthereumProvider();
  const signature = await provider.request({
    method: 'eth_signTypedData_v4',
    params: [wallet.address, JSON.stringify(typedData)],
  });

  if (typeof signature !== 'string') {
    throw new Error('Wallet did not return a signature');
  }

  return signature;
}

export function normalizeWalletAddress(address?: string | null): string | null {
  if (!address) return null;
  try {
    return getAddress(address);
  } catch {
    return null;
  }
}

export const AUTHORITY_CHAIN_IDS = [421614, 46630] as const;
