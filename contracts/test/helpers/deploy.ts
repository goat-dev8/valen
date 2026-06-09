import { Contract } from "ethers";
import { ethers } from "hardhat";

export interface ValenTestAccounts {
  deployer: string;
  admin: string;
  timelock: string;
}

export async function getSigners(): Promise<ValenTestAccounts> {
  const [deployer, admin, timelock] = await ethers.getSigners();
  return {
    deployer: await deployer.getAddress(),
    admin: await admin.getAddress(),
    timelock: await timelock.getAddress(),
  };
}

export async function deployUUPS<T extends Contract>(
  implementationName: string,
  initMethod: string,
  initArgs: unknown[],
): Promise<T> {
  const Implementation = await ethers.getContractFactory(implementationName);
  const implementation = await Implementation.deploy();
  await implementation.waitForDeployment();

  const initData = Implementation.interface.encodeFunctionData(initMethod, initArgs);
  const Proxy = await ethers.getContractFactory("ValenERC1967Proxy");
  const proxy = await Proxy.deploy(await implementation.getAddress(), initData);
  await proxy.waitForDeployment();

  return Implementation.attach(await proxy.getAddress()) as T;
}

export async function deployTimelock(
  admin: string,
  proposer: string,
  executor: string,
  minDelay = 86_400,
): Promise<Contract> {
  const Timelock = await ethers.getContractFactory("ValenTimelock");
  const timelock = await Timelock.deploy(minDelay, [proposer], [executor], admin);
  await timelock.waitForDeployment();
  return timelock;
}

export async function deployRegistry(admin: string, timelock: string): Promise<Contract> {
  return deployUUPS("ValenRegistry", "initialize", [admin, timelock]);
}
