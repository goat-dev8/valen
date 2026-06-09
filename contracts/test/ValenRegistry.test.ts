import { expect } from "chai";
import { ethers } from "hardhat";
import { deployRegistry, deployTimelock, getSigners } from "./helpers/deploy";
import { CONTRACT_NAMES } from "./helpers/fixtures";

describe("ValenRegistry", function () {
  it("deploys via UUPS proxy and registers a contract", async function () {
    const { admin } = await getSigners();

    const timelock = await deployTimelock(admin, admin, admin);
    const timelockAddress = await timelock.getAddress();

    const registry = await deployRegistry(admin, timelockAddress);
    const registryAddress = await registry.getAddress();

    expect(registryAddress).to.be.properAddress;
    expect(await registry.getAddress()).to.equal(registryAddress);

    const [, , , registryManager] = await ethers.getSigners();
    const managerAddress = await registryManager.getAddress();
    const REGISTRY_MANAGER_ROLE = ethers.id("REGISTRY_MANAGER_ROLE");

    await registry.connect(await ethers.getSigner(admin)).grantRole(REGISTRY_MANAGER_ROLE, managerAddress);

    const version = "1.0.0";
    const stubAddress = timelockAddress;

    await expect(
      registry
        .connect(registryManager)
        .registerContract(CONTRACT_NAMES.SETTLEMENT, stubAddress, version),
    )
      .to.emit(registry, "ContractRegistered")
      .withArgs(CONTRACT_NAMES.SETTLEMENT, stubAddress, version);

    const [resolved, resolvedVersion] = await registry.getContract(CONTRACT_NAMES.SETTLEMENT);
    expect(resolved).to.equal(stubAddress);
    expect(resolvedVersion).to.equal(version);
  });

  it("rejects zero-address contract registration", async function () {
    const { admin } = await getSigners();
    const timelock = await deployTimelock(admin, admin, admin);
    const registry = await deployRegistry(admin, await timelock.getAddress());
    const REGISTRY_MANAGER_ROLE = ethers.id("REGISTRY_MANAGER_ROLE");

    const [, , , registryManager] = await ethers.getSigners();
    const managerAddress = await registryManager.getAddress();
    await registry.connect(await ethers.getSigner(admin)).grantRole(REGISTRY_MANAGER_ROLE, managerAddress);

    await expect(
      registry
        .connect(registryManager)
        .registerContract(CONTRACT_NAMES.SETTLEMENT, ethers.ZeroAddress, "1.0.0"),
    ).to.be.revertedWithCustomError(registry, "ZeroAddress");
  });
});
