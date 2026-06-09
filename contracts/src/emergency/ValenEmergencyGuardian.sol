// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IValenEmergencyGuardian} from "../interfaces/IValenEmergencyGuardian.sol";
import {IValenSettlement} from "../interfaces/IValenSettlement.sol";
import {IValenMandateRegistry} from "../interfaces/IValenMandateRegistry.sol";
import {IValenPolicyManager} from "../interfaces/IValenPolicyManager.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";
import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title ValenEmergencyGuardian
/// @notice Non-upgradeable emergency pause and freeze controller.
contract ValenEmergencyGuardian is IValenEmergencyGuardian, AccessControl {
    IValenSettlement public settlement;
    IValenMandateRegistry public mandateRegistry;
    IValenPolicyManager public policyManager;

    mapping(address => bool) private _guardians;
    mapping(ValenTypes.PauseScope => mapping(bytes32 => bool)) private _pausedScopes;
    bool private _initialized;

    constructor() {
        _grantRole(ValenConstants.DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, msg.sender);
    }

    function initialize(
        address settlement_,
        address mandateRegistry_,
        address policyManager_,
        address admin
    ) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (_initialized) revert ValenErrors.AlreadyExists();
        if (settlement_ == address(0) || admin == address(0)) revert ValenErrors.ZeroAddress();

        settlement = IValenSettlement(settlement_);
        mandateRegistry = IValenMandateRegistry(mandateRegistry_);
        policyManager = IValenPolicyManager(policyManager_);

        _grantRole(ValenConstants.DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, admin);
        _guardians[admin] = true;
        _initialized = true;
    }

    function setGuardian(address guardian, bool enabled) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (guardian == address(0)) revert ValenErrors.ZeroAddress();
        _guardians[guardian] = enabled;
        if (enabled) {
            _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, guardian);
        } else {
            _revokeRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, guardian);
        }
        emit GuardianUpdated(guardian, enabled);
    }

    function pauseGlobal(bytes32 reasonHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        _activatePause(ValenTypes.PauseScope.Global, bytes32(0), reasonHash);
        settlement.pauseScope(ValenTypes.PauseScope.Global, bytes32(0));
    }

    function pauseOrganization(bytes32 orgHash, bytes32 reasonHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        _activatePause(ValenTypes.PauseScope.Organization, orgHash, reasonHash);
        settlement.pauseScope(ValenTypes.PauseScope.Organization, orgHash);
    }

    function pauseAgent(address agent, bytes32 reasonHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        _activatePause(ValenTypes.PauseScope.Agent, bytes32(uint256(uint160(agent))), reasonHash);
        settlement.pauseScope(ValenTypes.PauseScope.Agent, bytes32(uint256(uint160(agent))));
    }

    function pauseAsset(address asset, bytes32 reasonHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        _activatePause(ValenTypes.PauseScope.Asset, bytes32(uint256(uint160(asset))), reasonHash);
        settlement.pauseScope(ValenTypes.PauseScope.Asset, bytes32(uint256(uint160(asset))));
    }

    function freezeMandate(bytes32 mandateId, bytes32 reasonHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        mandateRegistry.freezeMandate(mandateId, uint16(uint256(reasonHash)));
        emit MandateEmergencyFrozen(mandateId, reasonHash);
    }

    function freezePolicy(bytes32 policyHash, bytes32 reasonHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        if (address(policyManager) == address(0)) revert ValenErrors.ZeroAddress();
        policyManager.freezePolicy(policyHash);
        emit EmergencyPauseActivated(ValenTypes.PauseScope.Organization, policyHash, reasonHash);
    }

    function requestUnpause(
        ValenTypes.PauseScope scope,
        bytes32 scopeRef,
        bytes32 governanceApprovalRef
    ) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (!_pausedScopes[scope][scopeRef]) revert ValenErrors.NotPaused();
        if (scope == ValenTypes.PauseScope.Global && governanceApprovalRef == bytes32(0)) {
            revert ValenErrors.InvalidInput();
        }
        _pausedScopes[scope][scopeRef] = false;
        settlement.unpauseScope(scope, scopeRef);
        emit EmergencyPauseLifted(scope, scopeRef);
    }

    function isScopePaused(ValenTypes.PauseScope scope, bytes32 scopeRef) external view returns (bool) {
        return _pausedScopes[scope][scopeRef];
    }

    function _activatePause(ValenTypes.PauseScope scope, bytes32 scopeRef, bytes32 reasonHash) internal {
        if (_pausedScopes[scope][scopeRef]) revert ValenErrors.AlreadyPaused();
        _pausedScopes[scope][scopeRef] = true;
        emit EmergencyPauseActivated(scope, scopeRef, reasonHash);
    }
}
