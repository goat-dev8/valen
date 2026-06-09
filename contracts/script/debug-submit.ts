import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";
import { COMPLIANCE_RULE_HASH } from "./lib/engine-constants";

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const engines = JSON.parse(
    readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"),
  );
  const [deployer] = await ethers.getSigners();
  const settlementAddr = deployment.contracts.ValenSettlement.address;
  const settlement = await ethers.getContractAt("ValenSettlement", settlementAddr);

  const complianceEngine = await ethers.getContractAt(
    "IComplianceEngine",
    engines.ComplianceEngine.address,
  );
  const riskEngine = await ethers.getContractAt("IRiskEngine", engines.RiskEngine.address);
  const eligibilityEngine = await ethers.getContractAt(
    "IEligibilityEngine",
    engines.EligibilityEngine.address,
  );

  const POLICY_HASH = ethers.id("valen-policy-v1");
  const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
  const executionHash = ethers.id(`debug-submit-${Date.now()}`);
  const ORG_KEY = ethers.id("valen-org-e2e");
  const MANDATE_ID = ethers.id("valen-mandate-e2e");
  const MANDATE_STATUS_HASH = ethers.id("mandate-active");
  const MANDATE_SCOPE_HASH = ethers.id("scope-transfer");
  const ACTION_TYPE = ethers.id("transfer");
  const PRINCIPAL_HASH = ethers.id("principal-e2e");
  const attestationHash = ethers.id("attestation-e2e");
  const historicalSummaryHash = ethers.id("historical-summary-e2e");
  const externalRiskAttestationHash = ethers.id("external-risk-e2e");
  const eligibilityAttestationHash = ethers.id("eligibility-attestation-e2e");
  const ruleCommitment = ethers.id("rule-commitment-e2e");
  const attestationExpiry = now + 3600n;
  const externalRiskExpiry = now + 3600n;
  const eligibilityExpiry = now + 3600n;

  const intent = {
    executionHash,
    organizationHash: ORG_KEY,
    agent: deployer.address,
    mandateId: MANDATE_ID,
    actionType: ACTION_TYPE,
    targetChainId: BigInt(deployment.chainId),
    target: deployer.address,
    asset: "0x0000000000000000000000000000000000000001",
    amount: ethers.parseEther("0.001"),
  };
  const complianceContext = {
    principalHash: PRINCIPAL_HASH,
    jurisdictionHash: COMPLIANCE_RULE_HASH,
    counterparty: deployer.address,
    attestationHashes: [attestationHash],
    attestationExpiries: [attestationExpiry],
  };
  const riskFactors = {
    amountFactor: 10,
    assetFactor: 10,
    counterpartyFactor: 10,
    velocityFactor: 10,
    mandateUsageFactor: 10,
    anomalyFactor: 10,
  };

  const eligibilityRaw = await ethers.provider.call({
    to: engines.EligibilityEngine.address,
    from: settlementAddr,
    data: eligibilityEngine.interface.encodeFunctionData("check", [
      PRINCIPAL_HASH,
      deployer.address,
      intent.asset,
      deployer.address,
      MANDATE_SCOPE_HASH,
      eligibilityAttestationHash,
      eligibilityExpiry,
    ]),
  });
  const eligibilityResultHash = eligibilityEngine.interface.decodeFunctionResult(
    "check",
    eligibilityRaw,
  )[0].verdict.resultHash;

  const complianceRaw = await ethers.provider.call({
    to: engines.ComplianceEngine.address,
    from: settlementAddr,
    data: complianceEngine.interface.encodeFunctionData("evaluate", [
      intent,
      complianceContext,
      MANDATE_STATUS_HASH,
      eligibilityResultHash,
    ]),
  });
  const complianceHash = complianceEngine.interface.decodeFunctionResult(
    "evaluate",
    complianceRaw,
  )[0].resultHash;

  const riskRaw = await ethers.provider.call({
    to: engines.RiskEngine.address,
    from: settlementAddr,
    data: riskEngine.interface.encodeFunctionData("calculate", [
      intent,
      riskFactors,
      historicalSummaryHash,
      externalRiskAttestationHash,
      externalRiskExpiry,
    ]),
  });
  const riskVerdict = riskEngine.interface.decodeFunctionResult("calculate", riskRaw)[0];

  const args = [
    intent,
    complianceContext,
    riskFactors,
    {
      complianceHash,
      riskHash: riskVerdict.resultHash,
      policyVersionHash: POLICY_HASH,
      mandateScopeHash: MANDATE_SCOPE_HASH,
      timeBucket: now,
    },
    [ruleCommitment],
    MANDATE_STATUS_HASH,
    eligibilityResultHash,
    historicalSummaryHash,
    externalRiskAttestationHash,
    externalRiskExpiry,
    eligibilityAttestationHash,
    eligibilityExpiry,
    "0x",
  ] as const;

  try {
    await settlement.submitSettlement.staticCall(...args);
    console.log("staticCall ok");
    const tx = await settlement.submitSettlement(...args);
    await tx.wait();
    console.log("submit ok", tx.hash);
  } catch (error: unknown) {
    const err = error as { data?: string; shortMessage?: string; message?: string };
    console.log("fail", err.shortMessage ?? err.message);
    console.log("data", err.data);
  }
}

main();
