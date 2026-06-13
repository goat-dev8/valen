import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

type DeploymentRecord = {
  network: string;
  chainId: string;
  contracts: Record<string, { address: string; txHash?: string; implementation?: string }>;
  phaseD?: {
    robinhoodAssetRegistryConfiguredAt: string;
    registerTxHashes: string[];
    stockTokensUpgradedAt?: string;
    stockUpgradeTxHashes?: string[];
  };
};

const STOCK_TOKENS = {
  TSLA: { address: "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E", decimals: 18 },
  AMZN: { address: "0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02", decimals: 18 },
  PLTR: { address: "0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0", decimals: 18 },
  NFLX: { address: "0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93", decimals: 18 },
  AMD: { address: "0x71178BAc73cBeb415514eB542a8995b82669778d", decimals: 18 },
} as const;

const USDG = "0x7E955252E15c84f5768B83c41a71F9eba181802F";
const APPROVE_AMOUNT = 10_000_000_000_000_000_000n; // 10 tokens at 18 decimals

const erc20Abi = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
] as const;

async function waitTx(tx: { wait: () => Promise<{ hash?: string } | null>; hash: string }) {
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

async function main(): Promise<void> {
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== 46630n) {
    throw new Error(`Robinhood stock upgrade runs on chain 46630, got ${chain.chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deploymentPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentRecord;

  const registryAddress = deployment.contracts.RobinhoodAssetRegistry?.address;
  const settlementAddress = deployment.contracts.ValenSettlement.address;
  const adapterAddress = deployment.contracts.ValenTokenSettlementAdapter?.address;
  if (!registryAddress || !adapterAddress) {
    throw new Error("RobinhoodAssetRegistry and ValenTokenSettlementAdapter must be deployed");
  }

  const registry = await ethers.getContractAt("RobinhoodAssetRegistry", registryAddress);
  const settlement = await ethers.getContractAt("ValenSettlement", settlementAddress);
  const stockUpgradeTxHashes: string[] = [];

  for (const [ticker, token] of Object.entries(STOCK_TOKENS)) {
    stockUpgradeTxHashes.push(
      await waitTx(
        await registry.registerAsset(
          ethers.encodeBytes32String(ticker),
          token.address,
          token.decimals,
          true,
          "demo-ready",
          "https://docs.robinhood.com/chain/contracts/",
        ),
      ),
    );

    const enabled = await settlement.tokenSettlementAssetEnabled(token.address);
    if (!enabled) {
      stockUpgradeTxHashes.push(await waitTx(await settlement.setTokenSettlementAsset(token.address, true)));
    }

    const tokenContract = await ethers.getContractAt(erc20Abi, token.address);
    const balance = await tokenContract.balanceOf(deployerAddress);
    if (balance === 0n) {
      throw new Error(`${ticker} relayer balance is zero; fund via Robinhood faucet before settlement demos`);
    }
    const allowance = await tokenContract.allowance(deployerAddress, adapterAddress);
    if (allowance < APPROVE_AMOUNT) {
      stockUpgradeTxHashes.push(await waitTx(await tokenContract.approve(adapterAddress, APPROVE_AMOUNT)));
    }
  }

  // Refresh USDG registry record to demo-ready (already settled in Phase C).
  stockUpgradeTxHashes.push(
    await waitTx(
      await registry.registerAsset(
        ethers.encodeBytes32String("USDG"),
        USDG,
        6,
        true,
        "demo-ready",
        "https://docs.robinhood.com/chain/contracts/",
      ),
    ),
  );

  deployment.phaseD = {
    ...(deployment.phaseD ?? {
      robinhoodAssetRegistryConfiguredAt: new Date().toISOString(),
      registerTxHashes: [],
    }),
    stockTokensUpgradedAt: new Date().toISOString(),
    stockUpgradeTxHashes,
  };
  writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        network: network.name,
        registry: registryAddress,
        settlement: settlementAddress,
        adapter: adapterAddress,
        stockUpgradeTxHashes,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
