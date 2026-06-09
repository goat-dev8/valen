import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployTimelock, deployUUPS, getSigners } from "./helpers/deploy";

describe("ValenGovernance", function () {
  async function fixture() {
    const { admin } = await getSigners();
    const [, governanceSafe, target] = await ethers.getSigners();
    const timelock = await deployTimelock(admin, admin, admin, 1);
    const governance = await deployUUPS("ValenGovernance", "initialize", [
      await timelock.getAddress(),
      await governanceSafe.getAddress(),
      admin,
    ]);
    const timelockSigner = await ethers.getSigner(admin);
    await timelock
      .connect(timelockSigner)
      .grantRole(await timelock.PROPOSER_ROLE(), await governance.getAddress());
    await timelock
      .connect(timelockSigner)
      .grantRole(await timelock.EXECUTOR_ROLE(), await governance.getAddress());
    return { admin, target, timelock, governance };
  }

  it("registers proposals once", async function () {
    const { admin, governance } = await fixture();
    const proposalHash = ethers.id("proposal");
    const metadataHash = ethers.id("metadata");

    await expect(
      governance
        .connect(await ethers.getSigner(admin))
        .registerProposal(proposalHash, metadataHash),
    )
      .to.emit(governance, "ProposalRegistered")
      .withArgs(proposalHash, metadataHash);

    await expect(
      governance
        .connect(await ethers.getSigner(admin))
        .registerProposal(proposalHash, metadataHash),
    ).to.be.revertedWithCustomError(governance, "AlreadyExists");
  });

  it("queues and executes through the configured timelock", async function () {
    const { admin, target, timelock, governance } = await fixture();
    const signer = await ethers.getSigner(admin);
    const targetAddress = await target.getAddress();
    const value = 0;
    const data = "0x";
    const predecessor = ethers.ZeroHash;
    const salt = ethers.id("queue-action");
    const operationId = await timelock.hashOperation(
      targetAddress,
      value,
      data,
      predecessor,
      salt,
    );

    await expect(
      governance
        .connect(signer)
        .queueAction(targetAddress, value, data, predecessor, salt, 1),
    )
      .to.emit(governance, "ActionQueued")
      .withArgs(operationId);
    expect(await governance.isActionQueued(operationId)).to.equal(true);

    await network.provider.send("evm_increaseTime", [2]);
    await network.provider.send("evm_mine");

    await expect(
      governance.connect(signer).executeAction(targetAddress, value, data, predecessor, salt),
    )
      .to.emit(governance, "ActionExecuted")
      .withArgs(operationId);
    expect(await governance.isActionQueued(operationId)).to.equal(false);
  });
});
