// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenMandateRegistry} from "../interfaces/IValenMandateRegistry.sol";
import {IValenRegistry} from "../interfaces/IValenRegistry.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";
import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title ValenMandateRegistry
/// @notice UUPS mandate registry with caps, scope checks, and usage accounting.
contract ValenMandateRegistry is IValenMandateRegistry, ValenAccessControl, UUPSUpgradeable {
    IValenRegistry public registry;
    address public settlementContract;

    mapping(bytes32 => ValenTypes.MandateRecord) private _mandates;
    mapping(address => bytes32[]) private _agentMandates;
    mapping(bytes32 => mapping(uint64 => uint256)) private _dailyUsage;
    mapping(bytes32 => bool) private _scopeAllowed;
    mapping(bytes32 => bool) private _scopeBindingsAllowed;

    uint256 private _mandateNonce;

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
        _grantRole(ValenConstants.MANDATE_MANAGER_ROLE, admin);
        _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, admin);
    }

    function setSettlementContract(address settlement) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (settlement == address(0)) revert ValenErrors.ZeroAddress();
        settlementContract = settlement;
    }

    function allowScope(bytes32 scopeHash) external onlyRole(ValenConstants.MANDATE_MANAGER_ROLE) {
        if (scopeHash == bytes32(0)) revert ValenErrors.InvalidScope();
        _scopeAllowed[scopeHash] = true;
    }

    function allowScopeBinding(
        bytes32 scopeHash,
        address asset,
        bytes32 actionHash
    ) external onlyRole(ValenConstants.MANDATE_MANAGER_ROLE) {
        if (scopeHash == bytes32(0) || actionHash == bytes32(0)) revert ValenErrors.InvalidScope();
        _scopeBindingsAllowed[_scopeBinding(scopeHash, asset, actionHash)] = true;
    }

    function grantMandate(
        address principal,
        address agent,
        bytes32 scopeHash,
        uint64 validFrom,
        uint64 validUntil,
        uint256 maxPerTx,
        uint256 maxTotal
    ) external onlyRole(ValenConstants.MANDATE_MANAGER_ROLE) returns (bytes32 mandateId) {
        if (principal == address(0) || agent == address(0)) revert ValenErrors.ZeroAddress();
        if (scopeHash == bytes32(0)) revert ValenErrors.InvalidScope();
        if (validFrom >= validUntil) revert ValenErrors.InvalidTimeRange();
        if (!_scopeAllowed[scopeHash]) revert ValenErrors.InvalidScope();

        mandateId = keccak256(abi.encodePacked(principal, agent, scopeHash, validFrom, validUntil, ++_mandateNonce));

        _mandates[mandateId] = ValenTypes.MandateRecord({
            mandateId: mandateId,
            principal: principal,
            agent: agent,
            scopeHash: scopeHash,
            validFrom: validFrom,
            validUntil: validUntil,
            maxPerTx: maxPerTx,
            maxTotal: maxTotal,
            usedTotal: 0,
            status: ValenTypes.MandateStatus.Pending,
            reasonCode: 0
        });

        _agentMandates[agent].push(mandateId);

        emit MandateGranted(mandateId, principal, agent, scopeHash, validFrom, validUntil, maxPerTx, maxTotal);
    }

    function activateMandate(bytes32 mandateId) external onlyRole(ValenConstants.MANDATE_MANAGER_ROLE) {
        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();
        if (mandate.status != ValenTypes.MandateStatus.Pending) revert ValenErrors.InvalidInput();

        mandate.status = ValenTypes.MandateStatus.Active;
        emit MandateActivated(mandateId);
    }

    function revokeMandate(bytes32 mandateId, uint16 reasonCode) external onlyRole(ValenConstants.MANDATE_MANAGER_ROLE) {
        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();

        mandate.status = ValenTypes.MandateStatus.Revoked;
        mandate.reasonCode = reasonCode;
        emit MandateRevoked(mandateId, reasonCode);
    }

    function freezeMandate(bytes32 mandateId, uint16 reasonCode) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();

        mandate.status = ValenTypes.MandateStatus.Frozen;
        mandate.reasonCode = reasonCode;
        emit MandateFrozen(mandateId, reasonCode);
    }

    function unfreezeMandate(bytes32 mandateId) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();
        if (mandate.status != ValenTypes.MandateStatus.Frozen) revert ValenErrors.InvalidInput();

        mandate.status = ValenTypes.MandateStatus.Active;
        mandate.reasonCode = 0;
        emit MandateUnfrozen(mandateId);
    }

    function recordExecution(bytes32 mandateId, uint256 amount, bytes32 executionHash) external {
        if (msg.sender != settlementContract) revert ValenErrors.Unauthorized();

        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();
        if (mandate.status != ValenTypes.MandateStatus.Active) revert ValenErrors.MandateInvalid();
        if (block.timestamp < mandate.validFrom || block.timestamp > mandate.validUntil) revert ValenErrors.MandateExpired();
        if (amount > mandate.maxPerTx) revert ValenErrors.CapExceeded();
        if (mandate.usedTotal + amount > mandate.maxTotal) revert ValenErrors.CapExceeded();

        uint64 dayBucket = uint64(block.timestamp / 1 days);
        mandate.usedTotal += amount;
        _dailyUsage[mandateId][dayBucket] += amount;

        emit MandateUsageRecorded(mandateId, amount, executionHash);
    }

    function checkMandate(
        bytes32 mandateId,
        address agent,
        address asset,
        uint256 amount,
        bytes32 actionHash
    ) external view returns (bool) {
        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();
        if (mandate.agent != agent) revert ValenErrors.UnauthorizedAgent();
        if (mandate.status == ValenTypes.MandateStatus.Revoked) revert ValenErrors.MandateRevoked();
        if (mandate.status == ValenTypes.MandateStatus.Frozen) revert ValenErrors.MandateFrozen();
        if (block.timestamp < mandate.validFrom || block.timestamp > mandate.validUntil) revert ValenErrors.MandateExpired();
        if (amount > mandate.maxPerTx) revert ValenErrors.CapExceeded();
        if (mandate.usedTotal + amount > mandate.maxTotal) revert ValenErrors.CapExceeded();
        if (actionHash == bytes32(0)) revert ValenErrors.InvalidInput();
        if (
            actionHash != mandate.scopeHash &&
            !_scopeBindingsAllowed[_scopeBinding(mandate.scopeHash, asset, actionHash)]
        ) {
            revert ValenErrors.InvalidScope();
        }

        return mandate.status == ValenTypes.MandateStatus.Active;
    }

    function getMandate(bytes32 mandateId) external view returns (ValenTypes.MandateRecord memory) {
        ValenTypes.MandateRecord storage mandate = _mandates[mandateId];
        if (mandate.mandateId == bytes32(0)) revert ValenErrors.MandateNotFound();
        return mandate;
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}

    function _scopeBinding(bytes32 scopeHash, address asset, bytes32 actionHash) internal pure returns (bytes32) {
        return keccak256(abi.encode(scopeHash, asset, actionHash));
    }
}
