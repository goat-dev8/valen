import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";
import { COMPLIANCE_RULE_HASH, ENGINE_VERSION } from "./lib/engine-constants";

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const engines = JSON.parse(
    readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"),
  );
  const [signer] = await ethers.getSigners();
  const settlement = deployment.contracts.ValenSettlement.address;
  const ce = new ethers.Contract(
    engines.ComplianceEngine.address,
    ["function initialize(bytes32,address,bytes32,uint32,bytes32)"],
    signer,
  );

  try {
    const tx = await ce.initialize(
      ENGINE_VERSION,
      settlement,
      COMPLIANCE_RULE_HASH,
      8,
      ethers.ZeroHash,
    );
    console.log("tx", tx.hash);
    await tx.wait();
    console.log("initialized");
  } catch (error: unknown) {
    const err = error as { shortMessage?: string; message?: string; data?: string };
    console.log("error", err.shortMessage ?? err.message);
    console.log("data", err.data);
  }
}

main();
