import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";
import {
  COMPLIANCE_RULE_HASH,
  ELIGIBILITY_ROOT_HASH,
  ENGINE_VERSION,
  RISK_MODEL_HASH,
} from "./lib/engine-constants";

type StepResult = {
  step: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  txHash?: string;
};

const POLICY_HASH = ethers.id("valen-policy-v1");
const ORG_KEY = ethers.id("valen-org-e2e");
const POLICY_ID = ethers.id("valen-policy-id-e2e");
const MANDATE_STATUS_HASH = ethers.id("mandate-active");
const MANDATE_SCOPE_HASH = ethers.id("scope-transfer");
const ACTION_TYPE = ethers.id("transfer");
const PRINCIPAL_HASH = ethers.id("principal-e2e");

async function main(): Promise<void> {
  const steps: StepResult[] = [];
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const engines = JSON.parse(
    readFileSync(join("..", "stylus", "deployments", network.name, "engines.json"), "utf8"),
  );

  const [deployer] = await ethers.getSigners();
  const settlementAddr = deployment.contracts.ValenSettlement.address;
  const registry = await ethers.getContractAt(
    "ValenRegistry",
    deployment.contracts.ValenRegistry.address,
  );
  const policyManager = await ethers.getContractAt(
    "ValenPolicyManager",
    deployment.contracts.ValenPolicyManager.address,
  );
  const settlement = await ethers.getContractAt("ValenSettlement", settlementAddr);
  const auditLog = await ethers.getContractAt(
    "ValenAuditLog",
    deployment.contracts.ValenAuditLog.address,
  );

  // Register engines if needed
  for (const name of [
    "ComplianceEngine",
    "RiskEngine",
    "EligibilityEngine",
    "PolicyEngine",
  ]) {
    const engine = engines[name];
    const nameHash = ethers.id(name);
    let current = ethers.ZeroAddress;
    try {
      [current] = await registry.getEngine(nameHash);
    } catch {
      current = ethers.ZeroAddress;
    }
    if (current.toLowerCase() === engine.address.toLowerCase()) {
      steps.push({
        step: `Registry.${name}`,
        status: "skip",
        detail: `Already registered at ${engine.address}`,
      });
      continue;
    }
    const tx = await registry.registerEngine(nameHash, engine.address, engine.version);
    await tx.wait();
    steps.push({
      step: `Registry.${name}`,
      status: "pass",
      detail: `Registered ${engine.address}`,
      txHash: tx.hash,
    });
  }

  // Initialize engines
  const initSpecs = [
    {
      name: "ComplianceEngine",
      iface: ["function initialize(bytes32,address,bytes32,uint32,bytes32)", "function getEngineVersion() view returns (bytes32)"],
      args: [ENGINE_VERSION, settlementAddr, COMPLIANCE_RULE_HASH, 8, ethers.ZeroHash],
    },
    {
      name: "RiskEngine",
      iface: ["function initialize(bytes32,address,bytes32,uint16,uint16,uint16,uint16)", "function getEngineVersion() view returns (bytes32)"],
      args: [ENGINE_VERSION, settlementAddr, RISK_MODEL_HASH, 25, 50, 75, 6],
    },
    {
      name: "EligibilityEngine",
      iface: ["function initialize(bytes32,address,bytes32,uint32)", "function getEngineVersion() view returns (bytes32)"],
      args: [ENGINE_VERSION, settlementAddr, ELIGIBILITY_ROOT_HASH, 8],
    },
    {
      name: "PolicyEngine",
      iface: ["function initialize(bytes32,address,bytes32,uint32,uint32)", "function getEngineVersion() view returns (bytes32)"],
      args: [ENGINE_VERSION, settlementAddr, POLICY_HASH, 16, 4],
    },
  ] as const;

  for (const spec of initSpecs) {
    const engine = engines[spec.name];
    const contract = new ethers.Contract(engine.address, spec.iface, deployer);
    try {
      const tx = await contract.initialize(...spec.args);
      await tx.wait();
      steps.push({ step: `Init.${spec.name}`, status: "pass", detail: engine.address, txHash: tx.hash });
    } catch (error: unknown) {
      const err = error as { data?: string; shortMessage?: string; message?: string };
      const data = err.data ?? "";
      if (data.startsWith("0x9d59e11a") && data.endsWith("00000003")) {
        steps.push({ step: `Init.${spec.name}`, status: "skip", detail: "Already initialized" });
        continue;
      }
      const message = err.shortMessage ?? err.message ?? String(error);
      steps.push({ step: `Init.${spec.name}`, status: "fail", detail: message });
      throw error;
    }
  }

  const MANDATE_SCOPE_HASH = ethers.id("scope-transfer");
  const ACTION_TYPE = ethers.id("transfer");
  const PRINCIPAL_HASH = ethers.id("principal-e2e");
  const asset = "0x0000000000000000000000000000000000000001";

  const mandateRegistry = await ethers.getContractAt(
    "ValenMandateRegistry",
    deployment.contracts.ValenMandateRegistry.address,
  );

  let mandateId = ethers.id("valen-mandate-e2e");
  try {
    await mandateRegistry.checkMandate.staticCall(
      mandateId,
      deployer.address,
      asset,
      ethers.parseEther("0.001"),
      ACTION_TYPE,
    );
    steps.push({ step: "Mandate.setup", status: "skip", detail: "Existing mandate usable" });
  } catch {
    let tx = await mandateRegistry.allowScope(MANDATE_SCOPE_HASH);
    await tx.wait();
    tx = await mandateRegistry.allowScopeBinding(MANDATE_SCOPE_HASH, asset, ACTION_TYPE);
    await tx.wait();
    const nowTs = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
    tx = await mandateRegistry.grantMandate(
      deployer.address,
      deployer.address,
      MANDATE_SCOPE_HASH,
      nowTs,
      nowTs + 86400n,
      ethers.parseEther("1"),
      ethers.parseEther("10"),
    );
    const receipt = await tx.wait();
    const granted = receipt?.logs
      .map((log) => {
        try {
          return mandateRegistry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === "MandateGranted");
    mandateId = granted?.args?.mandateId ?? mandateId;
    tx = await mandateRegistry.activateMandate(mandateId);
    await tx.wait();
    steps.push({ step: "Mandate.setup", status: "pass", detail: mandateId, txHash: tx.hash });
  }

  // Policy lifecycle
  if (!(await policyManager.isPolicyActive(POLICY_HASH))) {
    let tx = await policyManager.publishPolicy(ORG_KEY, POLICY_ID, POLICY_HASH);
    await tx.wait();
    tx = await policyManager.activatePolicy(ORG_KEY, POLICY_ID, POLICY_HASH);
    await tx.wait();
    steps.push({ step: "Policy.activate", status: "pass", detail: POLICY_HASH, txHash: tx.hash });
  } else {
    steps.push({ step: "Policy.activate", status: "skip", detail: "Policy already active" });
  }

  const complianceEngine = await ethers.getContractAt(
    "IComplianceEngine",
    engines.ComplianceEngine.address,
  );
  const riskEngine = await ethers.getContractAt("IRiskEngine", engines.RiskEngine.address);
  const eligibilityEngine = await ethers.getContractAt(
    "IEligibilityEngine",
    engines.EligibilityEngine.address,
  );
  const policyEngine = await ethers.getContractAt("IPolicyEngine", engines.PolicyEngine.address);

  const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
  const attestationExpiry = now + 3600n;
  const externalRiskExpiry = now + 3600n;
  const eligibilityExpiry = now + 3600n;

  const executionHash = ethers.id(`execution-${network.name}-${Date.now()}`);
  const counterparty = deployer.address;
  const agent = deployer.address;
  const target = deployer.address;
  const amount = ethers.parseEther("0.001");
  const attestationHash = ethers.id("attestation-e2e");
  const historicalSummaryHash = ethers.id("historical-summary-e2e");
  const externalRiskAttestationHash = ethers.id("external-risk-e2e");
  const eligibilityAttestationHash = ethers.id("eligibility-attestation-e2e");
  const ruleCommitment = ethers.id("rule-commitment-e2e");

  const intent = {
    executionHash,
    organizationHash: ORG_KEY,
    agent,
    mandateId: mandateId,
    actionType: ACTION_TYPE,
    targetChainId: BigInt(deployment.chainId),
    target,
    asset,
    amount,
  };

  const complianceContext = {
    principalHash: PRINCIPAL_HASH,
    jurisdictionHash: COMPLIANCE_RULE_HASH,
    counterparty,
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
      agent,
      asset,
      counterparty,
      MANDATE_SCOPE_HASH,
      eligibilityAttestationHash,
      eligibilityExpiry,
    ]),
  });
  const eligibilityVerdict = eligibilityEngine.interface.decodeFunctionResult(
    "check",
    eligibilityRaw,
  )[0];
  const eligibilityResultHash = eligibilityVerdict.verdict.resultHash;

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
  const complianceVerdict = complianceEngine.interface.decodeFunctionResult(
    "evaluate",
    complianceRaw,
  )[0];
  const complianceHash = complianceVerdict.resultHash;

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
  const riskHash = riskVerdict.resultHash;
  const riskScore = Number(riskVerdict.score);

  const policyFacts = {
    complianceHash,
    riskHash,
    policyVersionHash: POLICY_HASH,
    mandateScopeHash: MANDATE_SCOPE_HASH,
    timeBucket: now,
  };

  const policyRaw = await ethers.provider.call({
    to: engines.PolicyEngine.address,
    from: settlementAddr,
    data: policyEngine.interface.encodeFunctionData("evaluate", [
      intent,
      policyFacts,
      riskVerdict.tier,
      riskScore,
      [ruleCommitment],
    ]),
  });
  const policyVerdict = policyEngine.interface.decodeFunctionResult("evaluate", policyRaw)[0];
  steps.push({
    step: "Engines.liveProbe",
    status: "pass",
    detail: `compliance=${complianceHash.slice(0, 10)} risk=${riskHash.slice(0, 10)} policy=${policyVerdict.verdict.resultHash.slice(0, 10)}`,
  });

  const callData = "0x";

  const submitTx = await settlement.submitSettlement(
    intent,
    complianceContext,
    riskFactors,
    policyFacts,
    [ruleCommitment],
    MANDATE_STATUS_HASH,
    eligibilityResultHash,
    historicalSummaryHash,
    externalRiskAttestationHash,
    externalRiskExpiry,
    eligibilityAttestationHash,
    eligibilityExpiry,
    callData,
  );
  const submitReceipt = await submitTx.wait();
  steps.push({
    step: "Settlement.submit",
    status: "pass",
    detail: "Settlement submitted with live Stylus engine validation",
    txHash: submitReceipt?.hash,
  });

  const settlementId = ethers.solidityPackedKeccak256(
    ["bytes32", "bytes32", "bytes32", "uint256", "address"],
    [executionHash, mandateId, POLICY_HASH, deployment.chainId, settlementAddr],
  );

  const approveTx = await settlement.approveSettlement(settlementId);
  await approveTx.wait();
  steps.push({
    step: "Settlement.approve",
    status: "pass",
    detail: settlementId,
    txHash: approveTx.hash,
  });

  const executeTx = await settlement.executeSettlement(settlementId, callData, {
    value: amount,
  });
  const executeReceipt = await executeTx.wait();
  steps.push({
    step: "Settlement.execute",
    status: "pass",
    detail: `Executed with ${ethers.formatEther(amount)} ETH`,
    txHash: executeReceipt?.hash,
  });

  const record = await settlement.getSettlement(settlementId);
  if (Number(record.status) !== 3) {
    throw new Error(`Expected Executed status, got ${record.status}`);
  }

  const commitment = ethers.solidityPackedKeccak256(
    ["bytes32", "bytes32", "bytes32"],
    [executionHash, complianceHash, riskHash],
  );
  const exists = await auditLog.commitmentExists(commitment);
  steps.push({
    step: "Audit.commitment",
    status: exists ? "pass" : "fail",
    detail: exists ? commitment : `Missing commitment ${commitment}`,
  });

  const report = {
    network: network.name,
    chainId: deployment.chainId,
    timestamp: new Date().toISOString(),
    settlement: settlementAddr,
    engines,
    settlementId,
    steps,
    passed: steps.every((s) => s.status !== "fail"),
  };

  const outDir = join("reports");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `e2e-${network.name}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`E2E validation ${report.passed ? "PASSED" : "FAILED"} — report: ${outPath}`);
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
