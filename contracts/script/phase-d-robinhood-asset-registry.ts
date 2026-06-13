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
  };
};

const STOCK_TICKERS = ["TSLA", "AMZN", "PLTR", "NFLX", "AMD"] as const;
const USDG = "0x7E955252E15c84f5768B83c41a71F9eba181802F";

async function waitTx(tx: { wait: () => Promise<{ hash?: string } | null>; hash: string }) {
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

async function main(): Promise<void> {
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== 46630n) {
    throw new Error(`Phase D Robinhood registry must deploy on chain 46630, got ${chain.chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  const deploymentPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentRecord;

  const Registry = await ethers.getContractFactory("RobinhoodAssetRegistry");
  const registry = await Registry.deploy(await deployer.getAddress());
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  const deployTxHash = registry.deploymentTransaction()?.hash;

  const registerTxHashes: string[] = [];
  registerTxHashes.push(
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

  for (const ticker of STOCK_TICKERS) {
    registerTxHashes.push(
      await waitTx(
        await registry.registerAsset(
          ethers.encodeBytes32String(ticker),
          ethers.ZeroAddress,
          18,
          false,
          "metadata-only",
          "https://blog.arbitrum.io/robinhood-chain-testnet/",
        ),
      ),
    );
  }

  deployment.contracts.RobinhoodAssetRegistry = {
    address: registryAddress,
    txHash: deployTxHash,
  };
  deployment.phaseD = {
    robinhoodAssetRegistryConfiguredAt: new Date().toISOString(),
    registerTxHashes,
  };
  writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        network: network.name,
        chainId: chain.chainId.toString(),
        registry: registryAddress,
        deployTxHash,
        registerTxHashes,
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
