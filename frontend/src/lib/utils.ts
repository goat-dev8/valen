import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(value?: string | number | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.trim();
  if (!message) return fallback;

  if (message.includes('agent_wallets_chain_wallet_unique')) {
    return 'This wallet is already linked on the selected chain. Choose a different address or chain.';
  }

  if (message.toLowerCase().includes('invalid evm wallet address')) {
    return 'Enter a valid EVM wallet address (0x followed by 40 hex characters).';
  }

  return message;
}

export function normalizeEvmAddressInput(value: string): string | null {
  const trimmed = value.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}
