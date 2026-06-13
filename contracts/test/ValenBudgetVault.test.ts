import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValenBudgetVault", function () {
  async function fixture() {
    const [admin, settlement, stranger] = await ethers.getSigners();
    const token = await ethers.deployContract("MockERC20", ["USD Coin", "USDC"]);
    const vault = await ethers.deployContract("ValenBudgetVault", [
      await admin.getAddress(),
      await settlement.getAddress(),
      await token.getAddress(),
      ethers.id("agent"),
      1_000_000n,
      86_400,
    ]);
    await token.mint(await admin.getAddress(), 2_000_000n);
    await token.approve(await vault.getAddress(), 2_000_000n);
    return { admin, settlement, stranger, token, vault };
  }

  it("accepts topups and commits spend", async function () {
    const { settlement, vault } = await fixture();
    await expect(vault.topUp(1_000_000n, 1_000_000n)).to.emit(vault, "BudgetTopUp");
    await expect(vault.connect(settlement).commitSpend(ethers.id("exec-1"), 250_000n)).to.emit(
      vault,
      "BudgetSpend",
    );
    expect(await vault.spent()).to.equal(250_000n);
    expect(await vault.remaining()).to.equal(750_000n);
  });

  it("rejects unauthorized settlement commits", async function () {
    const { stranger, vault } = await fixture();
    await expect(vault.connect(stranger).commitSpend(ethers.id("exec-2"), 1n)).to.be.reverted;
  });

  it("refuses spend over cap", async function () {
    const { settlement, vault } = await fixture();
    await vault.topUp(1_000_000n, 1_000_000n);
    await expect(vault.connect(settlement).commitSpend(ethers.id("exec-3"), 1_000_001n)).to.be.revertedWithCustomError(
      vault,
      "CapExceeded",
    );
  });
});
