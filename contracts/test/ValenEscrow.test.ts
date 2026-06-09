import { expect } from "chai";
import { ethers } from "hardhat";
import { deployRegistry, deployUUPS, getSigners } from "./helpers/deploy";

describe("ValenEscrow", function () {
  async function fixture() {
    const { admin, timelock } = await getSigners();
    const [, settlement, depositor, target] = await ethers.getSigners();
    const registry = await deployRegistry(admin, timelock);
    const escrow = await deployUUPS("ValenEscrow", "initialize", [
      await registry.getAddress(),
      await settlement.getAddress(),
      admin,
      timelock,
    ]);
    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
    await token.mint(await depositor.getAddress(), ethers.parseEther("10"));
    return { admin, settlement, depositor, target, escrow, token };
  }

  it("deposits, locks from settlement, and releases to target", async function () {
    const { settlement, depositor, target, escrow, token } = await fixture();
    const amount = ethers.parseEther("2");
    const executionHash = ethers.id("execution");

    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    await escrow.connect(depositor).deposit(await token.getAddress(), amount);

    expect(await escrow.balanceOf(await depositor.getAddress(), await token.getAddress())).to.equal(
      amount,
    );

    await escrow
      .connect(settlement)
      .lockForSettlement(
        executionHash,
        await depositor.getAddress(),
        await token.getAddress(),
        amount,
      );

    expect(await escrow.lockedBalance(executionHash)).to.equal(amount);
    await escrow.connect(settlement).releaseToTarget(executionHash, await target.getAddress());

    expect(await token.balanceOf(await target.getAddress())).to.equal(amount);
    expect(await escrow.lockedBalance(executionHash)).to.equal(0);
  });

  it("rejects lock attempts from non-settlement callers", async function () {
    const { depositor, escrow, token } = await fixture();

    await expect(
      escrow
        .connect(depositor)
        .lockForSettlement(
          ethers.id("execution"),
          await depositor.getAddress(),
          await token.getAddress(),
          1,
        ),
    ).to.be.revertedWithCustomError(escrow, "NotSettlement");
  });
});
