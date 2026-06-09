import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";
import {
  bindResultHash,
  COMPLIANCE_RULE_HASH,
  ELIGIBILITY_ROOT_HASH,
  ENGINE_VERSION,
  RISK_MODEL_HASH,
} from "./lib/engine-constants";

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const engines = JSON.parse(
    readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"),
  );

  const settlementAddr = deployment.contracts.ValenSettlement.address;
  const registry = await ethers.getContractAt(
    "ValenRegistry",
    deployment.contracts.ValenRegistry.address,
  );
  const [deployer] = await ethers.getSigners();
  const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);

  for (const name of [
    "ComplianceEngine",
    "RiskEngine",
    "EligibilityEngine",
    "PolicyEngine",
  ]) {
    const [addr] = await registry.getEngine(ethers.id(name));
    console.log(`registry ${name}: ${addr} (deployed ${engines[name].address})`);
  }

  const executionHash = ethers.id(`probe-${Date.now()}`);
  const ORG_KEY = ethers.id("valen-org-e2e");
  const MANDATE_ID = ethers.id("valen-mandate-e2e");
  const MANDATE_STATUS_HASH = ethers.id("mandate-active");
  const MANDATE_SCOPE_HASH = ethers.id("scope-transfer");
  const ACTION_TYPE = ethers.id("transfer");
  const PRINCIPAL_HASH = ethers.id("principal-e2e");
  const POLICY_HASH = ethers.id("valen-policy-v1");
  const attestationHash = ethers.id("attestation-e2e");
  const historicalSummaryHash = ethers.id("historical-summary-e2e");
  const externalRiskAttestationHash = ethers.id("external-risk-e2e");
  const eligibilityAttestationHash = ethers.id("eligibility-attestation-e2e");
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

  const eligibilityResultHash = bindResultHash(ENGINE_VERSION, ELIGIBILITY_ROOT_HASH, [
    PRINCIPAL_HASH,
    MANDATE_SCOPE_HASH,
    eligibilityAttestationHash,
    ELIGIBILITY_ROOT_HASH,
  ]);

  const complianceHash = bindResultHash(ENGINE_VERSION, COMPLIANCE_RULE_HASH, [
    executionHash,
    PRINCIPAL_HASH,
    COMPLIANCE_RULE_HASH,
    MANDATE_STATUS_HASH,
    eligibilityResultHash,
  ]);

  const riskHash = bindResultHash(ENGINE_VERSION, RISK_MODEL_HASH, [
    executionHash,
    historicalSummaryHash,
    externalRiskAttestationHash,
    ethers.zeroPadValue(ethers.toBeHex(10), 32),
  ]);

  const policyFacts = {
    complianceHash,
    riskHash,
    policyVersionHash: POLICY_HASH,
    mandateScopeHash: MANDATE_SCOPE_HASH,
    timeBucket: now,
  };

  const compliance = await ethers.getContractAt(
    "IComplianceEngine",
    engines.ComplianceEngine.address,
  );
  const risk = await ethers.getContractAt("IRiskEngine", engines.RiskEngine.address);
  const eligibility = await ethers.getContractAt(
    "IEligibilityEngine",
    engines.EligibilityEngine.address,
  );
  const policy = await ethers.getContractAt("IPolicyEngine", engines.PolicyEngine.address);

  const iface = compliance.interface;
  const probes = [
    {
      name: "compliance",
      data: iface.encodeFunctionData("evaluate", [
        intent,
        complianceContext,
        MANDATE_STATUS_HASH,
        eligibilityResultHash,
      ]),
      target: engines.ComplianceEngine.address,
    },
    {
      name: "eligibility",
      data: eligibility.interface.encodeFunctionData("check", [
        PRINCIPAL_HASH,
        deployer.address,
        intent.asset,
        deployer.address,
        MANDATE_SCOPE_HASH,
        eligibilityAttestationHash,
        eligibilityExpiry,
      ]),
      target: engines.EligibilityEngine.address,
    },
    {
      name: "risk",
      data: risk.interface.encodeFunctionData("calculate", [
        intent,
        riskFactors,
        historicalSummaryHash,
        externalRiskAttestationHash,
        externalRiskExpiry,
      ]),
      target: engines.RiskEngine.address,
    },
    {
      name: "policy",
      data: policy.interface.encodeFunctionData("evaluate", [
        intent,
        policyFacts,
        0,
        10,
        [ethers.id("rule-commitment-e2e")],
      ]),
      target: engines.PolicyEngine.address,
    },
  ];

  for (const probe of probes) {
    try {
      const raw = await ethers.provider.call({
        to: probe.target,
        from: settlementAddr,
        data: probe.data,
      });
      if (probe.name === "compliance") {
        const decoded = compliance.interface.decodeFunctionResult("evaluate", raw);
        console.log(probe.name, decoded[0].resultHash, decoded[1]);
      } else if (probe.name === "eligibility") {
        const decoded = eligibility.interface.decodeFunctionResult("check", raw);
        console.log(probe.name, decoded[0].verdict.resultHash, decoded[0].verdict.status);
      } else if (probe.name === "risk") {
        const decoded = risk.interface.decodeFunctionResult("calculate", raw);
        console.log(probe.name, decoded[0].resultHash, decoded[0].score, decoded[0].verdict.status);
      } else if (probe.name === "policy") {
        const decoded = policy.interface.decodeFunctionResult("evaluate", raw);
        console.log(probe.name, decoded[0].verdict.resultHash, decoded[0].verdict.status);
      } else {
        console.log(probe.name, "ok", raw.slice(0, 66));
      }
    } catch (error: unknown) {
      const err = error as { data?: string; shortMessage?: string; message?: string };
      console.log(probe.name, "fail", err.shortMessage ?? err.message, err.data);
    }
  }

  console.log("expected complianceHash", complianceHash);
  console.log("expected riskHash", riskHash);
  console.log("expected eligibilityResultHash", eligibilityResultHash);
}

main();
