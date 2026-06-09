import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^0x/i, "");
  if (trimmed.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return undefined;
  }
  return `0x${trimmed}`;
}

const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY);

const accounts = privateKey ? [privateKey] : undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    localhost: {
      url: process.env.LOCALHOST_RPC_URL ?? "http://127.0.0.1:8545",
      chainId: 31337,
      accounts,
    },
    "arbitrum-sepolia": {
      url: process.env.ARB_SEPOLIA_RPC ?? "",
      chainId: 421614,
      accounts,
    },
    "robinhood-testnet": {
      url: process.env.ROBINHOOD_TESTNET_RPC ?? "",
      chainId: 46630,
      accounts,
    },
    "arbitrum-one": {
      url: process.env.ARB_MAINNET_RPC ?? "",
      chainId: 42161,
      accounts,
    },
  },
};

export default config;
