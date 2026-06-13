import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

async function main(): Promise<void> {
  const deployment = JSON.parse(readFileSync(join("deployments", network.name, "deployment.json"), "utf8"));
  const vaultAddress = deployment.contracts.ValenBudgetVault?.address;
  if (!vaultAddress) throw new Error("ValenBudgetVault missing from deployment manifest");
  const vault = await ethers.getContractAt("ValenBudgetVault", vaultAddress);
  const remaining = await vault.remaining();
  if (remaining === 0n) throw new Error("Budget vault has no remaining budget");
  console.log(
    JSON.stringify(
      {
        network: network.name,
        vault: vaultAddress,
        asset: await vault.asset(),
        agentKey: await vault.agentKey(),
        cap: (await vault.cap()).toString(),
        spent: (await vault.spent()).toString(),
        remaining: remaining.toString(),
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
