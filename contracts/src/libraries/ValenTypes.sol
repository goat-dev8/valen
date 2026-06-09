// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title ValenTypes
/// @notice Shared structs and enums for VALEN onchain and Stylus engine integration.
library ValenTypes {
    // ── Enums ────────────────────────────────────────────────────────────

    enum PolicyStatus {
        Draft,
        Published,
        Active,
        Retired
    }

    enum MandateStatus {
        Pending,
        Active,
        Revoked,
        Frozen,
        Expired
    }

    enum SettlementStatus {
        None,
        Requested,
        Approved,
        Executed,
        Failed,
        Cancelled
    }

    enum PauseScope {
        Global,
        Organization,
        Agent,
        Asset
    }

    enum VerdictStatus {
        Pass,
        Fail,
        ApprovalRequired,
        Error
    }

    enum RiskTier {
        Low,
        Medium,
        High,
        Critical
    }

    enum ComplianceReason {
        Compliant,
        KycExpired,
        AmlFlag,
        JurisdictionBlocked,
        IdentityNotFound,
        AttestationRevoked,
        CounterpartyBlocked,
        AssetNotPermitted,
        MandateInvalid,
        UnknownError
    }

    enum PolicyReason {
        Approved,
        LimitExceeded,
        ActionNotAllowed,
        AssetNotAllowed,
        CounterpartyNotAllowed,
        TimeWindowBlocked,
        ApprovalRequired,
        PolicyInactive
    }

    // ── Structs ──────────────────────────────────────────────────────────

    struct ChainSupport {
        bool enabled;
        bool stylusSupported;
    }

    struct MandateRecord {
        bytes32 mandateId;
        address principal;
        address agent;
        bytes32 scopeHash;
        uint64 validFrom;
        uint64 validUntil;
        uint256 maxPerTx;
        uint256 maxTotal;
        uint256 usedTotal;
        MandateStatus status;
        uint16 reasonCode;
    }

    struct SettlementRecord {
        bytes32 settlementId;
        bytes32 executionHash;
        bytes32 organizationHash;
        bytes32 mandateId;
        bytes32 policyHash;
        bytes32 complianceHash;
        bytes32 riskHash;
        address agent;
        address target;
        address asset;
        uint256 value;
        bytes32 callDataHash;
        bytes32 actionHash;
        SettlementStatus status;
        uint16 reasonCode;
    }

    struct EngineVerdict {
        VerdictStatus status;
        uint16 reasonCode;
        bytes32 resultHash;
        bytes32 engineVersion;
        uint64 expiresAt;
    }

    struct IntentContext {
        bytes32 executionHash;
        bytes32 organizationHash;
        address agent;
        bytes32 mandateId;
        bytes32 actionType;
        uint64 targetChainId;
        address target;
        address asset;
        uint256 amount;
    }

    struct ComplianceContext {
        bytes32 principalHash;
        bytes32 jurisdictionHash;
        address counterparty;
        bytes32[] attestationHashes;
        uint64[] attestationExpiries;
    }

    struct RiskFactors {
        uint16 amountFactor;
        uint16 assetFactor;
        uint16 counterpartyFactor;
        uint16 velocityFactor;
        uint16 mandateUsageFactor;
        uint16 anomalyFactor;
    }

    struct PolicyFacts {
        bytes32 complianceHash;
        bytes32 riskHash;
        bytes32 policyVersionHash;
        bytes32 mandateScopeHash;
        uint64 timeBucket;
    }

    struct RiskVerdict {
        uint16 score;
        RiskTier tier;
        bool requiresApproval;
        bytes32 resultHash;
        EngineVerdict verdict;
    }

    struct EligibilityVerdict {
        EngineVerdict verdict;
        bytes32 failedDimension;
    }

    struct PolicyVerdict {
        EngineVerdict verdict;
        PolicyReason reason;
        uint8 approvalLevel;
    }
}
