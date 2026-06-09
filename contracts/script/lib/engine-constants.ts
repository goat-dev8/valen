import { ethers } from "hardhat";

export const ENGINE_VERSION = ethers.id("1.0.0");
export const COMPLIANCE_RULE_HASH = ethers.id("valen-compliance-rule-v1");
export const RISK_MODEL_HASH = ethers.id("valen-risk-model-v1");
export const ELIGIBILITY_ROOT_HASH = ethers.id("valen-eligibility-root-v1");

export function bindResultHash(
  engineVersion: string,
  modelOrPolicyHash: string,
  inputHashes: string[],
): string {
  const words = [engineVersion, modelOrPolicyHash, ...inputHashes].map((hash) =>
    ethers.zeroPadValue(hash, 32),
  );
  return ethers.keccak256(ethers.concat(words));
}
