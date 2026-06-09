import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

const ENGINES = [
  ["ComplianceEngine", "ENGINE_COMPLIANCE"],
  ["RiskEngine", "ENGINE_RISK"],
  ["EligibilityEngine", "ENGINE_ELIGIBILITY"],
  ["PolicyEngine", "ENGINE_POLICY"],
] as const;

async function main(): Promise<void> {
  const deployment = JSON.parse(readFileSync(join("deployments", network.name, "deployment.json"), "utf8"));
  const engines = JSON.parse(readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"));
  const registry = await ethers.getContractAt("ValenRegistry", deployment.contracts.ValenRegistry.address);

  for (const [name] of ENGINES) {
    const engine = engines[name];
    if (!engine?.address || engine.address === ethers.ZeroAddress) {
      throw new Error(`Missing Stylus engine address for ${name}`);
    }
    const tx = await registry.registerEngine(ethers.id(name), engine.address, engine.version);
    await tx.wait();
    console.log(`Registered ${name}: ${engine.address} (${engine.version})`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
