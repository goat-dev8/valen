import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

type DeploymentRecord = {
  network: string;
  chainId: string;
  contracts: Record<string, { address: string; txHash?: string; implementation?: string }>;
  phaseF?: {
    budgetVaultConfiguredAt: string;
    budgetVault: string;
    asset: string;
    agentKey: string;
    cap: string;
    topUpTxHash?: string;
  };
};

const USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const DEMO_AGENT_ID = process.env.PHASE_F_AGENT_ID ?? "64f56184-eacf-4eef-bc84-f3b863d3894f";
const CAP = BigInt(process.env.PHASE_F_CAP ?? "1000000"); // 1 USDC at 6 decimals.

const erc20Abi = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
] as const;

async function waitTx(tx: { wait: () => Promise<{ hash?: string } | null>; hash: string }) {
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

async function main(): Promise<void> {
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== 421614n) {
    throw new Error(`Phase F budget vault deploys on Arbitrum Sepolia, got ${chain.chainId}`);
  }
  const [deployer] = await ethers.getSigners();
  const deploymentPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentRecord;
  const settlement = deployment.contracts.ValenSettlement.address;
  const agentKey = ethers.id(DEMO_AGENT_ID);

  const token = await ethers.getContractAt(erc20Abi, USDC);
  const balance = await token.balanceOf(await deployer.getAddress());
  if (balance < CAP) {
    throw new Error(`Insufficient USDC for budget topup: have ${balance}, need ${CAP}`);
  }

  const Vault = await ethers.getContractFactory("ValenBudgetVault");
  const vault = await Vault.deploy(await deployer.getAddress(), settlement, USDC, agentKey, CAP, 86_400);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  const deployTxHash = vault.deploymentTransaction()?.hash;
  await waitTx(await token.approve(vaultAddress, CAP));
  const topUpTxHash = await waitTx(await vault.topUp(CAP, CAP));

  deployment.contracts.ValenBudgetVault = {
    address: vaultAddress,
    txHash: deployTxHash,
  };
  deployment.phaseF = {
    budgetVaultConfiguredAt: new Date().toISOString(),
    budgetVault: vaultAddress,
    asset: USDC,
    agentKey,
    cap: CAP.toString(),
    topUpTxHash,
  };
  writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(
    JSON.stringify(
      { network: network.name, vault: vaultAddress, deployTxHash, topUpTxHash, agentKey, cap: CAP.toString() },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
