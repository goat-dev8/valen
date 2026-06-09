import { expect } from "chai";
import { ethers } from "hardhat";
import { deployRegistry, deployUUPS, getSigners } from "./helpers/deploy";

describe("ValenSettlement", function () {
  async function fixture() {
    const { admin, timelock } = await getSigners();
    const registry = await deployRegistry(admin, timelock);
    const settlement = await deployUUPS("ValenSettlement", "initialize", [
      await registry.getAddress(),
      admin,
      timelock,
    ]);
    return { admin, settlement };
  }

  it("rejects zero-address linked contract setters", async function () {
    const { admin, settlement } = await fixture();
    const signer = await ethers.getSigner(admin);

    await expect(settlement.connect(signer).setMandateRegistry(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(settlement, "ZeroAddress");
    await expect(settlement.connect(signer).setPolicyManager(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(settlement, "ZeroAddress");
    await expect(settlement.connect(signer).setAuditLog(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(settlement, "ZeroAddress");
    await expect(settlement.connect(signer).setTreasury(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(settlement, "ZeroAddress");
    await expect(settlement.connect(signer).setEscrow(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(settlement, "ZeroAddress");
  });

  it("enforces global settlement pause before engine validation", async function () {
    const { admin, settlement } = await fixture();
    const signer = await ethers.getSigner(admin);
    const zero32 = ethers.ZeroHash;
    const one32 = ethers.id("one");
    const intent = {
      executionHash: one32,
      organizationHash: ethers.id("org"),
      agent: admin,
      mandateId: zero32,
      actionType: ethers.id("transfer"),
      targetChainId: 31337,
      target: admin,
      asset: ethers.ZeroAddress,
      amount: 0,
    };
    const complianceContext = {
      principalHash: one32,
      jurisdictionHash: one32,
      counterparty: admin,
      attestationHashes: [],
      attestationExpiries: [],
    };
    const riskFactors = {
      amountFactor: 0,
      assetFactor: 0,
      counterpartyFactor: 0,
      velocityFactor: 0,
      mandateUsageFactor: 0,
      anomalyFactor: 0,
    };
    const policyFacts = {
      complianceHash: one32,
      riskHash: one32,
      policyVersionHash: one32,
      mandateScopeHash: one32,
      timeBucket: 1,
    };

    await settlement.connect(signer).pauseScope(0, zero32);

    await expect(
      settlement
        .connect(signer)
        .submitSettlement(
          intent,
          complianceContext,
          riskFactors,
          policyFacts,
          [],
          one32,
          one32,
          one32,
          one32,
          0,
          one32,
          0,
          "0x",
        ),
    ).to.be.revertedWithCustomError(settlement, "EnforcedPause");
  });
});
