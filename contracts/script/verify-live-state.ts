import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

const SOLIDITY_CONTRACTS = [
  "ValenTimelock",
  "ValenRegistry",
  "ValenPolicyManager",
  "ValenMandateRegistry",
  "ValenSettlement",
  "ValenTreasury",
  "ValenEscrow",
  "ValenGovernance",
  "ValenAuditLog",
  "ValenEmergencyGuardian",
] as const;

const ENGINES = [
  "ComplianceEngine",
  "RiskEngine",
  "EligibilityEngine",
  "PolicyEngine",
] as const;

const PHASE_C_TOKEN_BY_CHAIN: Record<number, { symbol: string; address: string }> = {
  421614: {
    symbol: "USDC",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  },
  46630: {
    symbol: "USDG",
    address: "0x7E955252E15c84f5768B83c41a71F9eba181802F",
  },
};

async function requireCode(address: string, label: string): Promise<void> {
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(`${label} has no bytecode at ${address}`);
  }
}

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const engines = JSON.parse(
    readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"),
  );
  const chainId = Number(deployment.chainId);
  const registryAddress = deployment.contracts.ValenRegistry.address;
  const settlementAddress = deployment.contracts.ValenSettlement.address;

  for (const name of SOLIDITY_CONTRACTS) {
    await requireCode(deployment.contracts[name].address, name);
  }

  const registry = await ethers.getContractAt("ValenRegistry", registryAddress);
  const chainSupport = await registry.getChainSupport(chainId);
  if (!chainSupport.enabled || !chainSupport.stylusSupported) {
    throw new Error(`Chain ${chainId} is not enabled with Stylus support`);
  }

  const settlement = await ethers.getContractAt("ValenSettlement", settlementAddress);
  const linkedRegistry = await settlement.registry();
  const linkedMandate = await settlement.mandateRegistry();
  const linkedPolicy = await settlement.policyManager();
  const linkedTreasury = await settlement.treasury();
  const linkedAudit = await settlement.auditLog();
  if (linkedRegistry.toLowerCase() !== registryAddress.toLowerCase()) {
    throw new Error(`Settlement registry mismatch: ${linkedRegistry}`);
  }
  for (const [label, address] of [
    ["mandateRegistry", linkedMandate],
    ["policyManager", linkedPolicy],
    ["treasury", linkedTreasury],
    ["auditLog", linkedAudit],
  ] as const) {
    if (address === ethers.ZeroAddress) {
      throw new Error(`Settlement ${label} is zero`);
    }
    await requireCode(address, `Settlement.${label}`);
  }

  if (deployment.contracts.ValenTokenSettlementAdapter?.address) {
    const adapterAddress = deployment.contracts.ValenTokenSettlementAdapter.address;
    await requireCode(adapterAddress, "ValenTokenSettlementAdapter");
    const configuredAdapter = await settlement.tokenSettlementAdapter();
    if (configuredAdapter.toLowerCase() !== adapterAddress.toLowerCase()) {
      throw new Error(`Token adapter mismatch: ${configuredAdapter} != ${adapterAddress}`);
    }
    const token = PHASE_C_TOKEN_BY_CHAIN[chainId];
    if (!token) {
      throw new Error(`No Phase C token expected for chain ${chainId}`);
    }
    const enabled = await settlement.tokenSettlementAssetEnabled(token.address);
    if (!enabled) {
      throw new Error(`${token.symbol} is not enabled for token settlement`);
    }
    console.log(`${token.symbol} token settlement enabled via ${adapterAddress}`);
  }

  for (const name of ENGINES) {
    const expected = engines[name]?.address;
    if (!expected || expected === ethers.ZeroAddress) {
      throw new Error(`Missing expected engine address for ${name}`);
    }
    await requireCode(expected, name);
    const [registered, version] = await registry.getEngine(ethers.id(name));
    if (registered.toLowerCase() !== expected.toLowerCase()) {
      throw new Error(`${name} registry mismatch: ${registered} != ${expected}`);
    }
    if (version !== engines[name].version) {
      throw new Error(`${name} version mismatch: ${version} != ${engines[name].version}`);
    }
    console.log(`${name}: ${registered} (${version})`);
  }

  console.log(`Live state verified for ${network.name} (${chainId})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
