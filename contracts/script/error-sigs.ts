import { ethers } from "hardhat";

async function main() {
  const errors = [
    "InvalidVerdictHash()",
    "ComplianceRejected()",
    "RiskRejected()",
    "PolicyRejected()",
    "MandateInvalid()",
    "InvalidInput()",
    "SettlementAlreadyUsed()",
    "EnforcedPause()",
    "FailedCall()",
    "ValenEngineError(uint8)",
    "MandateNotFound()",
    "MandateInvalid()",
    "CapExceeded()",
  ];
  for (const e of errors) console.log(e, ethers.id(e).slice(0, 10));
}

main();
