import { ARBITRUM_SEPOLIA_USDC, ROBINHOOD_TESTNET_USDG } from './known-assets';
import { ROBINHOOD_STOCK_TOKENS } from './robinhood-assets';

export type ResourceLink = {
  label: string;
  href: string;
  description?: string;
  address?: string;
  chainId?: number;
};

export type ResourceSection = {
  title: string;
  description: string;
  links: ResourceLink[];
};

export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    title: 'Block Explorers',
    description: 'Verify transactions, contracts, and token balances on-chain.',
    links: [
      {
        label: 'Arbitrum Sepolia Explorer',
        href: 'https://sepolia.arbiscan.io',
        description: 'Primary explorer for USDC settlements and VALEN contracts on Arbitrum Sepolia.',
      },
      {
        label: 'Robinhood Testnet Explorer',
        href: 'https://explorer.testnet.chain.robinhood.com',
        description: 'Explorer for USDG and tokenized stock settlements on Robinhood Chain Testnet.',
      },
    ],
  },
  {
    title: 'Testnet Faucets',
    description: 'Fund wallets with gas and demo tokens before running governed actions.',
    links: [
      {
        label: 'Arbitrum Sepolia ETH Faucet',
        href: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
        description: 'Gas for Arbitrum Sepolia transactions.',
      },
      {
        label: 'Circle USDC Faucet (Sepolia)',
        href: 'https://faucet.circle.com/',
        description: 'Official USDC test tokens for Arbitrum Sepolia.',
      },
      {
        label: 'Robinhood Testnet Faucet',
        href: 'https://faucet.testnet.chain.robinhood.com',
        description: 'Robinhood testnet ETH and demo assets.',
      },
    ],
  },
  {
    title: 'Arbitrum Sepolia Tokens (421614)',
    description: 'Copy or open contract addresses used by VALEN USDC flows.',
    links: [
      {
        label: 'USDC',
        href: `https://sepolia.arbiscan.io/token/${ARBITRUM_SEPOLIA_USDC}`,
        address: ARBITRUM_SEPOLIA_USDC,
        chainId: 421614,
      },
    ],
  },
  {
    title: 'Robinhood Testnet Tokens (46630)',
    description: 'Tokenized stocks and USDG settle through ValenTokenSettlementAdapter.',
    links: [
      {
        label: 'USDG',
        href: `https://explorer.testnet.chain.robinhood.com/address/${ROBINHOOD_TESTNET_USDG}`,
        address: ROBINHOOD_TESTNET_USDG,
        chainId: 46630,
      },
      ...Object.values(ROBINHOOD_STOCK_TOKENS).map((token) => ({
        label: token.symbol,
        href: `https://explorer.testnet.chain.robinhood.com/address/${token.address}`,
        address: token.address,
        chainId: 46630,
        description: token.name,
      })),
    ],
  },
];
