// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IValenSettlement
/// @notice Final settlement gate enforcing mandate, policy, and verdict hashes.
interface IValenSettlement {
    event SettlementRequested(
        bytes32 indexed settlementId,
        bytes32 indexed executionHash,
        bytes32 mandateId,
        bytes32 policyHash,
        address target
    );
    event SettlementApproved(bytes32 indexed settlementId);
    event SettlementExecuted(bytes32 indexed settlementId, address target, uint256 value);
    event SettlementFailed(bytes32 indexed settlementId, uint16 reasonCode);
    event SettlementCancelled(bytes32 indexed settlementId, uint16 reasonCode);
    event SettlementPaused(ValenTypes.PauseScope scope, bytes32 scopeRef);
    event SettlementUnpaused(ValenTypes.PauseScope scope, bytes32 scopeRef);
    event SettlementEngineValidated(bytes32 indexed settlementId, bytes32 complianceHash, bytes32 riskHash, bytes32 policyHash);

    function initialize(address registry, address admin, address timelock) external;

    function submitSettlement(
        ValenTypes.IntentContext calldata intent,
        ValenTypes.ComplianceContext calldata complianceContext,
        ValenTypes.RiskFactors calldata riskFactors,
        ValenTypes.PolicyFacts calldata policyFacts,
        bytes32[] calldata ruleCommitmentHashes,
        bytes32 mandateStatusHash,
        bytes32 eligibilityResultHash,
        bytes32 historicalSummaryHash,
        bytes32 externalRiskAttestationHash,
        uint64 externalRiskExpiry,
        bytes32 eligibilityAttestationHash,
        uint64 eligibilityExpiry,
        bytes calldata callData
    ) external returns (bytes32 settlementId);

    function approveSettlement(bytes32 settlementId) external;

    function executeSettlement(bytes32 settlementId, bytes calldata callData) external payable;

    function cancelSettlement(bytes32 settlementId, uint16 reasonCode) external;

    function markSettlementFailed(bytes32 settlementId, uint16 reasonCode) external;

    function pauseScope(ValenTypes.PauseScope scope, bytes32 scopeRef) external;

    function unpauseScope(ValenTypes.PauseScope scope, bytes32 scopeRef) external;

    function isPaused(ValenTypes.PauseScope scope, bytes32 scopeRef) external view returns (bool);

    function getSettlement(bytes32 settlementId) external view returns (ValenTypes.SettlementRecord memory);
}
