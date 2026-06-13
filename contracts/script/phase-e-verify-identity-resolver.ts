import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const resolverAddress = deployment.contracts.ValenIdentityResolver?.address;
  if (!resolverAddress) throw new Error("ValenIdentityResolver missing from deployment manifest");

  const resolver = await ethers.getContractAt("ValenIdentityResolver", resolverAddress);
  const agentKey = deployment.phaseE?.demoAgentKey;
  if (!agentKey) throw new Error("phaseE.demoAgentKey missing from deployment manifest");

  const record = await resolver.getIdentity(agentKey);
  if (record.metadataHash !== deployment.phaseE.metadataHash) {
    throw new Error("Identity metadata hash mismatch");
  }
  if (record.registered) {
    throw new Error("Demo identity should be registration_pending until ERC-8004 token is minted");
  }

  console.log(
    JSON.stringify(
      {
        network: network.name,
        resolver: resolverAddress,
        agentKey,
        owner: record.owner,
        metadataHash: record.metadataHash,
        registered: record.registered,
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
