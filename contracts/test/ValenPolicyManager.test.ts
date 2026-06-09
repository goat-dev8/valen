import { expect } from "chai";
import { ethers } from "hardhat";
import { deployRegistry, deployUUPS, getSigners } from "./helpers/deploy";

describe("ValenPolicyManager", function () {
  async function fixture() {
    const { admin, timelock } = await getSigners();
    const registry = await deployRegistry(admin, timelock);
    const policyManager = await deployUUPS("ValenPolicyManager", "initialize", [
      await registry.getAddress(),
      admin,
      timelock,
    ]);
    return { admin, policyManager };
  }

  it("publishes and activates policy hashes by organization and policy id", async function () {
    const { admin, policyManager } = await fixture();
    const orgKey = ethers.id("org");
    const policyId = ethers.id("policy");
    const policyHash = ethers.id("policy-v1");

    await policyManager
      .connect(await ethers.getSigner(admin))
      .publishPolicy(orgKey, policyId, policyHash);
    await expect(
      policyManager
        .connect(await ethers.getSigner(admin))
        .activatePolicy(orgKey, policyId, policyHash),
    ).to.emit(policyManager, "PolicyActivated");

    expect(await policyManager.getActivePolicyHash(orgKey, policyId)).to.equal(policyHash);
    expect(await policyManager.isPolicyActive(policyHash)).to.equal(true);
  });

  it("blocks activation for frozen policies", async function () {
    const { admin, policyManager } = await fixture();
    const signer = await ethers.getSigner(admin);
    const orgKey = ethers.id("org");
    const policyId = ethers.id("policy");
    const policyHash = ethers.id("policy-v1");

    await policyManager.connect(signer).publishPolicy(orgKey, policyId, policyHash);
    await policyManager.connect(signer).freezePolicy(policyHash);

    await expect(
      policyManager.connect(signer).activatePolicy(orgKey, policyId, policyHash),
    ).to.be.revertedWithCustomError(policyManager, "PolicyFrozen");
  });

  it("rejects activation before publication", async function () {
    const { admin, policyManager } = await fixture();

    await expect(
      policyManager
        .connect(await ethers.getSigner(admin))
        .activatePolicy(ethers.id("org"), ethers.id("policy"), ethers.id("policy-v1")),
    ).to.be.revertedWithCustomError(policyManager, "PolicyNotPublished");
  });
});
