// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title ValenErrors
/// @notice Canonical custom errors shared across VALEN contracts.
library ValenErrors {
    // ── Common ───────────────────────────────────────────────────────────
    error ZeroAddress();
    error Unauthorized();
    error InvalidInput();
    error AlreadyExists();
    error NotFound();

    // ── Registry ─────────────────────────────────────────────────────────
    error UnsupportedChain();
    error ContractDisabled();
    error EngineDisabled();
    error VersionEmpty();

    // ── Policy ─────────────────────────────────────────────────────────
    error InvalidPolicyHash();
    error PolicyNotPublished();
    error PolicyFrozen();
    error InvalidOrgKey();

    // ── Mandate ────────────────────────────────────────────────────────
    error MandateNotFound();
    error MandateExpired();
    error MandateRevoked();
    error MandateFrozen();
    error CapExceeded();
    error InvalidScope();
    error UnauthorizedAgent();
    error InvalidTimeRange();

    // ── Settlement ───────────────────────────────────────────────────────
    error SettlementAlreadyUsed();
    error SettlementNotApproved();
    error SettlementPaused();
    error InvalidVerdictHash();
    error ComplianceRejected();
    error RiskRejected();
    error PolicyRejected();
    error MandateInvalid();
    error TargetCallFailed();
    error ReentrantCall();

    // ── Escrow ─────────────────────────────────────────────────────────
    error InsufficientBalance();
    error NotSettlement();
    error EscrowFrozen();
    error AssetFrozen();
    error InvalidAsset();
    error TransferFailed();

    // ── Treasury ───────────────────────────────────────────────────────
    error InvalidFee();
    error InsufficientFees();
    error InvalidRecipient();

    // ── Governance ─────────────────────────────────────────────────────
    error InvalidProposal();
    error ActionNotQueued();
    error ActionAlreadyQueued();

    // ── Audit ──────────────────────────────────────────────────────────
    error DuplicateCommitment();
    error UnauthorizedEmitter();
    error InvalidCommitment();

    // ── Emergency ──────────────────────────────────────────────────────
    error UnauthorizedGuardian();
    error AlreadyPaused();
    error NotPaused();
}
