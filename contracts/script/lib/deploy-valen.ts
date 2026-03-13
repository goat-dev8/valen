import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

type DeploymentRecord = {
  network: string;
  chainId: string;
  deployer: string;
  timestamp: string;
  contracts: Record<string, { address: string; txHash?: string; implementation?: string }>;
};

async function deployImplementation(name: string) {
  const Factory = await ethers.getContractFactory(name);
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  return contract;
}

async function deployProxy(name: string, initMethod: string, initArgs: unknown[]) {
  const implementation = await deployImplementation(name);
  const Factory = await ethers.getContractFactory(name);
  const initData = Factory.interface.encodeFunctionData(initMethod, initArgs);
  const Proxy = await ethers.getContractFactory("ValenERC1967Proxy");
  const proxy = await Proxy.deploy(await implementation.getAddress(), initData);
  await proxy.waitForDeployment();
  return {
    contract: Factory.attach(await proxy.getAddress()),
    proxy,
    implementation,
  };
}

export async function deployValen(): Promise<DeploymentRecord> {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const net = await ethers.provider.getNetwork();

  const Timelock = await ethers.getContractFactory("ValenTimelock");
  const timelock = await Timelock.deploy(86_400, [deployerAddress], [deployerAddress], deployerAddress);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();

  const registry = await deployProxy("ValenRegistry", "initialize", [deployerAddress, timelockAddress]);
  const registryAddress = await registry.contract.getAddress();

  const policyManager = await deployProxy("ValenPolicyManager", "initialize", [
    registryAddress,
    deployerAddress,
    timelockAddress,
  ]);
  const mandateRegistry = await deployProxy("ValenMandateRegistry", "initialize", [
    registryAddress,
    deployerAddress,
    timelockAddress,
  ]);
  const settlement = await deployProxy("ValenSettlement", "initialize", [
    registryAddress,
    deployerAddress,
    timelockAddress,
  ]);
  const treasury = await deployProxy("ValenTreasury", "initialize", [
    registryAddress,
    deployerAddress,
    timelockAddress,
  ]);
  const escrow = await deployProxy("ValenEscrow", "initialize", [
    registryAddress,
    await settlement.contract.getAddress(),
    deployerAddress,
    timelockAddress,
  ]);
  const governance = await deployProxy("ValenGovernance", "initialize", [
    timelockAddress,
    deployerAddress,
    deployerAddress,
  ]);

  const AuditLog = await ethers.getContractFactory("ValenAuditLog");
  const auditLog = await AuditLog.deploy();
  await auditLog.waitForDeployment();
  await auditLog.initialize(deployerAddress);

  const Guardian = await ethers.getContractFactory("ValenEmergencyGuardian");
  const guardian = await Guardian.deploy();
  await guardian.waitForDeployment();
  await guardian.initialize(
    await settlement.contract.getAddress(),
    await mandateRegistry.contract.getAddress(),
    await policyManager.contract.getAddress(),
    deployerAddress,
  );

  await settlement.contract.setMandateRegistry(await mandateRegistry.contract.getAddress());
  await settlement.contract.setPolicyManager(await policyManager.contract.getAddress());
  await settlement.contract.setAuditLog(await auditLog.getAddress());
  await settlement.contract.setTreasury(await treasury.contract.getAddress());
  await settlement.contract.setEscrow(await escrow.contract.getAddress());
  await mandateRegistry.contract.setSettlementContract(await settlement.contract.getAddress());
  await treasury.contract.setSettlementContract(await settlement.contract.getAddress());
  await auditLog.authorizeEmitter(await settlement.contract.getAddress(), true);

  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const governanceAddress = await governance.contract.getAddress();
  if (!(await timelock.hasRole(proposerRole, governanceAddress))) {
    await timelock.grantRole(proposerRole, governanceAddress);
  }
  if (!(await timelock.hasRole(executorRole, governanceAddress))) {
    await timelock.grantRole(executorRole, governanceAddress);
  }

  const record: DeploymentRecord = {
    network: network.name,
    chainId: net.chainId.toString(),
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {
      ValenTimelock: { address: timelockAddress },
      ValenRegistry: {
        address: await registry.contract.getAddress(),
        implementation: await registry.implementation.getAddress(),
      },
      ValenPolicyManager: {
        address: await policyManager.contract.getAddress(),
        implementation: await policyManager.implementation.getAddress(),
      },
      ValenMandateRegistry: {
        address: await mandateRegistry.contract.getAddress(),
        implementation: await mandateRegistry.implementation.getAddress(),
      },
      ValenSettlement: {
        address: await settlement.contract.getAddress(),
        implementation: await settlement.implementation.getAddress(),
      },
      ValenTreasury: {
        address: await treasury.contract.getAddress(),
        implementation: await treasury.implementation.getAddress(),
      },
      ValenEscrow: {
        address: await escrow.contract.getAddress(),
        implementation: await escrow.implementation.getAddress(),
      },
      ValenGovernance: {
        address: await governance.contract.getAddress(),
        implementation: await governance.implementation.getAddress(),
      },
      ValenAuditLog: { address: await auditLog.getAddress() },
      ValenEmergencyGuardian: { address: await guardian.getAddress() },
    },
  };

  const outDir = join("deployments", network.name);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "deployment.json"), JSON.stringify(record, null, 2));
  return record;
}
