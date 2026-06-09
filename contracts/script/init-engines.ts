import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";
import {
  COMPLIANCE_RULE_HASH,
  ELIGIBILITY_ROOT_HASH,
  ENGINE_VERSION,
  RISK_MODEL_HASH,
} from "./lib/engine-constants";

const ENGINE_INIT = [
  {
    name: "ComplianceEngine",
    abi: [
      "function initialize(bytes32,address,bytes32,uint32,bytes32)",
      "function getEngineVersion() view returns (bytes32)",
    ],
    args: (settlement: string) => [
      ENGINE_VERSION,
      settlement,
      COMPLIANCE_RULE_HASH,
      8,
      ethers.ZeroHash,
    ],
  },
  {
    name: "RiskEngine",
    abi: [
      "function initialize(bytes32,address,bytes32,uint16,uint16,uint16,uint16)",
      "function getEngineVersion() view returns (bytes32)",
    ],
    args: (settlement: string) => [
      ENGINE_VERSION,
      settlement,
      RISK_MODEL_HASH,
      25,
      50,
      75,
      6,
    ],
  },
  {
    name: "EligibilityEngine",
    abi: [
      "function initialize(bytes32,address,bytes32,uint32)",
      "function getEngineVersion() view returns (bytes32)",
    ],
    args: (settlement: string) => [
      ENGINE_VERSION,
      settlement,
      ELIGIBILITY_ROOT_HASH,
      8,
    ],
  },
  {
    name: "PolicyEngine",
    abi: [
      "function initialize(bytes32,address,bytes32,uint32,uint32)",
      "function getEngineVersion() view returns (bytes32)",
    ],
    args: (settlement: string, policyHash: string) => [
      ENGINE_VERSION,
      settlement,
      policyHash,
      16,
      4,
    ],
  },
] as const;

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const engines = JSON.parse(
    readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"),
  );

  const settlement = deployment.contracts.ValenSettlement.address;
  const policyHash = ethers.id("valen-policy-v1");

  for (const spec of ENGINE_INIT) {
    const engine = engines[spec.name];
    if (!engine?.address) {
      throw new Error(`Missing engine address for ${spec.name}`);
    }

    const contract = new ethers.Contract(
      engine.address,
      spec.abi,
      (await ethers.getSigners())[0],
    );

    const version = await contract.getEngineVersion();
    if (version !== ethers.ZeroHash) {
      console.log(`${spec.name} already initialized at ${engine.address}`);
      continue;
    }

    const args =
      spec.name === "PolicyEngine"
        ? spec.args(settlement, policyHash)
        : spec.args(settlement);

    const tx = await contract.initialize(...args);
    await tx.wait();
    console.log(`Initialized ${spec.name} at ${engine.address}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
