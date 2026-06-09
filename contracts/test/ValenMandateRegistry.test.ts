import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployRegistry, deployUUPS, getSigners } from "./helpers/deploy";
import { ROLE } from "./helpers/fixtures";

describe("ValenMandateRegistry", function () {
  async function fixture() {
    const { admin, timelock } = await getSigners();
    const [, principal, agent, settlement] = await ethers.getSigners();
    const registry = await deployRegistry(admin, timelock);
    const mandateRegistry = await deployUUPS(
      "ValenMandateRegistry",
      "initialize",
      [await registry.getAddress(), admin, timelock],
    );
    await mandateRegistry
      .connect(await ethers.getSigner(admin))
      .setSettlementContract(await settlement.getAddress());
    return { admin, principal, agent, settlement, mandateRegistry };
  }

  it("binds mandate scope to allowed action and asset", async function () {
    const { admin, principal, agent, mandateRegistry } = await fixture();
    const scopeHash = ethers.id("transfer:eth");
    const actionHash = ethers.id("transfer");
    const asset = ethers.ZeroAddress;
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;

    await mandateRegistry.connect(await ethers.getSigner(admin)).allowScope(scopeHash);
    await mandateRegistry
      .connect(await ethers.getSigner(admin))
      .allowScopeBinding(scopeHash, asset, actionHash);

    const tx = await mandateRegistry
      .connect(await ethers.getSigner(admin))
      .grantMandate(
        await principal.getAddress(),
        await agent.getAddress(),
        scopeHash,
        now,
        now + 86_400,
        ethers.parseEther("1"),
        ethers.parseEther("10"),
      );
    const receipt = await tx.wait();
    const event = receipt!.logs
      .map((log) => {
        try {
          return mandateRegistry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "MandateGranted");
    const mandateId = event!.args.mandateId;

    await mandateRegistry.connect(await ethers.getSigner(admin)).activateMandate(mandateId);

    expect(
      await mandateRegistry.checkMandate(
        mandateId,
        await agent.getAddress(),
        asset,
        ethers.parseEther("0.5"),
        actionHash,
      ),
    ).to.equal(true);

    await expect(
      mandateRegistry.checkMandate(
        mandateId,
        await agent.getAddress(),
        asset,
        ethers.parseEther("0.5"),
        ethers.id("swap"),
      ),
    ).to.be.revertedWithCustomError(mandateRegistry, "InvalidScope");
  });

  it("enforces maxPerTx without treating it as a daily cap", async function () {
    const { admin, principal, agent, settlement, mandateRegistry } = await fixture();
    const scopeHash = ethers.id("transfer");
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;

    await mandateRegistry.connect(await ethers.getSigner(admin)).allowScope(scopeHash);
    const tx = await mandateRegistry
      .connect(await ethers.getSigner(admin))
      .grantMandate(
        await principal.getAddress(),
        await agent.getAddress(),
        scopeHash,
        now,
        now + 86_400,
        ethers.parseEther("1"),
        ethers.parseEther("3"),
      );
    const receipt = await tx.wait();
    const event = receipt!.logs
      .map((log) => {
        try {
          return mandateRegistry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "MandateGranted");
    const mandateId = event!.args.mandateId;

    await mandateRegistry.connect(await ethers.getSigner(admin)).activateMandate(mandateId);
    await mandateRegistry
      .connect(settlement)
      .recordExecution(mandateId, ethers.parseEther("1"), ethers.id("exec-1"));
    await mandateRegistry
      .connect(settlement)
      .recordExecution(mandateId, ethers.parseEther("1"), ethers.id("exec-2"));

    await expect(
      mandateRegistry
        .connect(settlement)
        .recordExecution(mandateId, ethers.parseEther("1.1"), ethers.id("exec-3")),
    ).to.be.revertedWithCustomError(mandateRegistry, "CapExceeded");

    await network.provider.send("evm_mine");
    expect(await mandateRegistry.hasRole(ROLE.MANDATE_MANAGER, admin)).to.equal(true);
  });
});
