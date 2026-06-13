import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValenIdentityResolver", function () {
  it("stores ERC-8004-ready pending identity metadata", async function () {
    const [admin, owner] = await ethers.getSigners();
    const resolver = await ethers.deployContract("ValenIdentityResolver", [
      await admin.getAddress(),
    ]);
    const agentKey = ethers.id("agent-1");
    const metadataHash = ethers.id("metadata");

    await expect(
      resolver.bindIdentity(
        agentKey,
        ethers.ZeroAddress,
        0,
        await owner.getAddress(),
        "ipfs://pending-agent",
        metadataHash,
        false,
      ),
    ).to.emit(resolver, "IdentityBound");

    const record = await resolver.getIdentity(agentKey);
    expect(record.agentKey).to.equal(agentKey);
    expect(record.owner).to.equal(await owner.getAddress());
    expect(record.tokenUri).to.equal("ipfs://pending-agent");
    expect(record.metadataHash).to.equal(metadataHash);
    expect(record.registered).to.equal(false);
  });

  it("requires registry and owner for registered ERC-8004 identities", async function () {
    const [admin] = await ethers.getSigners();
    const resolver = await ethers.deployContract("ValenIdentityResolver", [
      await admin.getAddress(),
    ]);

    await expect(
      resolver.bindIdentity(
        ethers.id("agent-2"),
        ethers.ZeroAddress,
        1,
        ethers.ZeroAddress,
        "ipfs://registered-agent",
        ethers.id("metadata"),
        true,
      ),
    ).to.be.revertedWithCustomError(resolver, "ZeroAddress");
  });
});
