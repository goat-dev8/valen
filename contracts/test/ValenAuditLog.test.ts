import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValenAuditLog", function () {
  it("allows one-time initialization by admin only", async function () {
    const [deployer, admin] = await ethers.getSigners();
    const AuditLog = await ethers.getContractFactory("ValenAuditLog");
    const auditLog = await AuditLog.deploy();

    await auditLog.initialize(await admin.getAddress());
    await expect(auditLog.initialize(await deployer.getAddress())).to.be.revertedWithCustomError(
      auditLog,
      "AlreadyExists",
    );
  });

  it("records commitments only from authorized emitters", async function () {
    const [, admin, emitter, outsider] = await ethers.getSigners();
    const AuditLog = await ethers.getContractFactory("ValenAuditLog");
    const auditLog = await AuditLog.deploy();
    await auditLog.initialize(await admin.getAddress());

    const commitment = ethers.id("commitment-1");
    await expect(
      auditLog.connect(outsider).recordAuditCommitment(commitment, ethers.id("entity")),
    ).to.be.revertedWithCustomError(auditLog, "UnauthorizedEmitter");

    await auditLog
      .connect(admin)
      .authorizeEmitter(await emitter.getAddress(), true);
    await auditLog.connect(emitter).recordAuditCommitment(commitment, ethers.id("entity"));

    expect(await auditLog.commitmentExists(commitment)).to.equal(true);
    expect(await auditLog.commitmentEmitter(commitment)).to.equal(await emitter.getAddress());
  });
});
