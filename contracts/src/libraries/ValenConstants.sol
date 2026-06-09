// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title ValenConstants
/// @notice Shared role identifiers, limits, and protocol constants for VALEN contracts.
library ValenConstants {
    // ── AccessControl roles ──────────────────────────────────────────────
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 internal constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 internal constant REGISTRY_MANAGER_ROLE = keccak256("REGISTRY_MANAGER_ROLE");
    bytes32 internal constant POLICY_MANAGER_ROLE = keccak256("POLICY_MANAGER_ROLE");
    bytes32 internal constant MANDATE_MANAGER_ROLE = keccak256("MANDATE_MANAGER_ROLE");
    bytes32 internal constant SETTLEMENT_OPERATOR_ROLE = keccak256("SETTLEMENT_OPERATOR_ROLE");
    bytes32 internal constant AUDIT_WRITER_ROLE = keccak256("AUDIT_WRITER_ROLE");
    bytes32 internal constant EMERGENCY_GUARDIAN_ROLE = keccak256("EMERGENCY_GUARDIAN_ROLE");
    bytes32 internal constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // ── Protocol limits ──────────────────────────────────────────────────
    uint256 internal constant MAX_FEE_BPS = 10_000;
    uint256 internal constant MAX_ATTESTATIONS = 32;
    uint256 internal constant MAX_POLICY_RULES = 256;
    uint256 internal constant STORAGE_GAP = 50;

    // ── Contract name hashes (keccak256 of canonical names) ──────────────
    bytes32 internal constant NAME_VALEN_POLICY_MANAGER = keccak256("ValenPolicyManager");
    bytes32 internal constant NAME_VALEN_MANDATE_REGISTRY = keccak256("ValenMandateRegistry");
    bytes32 internal constant NAME_VALEN_SETTLEMENT = keccak256("ValenSettlement");
    bytes32 internal constant NAME_VALEN_ESCROW = keccak256("ValenEscrow");
    bytes32 internal constant NAME_VALEN_TREASURY = keccak256("ValenTreasury");
    bytes32 internal constant NAME_VALEN_AUDIT_LOG = keccak256("ValenAuditLog");
    bytes32 internal constant NAME_VALEN_EMERGENCY_GUARDIAN = keccak256("ValenEmergencyGuardian");

    bytes32 internal constant ENGINE_COMPLIANCE = keccak256("ComplianceEngine");
    bytes32 internal constant ENGINE_RISK = keccak256("RiskEngine");
    bytes32 internal constant ENGINE_ELIGIBILITY = keccak256("EligibilityEngine");
    bytes32 internal constant ENGINE_POLICY = keccak256("PolicyEngine");
}
