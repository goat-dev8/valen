import { ethers, network } from "hardhat";

const TOKEN_BY_CHAIN: Record<string, { symbol: string; address: string; decimals: bigint }> = {
  "421614": {
    symbol: "USDC",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    decimals: 6n,
  },
  "46630": {
    symbol: "USDG",
    address: "0x7E955252E15c84f5768B83c41a71F9eba181802F",
    decimals: 18n,
  },
};

const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
] as const;

function formatToken(raw: bigint, decimals: bigint): string {
  const unit = 10n ** decimals;
  const whole = raw / unit;
  const fractional = raw % unit;
  if (fractional === 0n) return whole.toString();
  const fraction = fractional.toString().padStart(Number(decimals), "0").replace(/0+$/, "");
  return `${whole}.${fraction}`;
}

async function main(): Promise<void> {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const chain = await ethers.provider.getNetwork();
  const token = TOKEN_BY_CHAIN[chain.chainId.toString()];
  const nativeBalance = await ethers.provider.getBalance(address);
  console.log(`network=${network.name}`);
  console.log(`chainId=${chain.chainId}`);
  console.log(`relayer=${address}`);
  console.log(`nativeWei=${nativeBalance}`);
  console.log(`nativeEth=${ethers.formatEther(nativeBalance)}`);

  if (!token) return;
  const tokenContract = await ethers.getContractAt(erc20Abi, token.address);
  const [symbol, decimals, balance] = await Promise.all([
    tokenContract.symbol().catch(() => token.symbol),
    tokenContract.decimals().catch(() => Number(token.decimals)),
    tokenContract.balanceOf(address),
  ]);
  console.log(`token=${symbol}`);
  console.log(`tokenAddress=${token.address}`);
  console.log(`tokenDecimals=${decimals}`);
  console.log(`tokenRaw=${balance}`);
  console.log(`tokenFormatted=${formatToken(balance, BigInt(decimals))}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
