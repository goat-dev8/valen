import { ethers } from "hardhat";

export const ROLE = {
  DEFAULT_ADMIN: ethers.ZeroHash,
  UPGRADER: ethers.id("UPGRADER_ROLE"),
  REGISTRY_MANAGER: ethers.id("REGISTRY_MANAGER_ROLE"),
  POLICY_MANAGER: ethers.id("POLICY_MANAGER_ROLE"),
  MANDATE_MANAGER: ethers.id("MANDATE_MANAGER_ROLE"),
  SETTLEMENT_OPERATOR: ethers.id("SETTLEMENT_OPERATOR_ROLE"),
  AUDIT_WRITER: ethers.id("AUDIT_WRITER_ROLE"),
  EMERGENCY_GUARDIAN: ethers.id("EMERGENCY_GUARDIAN_ROLE"),
  TREASURY: ethers.id("TREASURY_ROLE"),
};

export const CONTRACT_NAMES = {
  POLICY_MANAGER: ethers.id("ValenPolicyManager"),
  MANDATE_REGISTRY: ethers.id("ValenMandateRegistry"),
  SETTLEMENT: ethers.id("ValenSettlement"),
  ESCROW: ethers.id("ValenEscrow"),
  TREASURY: ethers.id("ValenTreasury"),
  AUDIT_LOG: ethers.id("ValenAuditLog"),
  EMERGENCY_GUARDIAN: ethers.id("ValenEmergencyGuardian"),
};

export const TIMELOCK_DELAY = 86_400;
