import { expect } from "chai";
import { ethers } from "hardhat";
import { deployRegistry, deployUUPS, getSigners } from "./helpers/deploy";
import { ROLE } from "./helpers/fixtures";

describe("ValenTreasury", function () {
  async function fixture() {
    const { admin, timelock } = await getSigners();
    const [, settlement, recipient] = await ethers.getSigners();
    const registry = await deployRegistry(admin, timelock);
    const treasury = await deployUUPS("ValenTreasury", "initialize", [
      await registry.getAddress(),
      admin,
      timelock,
    ]);
    await treasury
      .connect(await ethers.getSigner(admin))
      .setSettlementContract(await settlement.getAddress());
    return { admin, settlement, recipient, treasury };
  }

  it("calculates and accrues native fees from settlement only", async function () {
    const { admin, settlement, treasury } = await fixture();
    const actionHash = ethers.id("transfer");
    await treasury.connect(await ethers.getSigner(admin)).setFeeConfig(actionHash, 100);

    expect(await treasury.calculateFee(actionHash, ethers.parseEther("1"))).to.equal(
      ethers.parseEther("0.01"),
    );

    await expect(
      treasury.accrueFee(ethers.ZeroAddress, ethers.parseEther("0.01"), {
        value: ethers.parseEther("0.01"),
      }),
    ).to.be.revertedWithCustomError(treasury, "Unauthorized");

    await treasury
      .connect(settlement)
      .accrueFee(ethers.ZeroAddress, ethers.parseEther("0.01"), {
        value: ethers.parseEther("0.01"),
      });

    expect(await treasury.getAccruedFees(ethers.ZeroAddress)).to.equal(
      ethers.parseEther("0.01"),
    );
  });

  it("withdraws accrued fees through treasury role", async function () {
    const { admin, settlement, recipient, treasury } = await fixture();
    await treasury
      .connect(settlement)
      .accrueFee(ethers.ZeroAddress, ethers.parseEther("0.02"), {
        value: ethers.parseEther("0.02"),
      });

    expect(await treasury.hasRole(ROLE.TREASURY, admin)).to.equal(true);
    await expect(
      treasury
        .connect(await ethers.getSigner(admin))
        .withdrawFees(ethers.ZeroAddress, await recipient.getAddress(), ethers.parseEther("0.01")),
    ).to.changeEtherBalance(recipient, ethers.parseEther("0.01"));
  });
});
