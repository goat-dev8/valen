import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

type DeploymentRecord = {
  contracts: Record<string, { address: string }>;
};

async function main(): Promise<void> {
  const [admin] = await ethers.getSigners();
  const deploymentPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentRecord;
  const vaultAddress = deployment.contracts.ValenBudgetVault?.address;
  if (!vaultAddress) throw new Error("ValenBudgetVault missing from deployment manifest");

  const vault = await ethers.getContractAt("ValenBudgetVault", vaultAddress);
  const settlementRole = await vault.SETTLEMENT_ROLE();
  const operator = await admin.getAddress();
  const hasRole = await vault.hasRole(settlementRole, operator);
  if (hasRole) {
    console.log(JSON.stringify({ vault: vaultAddress, operator, granted: false, note: "already_has_role" }, null, 2));
    return;
  }

  const tx = await vault.grantRole(settlementRole, operator);
  const receipt = await tx.wait();
  console.log(
    JSON.stringify(
      { vault: vaultAddress, operator, granted: true, txHash: receipt?.hash ?? tx.hash },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
