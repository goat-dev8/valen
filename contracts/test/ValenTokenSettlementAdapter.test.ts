import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValenTokenSettlementAdapter", function () {
  async function fixture() {
    const [settlement, agent, target, stranger] = await ethers.getSigners();
    const token = await ethers.deployContract("MockERC20", ["USD Coin", "USDC"]);
    const adapter = await ethers.deployContract("ValenTokenSettlementAdapter", [
      await settlement.getAddress(),
    ]);
    await token.mint(await agent.getAddress(), 1_000_000n);
    await token.connect(agent).approve(await adapter.getAddress(), 1_000_000n);
    return { settlement, agent, target, stranger, token, adapter };
  }

  it("settles ERC-20 from agent to target when called by settlement", async function () {
    const { settlement, agent, target, token, adapter } = await fixture();
    const executionHash = ethers.id("execution-usdc-1");

    await expect(
      adapter
        .connect(settlement)
        .settleToken(
          executionHash,
          await token.getAddress(),
          await agent.getAddress(),
          await target.getAddress(),
          250_000n,
        ),
    )
      .to.emit(adapter, "TokenSettled")
      .withArgs(
        executionHash,
        await token.getAddress(),
        await agent.getAddress(),
        await target.getAddress(),
        250_000n,
      );

    expect(await token.balanceOf(await target.getAddress())).to.equal(250_000n);
    expect(await token.balanceOf(await agent.getAddress())).to.equal(750_000n);
  });

  it("rejects callers other than ValenSettlement", async function () {
    const { agent, target, stranger, token, adapter } = await fixture();

    await expect(
      adapter
        .connect(stranger)
        .settleToken(
          ethers.id("execution-usdc-2"),
          await token.getAddress(),
          await agent.getAddress(),
          await target.getAddress(),
          1n,
        ),
    ).to.be.revertedWithCustomError(adapter, "Unauthorized");
  });

  it("rejects duplicate execution hashes", async function () {
    const { settlement, agent, target, token, adapter } = await fixture();
    const executionHash = ethers.id("execution-usdc-3");
    const args = [
      executionHash,
      await token.getAddress(),
      await agent.getAddress(),
      await target.getAddress(),
      1n,
    ] as const;

    await adapter.connect(settlement).settleToken(...args);
    await expect(adapter.connect(settlement).settleToken(...args)).to.be.revertedWithCustomError(
      adapter,
      "SettlementAlreadyUsed",
    );
  });
});
