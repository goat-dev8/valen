import { Address, createPublicClient, formatEther, formatUnits, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { ARBITRUM_SEPOLIA_USDC, ROBINHOOD_STOCK_TICKERS, ROBINHOOD_TESTNET_USDG } from './known-assets';
import { ROBINHOOD_STOCK_TOKENS } from './robinhood-assets';

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

const RPC_BY_CHAIN: Record<number, string> = {
  421614: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ?? 'https://sepolia-rollup.arbitrum.io/rpc',
  46630: process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL ?? 'https://rpc.testnet.chain.robinhood.com',
};

export type ChainWalletBalance = {
  chainId: number;
  nativeSymbol: string;
  nativeFormatted: string;
  nativeWei: string;
  tokens: Array<{ symbol: string; address: string; formatted: string; raw: string }>;
};

function publicClientForChain(chainId: number) {
  const transport = http(RPC_BY_CHAIN[chainId]);
  if (chainId === 421614) {
    return createPublicClient({ chain: arbitrumSepolia, transport });
  }
  return createPublicClient({
    chain: {
      id: 46630,
      name: 'Robinhood Testnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [RPC_BY_CHAIN[46630]] } },
    },
    transport,
  });
}

async function readErc20Balance(
  client: ReturnType<typeof publicClientForChain>,
  tokenAddress: Address,
  walletAddress: Address,
): Promise<{ symbol: string; formatted: string; raw: string } | null> {
  try {
    const [balance, decimals, symbol] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'balanceOf', args: [walletAddress] }),
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'decimals' }),
      client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'symbol' }),
    ]);
    return {
      symbol,
      formatted: formatUnits(balance, decimals),
      raw: balance.toString(),
    };
  } catch {
    return null;
  }
}

export async function fetchWalletBalancesForChain(
  chainId: number,
  walletAddress: string,
): Promise<ChainWalletBalance> {
  const client = publicClientForChain(chainId);
  const address = walletAddress as Address;
  const nativeWei = await client.getBalance({ address });
  const tokens: ChainWalletBalance['tokens'] = [];

  if (chainId === 421614) {
    const usdc = await readErc20Balance(client, ARBITRUM_SEPOLIA_USDC, address);
    if (usdc) {
      tokens.push({ ...usdc, address: ARBITRUM_SEPOLIA_USDC });
    }
  }
  if (chainId === 46630) {
    const usdg = await readErc20Balance(client, ROBINHOOD_TESTNET_USDG, address);
    if (usdg) {
      tokens.push({ ...usdg, address: ROBINHOOD_TESTNET_USDG });
    }
    for (const symbol of ROBINHOOD_STOCK_TICKERS) {
      const token = ROBINHOOD_STOCK_TOKENS[symbol];
      const stock = await readErc20Balance(client, token.address as Address, address);
      if (stock) {
        tokens.push({ ...stock, address: token.address });
      }
    }
  }

  return {
    chainId,
    nativeSymbol: 'ETH',
    nativeFormatted: formatEther(nativeWei),
    nativeWei: nativeWei.toString(),
    tokens,
  };
}

export async function fetchWalletBalancesAllChains(walletAddress: string): Promise<ChainWalletBalance[]> {
  return Promise.all([421614, 46630].map((chainId) => fetchWalletBalancesForChain(chainId, walletAddress)));
}
