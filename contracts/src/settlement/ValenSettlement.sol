// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenSettlement} from "../interfaces/IValenSettlement.sol";
import {IValenRegistry} from "../interfaces/IValenRegistry.sol";
import {IValenPolicyManager} from "../interfaces/IValenPolicyManager.sol";
import {IValenMandateRegistry} from "../interfaces/IValenMandateRegistry.sol";
import {IValenAuditLog} from "../interfaces/IValenAuditLog.sol";
import {IValenTreasury} from "../interfaces/IValenTreasury.sol";
import {IValenEscrow} from "../interfaces/IValenEscrow.sol";
import {IComplianceEngine} from "../interfaces/IComplianceEngine.sol";
import {IRiskEngine} from "../interfaces/IRiskEngine.sol";
import {IEligibilityEngine} from "../interfaces/IEligibilityEngine.sol";
import {IPolicyEngine} from "../interfaces/IPolicyEngine.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";
import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title ValenSettlement
/// @notice UUPS final settlement gate with scoped pause and reentrancy protection.
contract ValenSettlement is
    IValenSettlement,
    ValenAccessControl,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard
{
    IValenRegistry public registry;
    IValenMandateRegistry public mandateRegistry;
    IValenPolicyManager public policyManager;
    IValenAuditLog public auditLog;
    IValenTreasury public treasury;
    IValenEscrow public escrow;

    mapping(bytes32 => ValenTypes.SettlementRecord) private _settlements;
    mapping(bytes32 => bool) private _executionUsed;
    mapping(ValenTypes.PauseScope => mapping(bytes32 => bool)) private _scopePaused;

    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address registry_, address admin, address timelock) external initializer {
        if (registry_ == address(0) || admin == address(0) || timelock == address(0)) {
            revert ValenErrors.ZeroAddress();
        }

        registry = IValenRegistry(registry_);
        __ValenAccessControl_init(admin, timelock);
        __Pausable_init();
        _grantRole(ValenConstants.SETTLEMENT_OPERATOR_ROLE, admin);
        _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, admin);
    }

    function setMandateRegistry(address mandateRegistry_) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (mandateRegistry_ == address(0)) revert ValenErrors.ZeroAddress();
        mandateRegistry = IValenMandateRegistry(mandateRegistry_);
    }

    function setPolicyManager(address policyManager_) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (policyManager_ == address(0)) revert ValenErrors.ZeroAddress();
        policyManager = IValenPolicyManager(policyManager_);
    }

    function setAuditLog(address auditLog_) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (auditLog_ == address(0)) revert ValenErrors.ZeroAddress();
        auditLog = IValenAuditLog(auditLog_);
    }

    function setTreasury(address treasury_) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (treasury_ == address(0)) revert ValenErrors.ZeroAddress();
        treasury = IValenTreasury(treasury_);
    }

    function setEscrow(address escrow_) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (escrow_ == address(0)) revert ValenErrors.ZeroAddress();
        escrow = IValenEscrow(escrow_);
    }

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
    )
        external
        onlyRole(ValenConstants.SETTLEMENT_OPERATOR_ROLE)
        whenNotPaused
        nonReentrant
        returns (bytes32 settlementId)
    {
        _requireIntentNotPaused(intent);

        if (intent.executionHash == bytes32(0) || intent.organizationHash == bytes32(0)) revert ValenErrors.InvalidInput();
        if (_executionUsed[intent.executionHash]) revert ValenErrors.SettlementAlreadyUsed();
        if (intent.agent == address(0) || intent.target == address(0)) revert ValenErrors.ZeroAddress();
        if (policyFacts.policyVersionHash == bytes32(0)) revert ValenErrors.InvalidPolicyHash();
        if (keccak256(callData) == bytes32(0)) revert ValenErrors.InvalidInput();

        if (address(policyManager) == address(0) || !policyManager.isPolicyActive(policyFacts.policyVersionHash)) {
            revert ValenErrors.PolicyRejected();
        }

        if (address(mandateRegistry) != address(0) && intent.mandateId != bytes32(0)) {
            mandateRegistry.checkMandate(intent.mandateId, intent.agent, intent.asset, intent.amount, intent.actionType);
        }

        (
            ValenTypes.EngineVerdict memory complianceVerdict,
            ValenTypes.RiskVerdict memory riskVerdict,
            ValenTypes.EligibilityVerdict memory eligibilityVerdict,
            ValenTypes.PolicyVerdict memory policyVerdict
        ) = _validateEngines(
            intent,
            complianceContext,
            riskFactors,
            policyFacts,
            ruleCommitmentHashes,
            mandateStatusHash,
            eligibilityResultHash,
            historicalSummaryHash,
            externalRiskAttestationHash,
            externalRiskExpiry,
            eligibilityAttestationHash,
            eligibilityExpiry
        );

        settlementId = keccak256(abi.encodePacked(intent.executionHash, intent.mandateId, policyFacts.policyVersionHash, block.chainid, address(this)));
        _executionUsed[intent.executionHash] = true;

        _settlements[settlementId] = ValenTypes.SettlementRecord({
            settlementId: settlementId,
            executionHash: intent.executionHash,
            organizationHash: intent.organizationHash,
            mandateId: intent.mandateId,
            policyHash: policyFacts.policyVersionHash,
            complianceHash: complianceVerdict.resultHash,
            riskHash: riskVerdict.resultHash,
            agent: intent.agent,
            target: intent.target,
            asset: intent.asset,
            value: intent.amount,
            callDataHash: keccak256(callData),
            actionHash: intent.actionType,
            status: ValenTypes.SettlementStatus.Requested,
            reasonCode: 0
        });

        emit SettlementRequested(settlementId, intent.executionHash, intent.mandateId, policyFacts.policyVersionHash, intent.target);
        emit SettlementEngineValidated(settlementId, complianceVerdict.resultHash, riskVerdict.resultHash, policyVerdict.verdict.resultHash);

        if (eligibilityVerdict.verdict.status != ValenTypes.VerdictStatus.Pass) revert ValenErrors.MandateInvalid();
    }

    function approveSettlement(bytes32 settlementId) external onlyRole(ValenConstants.SETTLEMENT_OPERATOR_ROLE) {
        ValenTypes.SettlementRecord storage record = _settlements[settlementId];
        if (record.settlementId == bytes32(0)) revert ValenErrors.NotFound();
        if (record.status != ValenTypes.SettlementStatus.Requested) revert ValenErrors.InvalidInput();
        _requireRecordNotPaused(record);

        record.status = ValenTypes.SettlementStatus.Approved;
        emit SettlementApproved(settlementId);
    }

    function executeSettlement(
        bytes32 settlementId,
        bytes calldata callData
    ) external payable onlyRole(ValenConstants.SETTLEMENT_OPERATOR_ROLE) nonReentrant {

        ValenTypes.SettlementRecord storage record = _settlements[settlementId];
        if (record.settlementId == bytes32(0)) revert ValenErrors.NotFound();
        if (record.status != ValenTypes.SettlementStatus.Approved) revert ValenErrors.SettlementNotApproved();
        if (keccak256(callData) != record.callDataHash) revert ValenErrors.InvalidInput();
        _requireRecordNotPaused(record);

        if (address(mandateRegistry) != address(0) && record.mandateId != bytes32(0)) {
            mandateRegistry.recordExecution(record.mandateId, record.value, record.executionHash);
        }

        if (address(auditLog) != address(0)) {
            bytes32 commitment = keccak256(abi.encodePacked(record.executionHash, record.complianceHash, record.riskHash));
            auditLog.recordAuditCommitment(commitment, record.executionHash);
        }

        uint256 fee = _settlementFee(record);
        uint256 valueToTarget = record.value - fee;
        if (msg.value != record.value) revert ValenErrors.InvalidInput();

        (bool success, ) = record.target.call{value: valueToTarget}(callData);
        if (!success) revert ValenErrors.TargetCallFailed();

        if (fee > 0) {
            treasury.accrueFee{value: fee}(address(0), fee);
        }

        record.status = ValenTypes.SettlementStatus.Executed;
        emit SettlementExecuted(settlementId, record.target, valueToTarget);
    }

    function cancelSettlement(bytes32 settlementId, uint16 reasonCode) external onlyRole(ValenConstants.SETTLEMENT_OPERATOR_ROLE) {
        ValenTypes.SettlementRecord storage record = _settlements[settlementId];
        if (record.settlementId == bytes32(0)) revert ValenErrors.NotFound();
        if (record.status == ValenTypes.SettlementStatus.Executed) revert ValenErrors.InvalidInput();

        record.status = ValenTypes.SettlementStatus.Cancelled;
        record.reasonCode = reasonCode;
        emit SettlementCancelled(settlementId, reasonCode);
    }

    function markSettlementFailed(bytes32 settlementId, uint16 reasonCode) external onlyRole(ValenConstants.SETTLEMENT_OPERATOR_ROLE) {
        ValenTypes.SettlementRecord storage record = _settlements[settlementId];
        if (record.settlementId == bytes32(0)) revert ValenErrors.NotFound();

        record.status = ValenTypes.SettlementStatus.Failed;
        record.reasonCode = reasonCode;
        emit SettlementFailed(settlementId, reasonCode);
    }

    function pauseScope(ValenTypes.PauseScope scope, bytes32 scopeRef) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        if (_scopePaused[scope][scopeRef]) revert ValenErrors.AlreadyPaused();
        _scopePaused[scope][scopeRef] = true;
        if (scope == ValenTypes.PauseScope.Global) _pause();
        emit SettlementPaused(scope, scopeRef);
    }

    function unpauseScope(ValenTypes.PauseScope scope, bytes32 scopeRef) external {
        if (
            !hasRole(ValenConstants.DEFAULT_ADMIN_ROLE, msg.sender) &&
            !hasRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, msg.sender)
        ) {
            revert ValenErrors.Unauthorized();
        }
        if (!_scopePaused[scope][scopeRef]) revert ValenErrors.NotPaused();
        _scopePaused[scope][scopeRef] = false;
        if (scope == ValenTypes.PauseScope.Global) _unpause();
        emit SettlementUnpaused(scope, scopeRef);
    }

    function isPaused(ValenTypes.PauseScope scope, bytes32 scopeRef) external view returns (bool) {
        return _scopePaused[scope][scopeRef] || (scope == ValenTypes.PauseScope.Global && paused());
    }

    function getSettlement(bytes32 settlementId) external view returns (ValenTypes.SettlementRecord memory) {
        ValenTypes.SettlementRecord storage record = _settlements[settlementId];
        if (record.settlementId == bytes32(0)) revert ValenErrors.NotFound();
        return record;
    }

    function _requireNotScopePaused(ValenTypes.PauseScope scope, bytes32 scopeRef) internal view {
        if (_scopePaused[scope][scopeRef] || (scope == ValenTypes.PauseScope.Global && paused())) {
            revert ValenErrors.SettlementPaused();
        }
    }

    function _validateEngines(
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
        uint64 eligibilityExpiry
    )
        internal
        view
        returns (
            ValenTypes.EngineVerdict memory complianceVerdict,
            ValenTypes.RiskVerdict memory riskVerdict,
            ValenTypes.EligibilityVerdict memory eligibilityVerdict,
            ValenTypes.PolicyVerdict memory policyVerdict
        )
    {
        (address complianceEngine, ) = registry.getEngine(ValenConstants.ENGINE_COMPLIANCE);
        (address riskEngine, ) = registry.getEngine(ValenConstants.ENGINE_RISK);
        (address eligibilityEngine, ) = registry.getEngine(ValenConstants.ENGINE_ELIGIBILITY);
        (address policyEngine, ) = registry.getEngine(ValenConstants.ENGINE_POLICY);

        (complianceVerdict, ) = IComplianceEngine(complianceEngine).evaluate(
            intent,
            complianceContext,
            mandateStatusHash,
            eligibilityResultHash
        );
        if (complianceVerdict.status != ValenTypes.VerdictStatus.Pass) revert ValenErrors.ComplianceRejected();

        eligibilityVerdict = IEligibilityEngine(eligibilityEngine).check(
            complianceContext.principalHash,
            intent.agent,
            intent.asset,
            complianceContext.counterparty,
            policyFacts.mandateScopeHash,
            eligibilityAttestationHash,
            eligibilityExpiry
        );
        if (eligibilityVerdict.verdict.status != ValenTypes.VerdictStatus.Pass) revert ValenErrors.MandateInvalid();
        if (eligibilityVerdict.verdict.resultHash != eligibilityResultHash) revert ValenErrors.InvalidVerdictHash();

        riskVerdict = IRiskEngine(riskEngine).calculate(
            intent,
            riskFactors,
            historicalSummaryHash,
            externalRiskAttestationHash,
            externalRiskExpiry
        );
        if (
            riskVerdict.verdict.status != ValenTypes.VerdictStatus.Pass &&
            riskVerdict.verdict.status != ValenTypes.VerdictStatus.ApprovalRequired
        ) {
            revert ValenErrors.RiskRejected();
        }
        if (riskVerdict.resultHash != policyFacts.riskHash) revert ValenErrors.InvalidVerdictHash();
        if (complianceVerdict.resultHash != policyFacts.complianceHash) revert ValenErrors.InvalidVerdictHash();

        policyVerdict = IPolicyEngine(policyEngine).evaluate(
            intent,
            policyFacts,
            uint8(riskVerdict.tier),
            riskVerdict.score,
            ruleCommitmentHashes
        );
        if (
            policyVerdict.verdict.status != ValenTypes.VerdictStatus.Pass &&
            policyVerdict.verdict.status != ValenTypes.VerdictStatus.ApprovalRequired
        ) {
            revert ValenErrors.PolicyRejected();
        }
    }

    function _requireIntentNotPaused(ValenTypes.IntentContext calldata intent) internal view {
        _requireNotScopePaused(ValenTypes.PauseScope.Global, bytes32(0));
        _requireNotScopePaused(ValenTypes.PauseScope.Organization, intent.organizationHash);
        _requireNotScopePaused(ValenTypes.PauseScope.Agent, bytes32(uint256(uint160(intent.agent))));
        _requireNotScopePaused(ValenTypes.PauseScope.Asset, bytes32(uint256(uint160(intent.asset))));
    }

    function _requireRecordNotPaused(ValenTypes.SettlementRecord storage record) internal view {
        _requireNotScopePaused(ValenTypes.PauseScope.Global, bytes32(0));
        _requireNotScopePaused(ValenTypes.PauseScope.Organization, record.organizationHash);
        _requireNotScopePaused(ValenTypes.PauseScope.Agent, bytes32(uint256(uint160(record.agent))));
        _requireNotScopePaused(ValenTypes.PauseScope.Asset, bytes32(uint256(uint160(record.asset))));
    }

    function _settlementFee(ValenTypes.SettlementRecord storage record) internal view returns (uint256) {
        if (address(treasury) == address(0) || record.value == 0) return 0;
        return treasury.calculateFee(record.actionHash, record.value);
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}

    receive() external payable {}
}
