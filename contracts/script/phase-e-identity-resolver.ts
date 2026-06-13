import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

type DeploymentRecord = {
  network: string;
  chainId: string;
  contracts: Record<string, { address: string; txHash?: string; implementation?: string }>;
  phaseE?: {
    identityResolverConfiguredAt: string;
    demoAgentId: string;
    demoAgentKey: string;
    metadataHash: string;
    bindTxHash: string;
  };
};

const DEMO_AGENT_ID = process.env.PHASE_E_AGENT_ID ?? "64f56184-eacf-4eef-bc84-f3b863d3894f";
const DEMO_OWNER = process.env.PHASE_E_OWNER_ADDRESS ?? "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3";

async function waitTx(tx: { wait: () => Promise<{ hash?: string } | null>; hash: string }) {
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

async function main(): Promise<void> {
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== 421614n) {
    throw new Error(`Phase E identity resolver must deploy on Arbitrum Sepolia, got ${chain.chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  const deploymentPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentRecord;

  const Resolver = await ethers.getContractFactory("ValenIdentityResolver");
  const resolver = await Resolver.deploy(await deployer.getAddress());
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  const deployTxHash = resolver.deploymentTransaction()?.hash;

  const metadata = {
    name: "VALEN Demo Agent",
    valenAgentId: DEMO_AGENT_ID,
    standard: "ERC-8004",
    status: "registration_pending",
    proof: "VALEN Phase E identity resolver",
  };
  const agentKey = ethers.id(DEMO_AGENT_ID);
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));
  const bindTxHash = await waitTx(
    await resolver.bindIdentity(
      agentKey,
      ethers.ZeroAddress,
      0,
      DEMO_OWNER,
      "https://valenai.vercel.app/agents/erc8004/demo-agent.json",
      metadataHash,
      false,
    ),
  );

  deployment.contracts.ValenIdentityResolver = {
    address: resolverAddress,
    txHash: deployTxHash,
  };
  deployment.phaseE = {
    identityResolverConfiguredAt: new Date().toISOString(),
    demoAgentId: DEMO_AGENT_ID,
    demoAgentKey: agentKey,
    metadataHash,
    bindTxHash,
  };
  writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        network: network.name,
        resolver: resolverAddress,
        deployTxHash,
        demoAgentId: DEMO_AGENT_ID,
        agentKey,
        metadataHash,
        bindTxHash,
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
