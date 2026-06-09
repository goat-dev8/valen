import { expect } from "chai";
import { ethers } from "hardhat";
import { deployRegistry, deployUUPS, getSigners } from "./helpers/deploy";
import { ROLE } from "./helpers/fixtures";

describe("ValenEmergencyGuardian", function () {
  async function fixture() {
    const { admin, timelock } = await getSigners();
    const registry = await deployRegistry(admin, timelock);
    const settlement = await deployUUPS("ValenSettlement", "initialize", [
      await registry.getAddress(),
      admin,
      timelock,
    ]);
    const policyManager = await deployUUPS("ValenPolicyManager", "initialize", [
      await registry.getAddress(),
      admin,
      timelock,
    ]);
    const mandateRegistry = await deployUUPS("ValenMandateRegistry", "initialize", [
      await registry.getAddress(),
      admin,
      timelock,
    ]);
    const Guardian = await ethers.getContractFactory("ValenEmergencyGuardian");
    const guardian = await Guardian.deploy();
    await guardian.initialize(
      await settlement.getAddress(),
      await mandateRegistry.getAddress(),
      await policyManager.getAddress(),
      admin,
    );
    await settlement
      .connect(await ethers.getSigner(admin))
      .grantRole(ROLE.EMERGENCY_GUARDIAN, await guardian.getAddress());
    return { admin, guardian, settlement };
  }

  it("rejects re-initialization", async function () {
    const { admin, guardian, settlement } = await fixture();
    await expect(
      guardian.initialize(await settlement.getAddress(), ethers.ZeroAddress, ethers.ZeroAddress, admin),
    ).to.be.revertedWithCustomError(guardian, "AlreadyExists");
  });

  it("requires governance approval ref for global unpause", async function () {
    const { admin, guardian } = await fixture();
    await guardian.connect(await ethers.getSigner(admin)).pauseGlobal(ethers.id("incident"));
    await expect(
      guardian
        .connect(await ethers.getSigner(admin))
        .requestUnpause(0, ethers.ZeroHash, ethers.ZeroHash),
    ).to.be.revertedWithCustomError(guardian, "InvalidInput");

    await guardian
      .connect(await ethers.getSigner(admin))
      .requestUnpause(0, ethers.ZeroHash, ethers.id("governance-approval"));
    expect(await guardian.isScopePaused(0, ethers.ZeroHash)).to.equal(false);
  });
});
