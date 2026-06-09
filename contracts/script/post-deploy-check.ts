import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

async function main(): Promise<void> {
  const artifactPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(artifactPath, "utf8"));
  const registry = await ethers.getContractAt("ValenRegistry", deployment.contracts.ValenRegistry.address);
  const chainId = Number(deployment.chainId);

  await registry.setChainSupport(chainId, true, true);
  if (!(await registry.isChainSupported(chainId))) {
    throw new Error(`Registry did not mark chain ${chainId} supported`);
  }

  const settlement = await ethers.getContractAt("ValenSettlement", deployment.contracts.ValenSettlement.address);
  const treasury = await ethers.getContractAt("ValenTreasury", deployment.contracts.ValenTreasury.address);

  if ((await settlement.getAddress()) === ethers.ZeroAddress) {
    throw new Error("Settlement address invalid");
  }
  if ((await treasury.getAddress()) === ethers.ZeroAddress) {
    throw new Error("Treasury address invalid");
  }

  console.log(`Post-deploy checks passed for ${network.name} (${chainId})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
