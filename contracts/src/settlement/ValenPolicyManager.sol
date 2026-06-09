// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenPolicyManager} from "../interfaces/IValenPolicyManager.sol";
import {IValenRegistry} from "../interfaces/IValenRegistry.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";
import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title ValenPolicyManager
/// @notice UUPS policy hash lifecycle manager bound to organization keys.
contract ValenPolicyManager is IValenPolicyManager, ValenAccessControl, UUPSUpgradeable {
    IValenRegistry public registry;

    mapping(bytes32 => mapping(bytes32 => bytes32)) private _activePolicyByOrg;
    mapping(bytes32 => ValenTypes.PolicyStatus) private _policyStatus;
    mapping(bytes32 => uint64) private _activationTimestamp;
    mapping(bytes32 => address) private _publisher;
    mapping(bytes32 => bool) private _frozenPolicies;

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
        _grantRole(ValenConstants.POLICY_MANAGER_ROLE, admin);
        _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, admin);
    }

    function publishPolicy(bytes32 orgKey, bytes32 policyId, bytes32 policyHash) external onlyRole(ValenConstants.POLICY_MANAGER_ROLE) {
        if (orgKey == bytes32(0)) revert ValenErrors.InvalidOrgKey();
        if (policyHash == bytes32(0)) revert ValenErrors.InvalidPolicyHash();

        _policyStatus[policyHash] = ValenTypes.PolicyStatus.Published;
        _publisher[policyHash] = msg.sender;

        emit PolicyPublished(orgKey, policyId, policyHash, msg.sender);
    }

    function activatePolicy(bytes32 orgKey, bytes32 policyId, bytes32 policyHash) external onlyRole(ValenConstants.POLICY_MANAGER_ROLE) {
        if (orgKey == bytes32(0)) revert ValenErrors.InvalidOrgKey();
        if (policyHash == bytes32(0)) revert ValenErrors.InvalidPolicyHash();
        if (_frozenPolicies[policyHash]) revert ValenErrors.PolicyFrozen();
        if (_policyStatus[policyHash] != ValenTypes.PolicyStatus.Published) revert ValenErrors.PolicyNotPublished();

        _activePolicyByOrg[orgKey][policyId] = policyHash;
        _policyStatus[policyHash] = ValenTypes.PolicyStatus.Active;
        _activationTimestamp[policyHash] = uint64(block.timestamp);

        emit PolicyActivated(orgKey, policyId, policyHash, uint64(block.timestamp));
    }

    function retirePolicy(bytes32 orgKey, bytes32 policyId, bytes32 policyHash) external onlyRole(ValenConstants.POLICY_MANAGER_ROLE) {
        if (_activePolicyByOrg[orgKey][policyId] == policyHash) {
            delete _activePolicyByOrg[orgKey][policyId];
        }
        _policyStatus[policyHash] = ValenTypes.PolicyStatus.Retired;
        emit PolicyRetired(orgKey, policyId, policyHash);
    }

    function freezePolicy(bytes32 policyHash) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        if (policyHash == bytes32(0)) revert ValenErrors.InvalidPolicyHash();
        _frozenPolicies[policyHash] = true;
        emit PolicyFrozen(policyHash);
    }

    function unfreezePolicy(bytes32 policyHash) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (policyHash == bytes32(0)) revert ValenErrors.InvalidPolicyHash();
        _frozenPolicies[policyHash] = false;
        emit PolicyUnfrozen(policyHash);
    }

    function getActivePolicyHash(bytes32 orgKey, bytes32 policyId) external view returns (bytes32) {
        return _activePolicyByOrg[orgKey][policyId];
    }

    function isPolicyActive(bytes32 policyHash) external view returns (bool) {
        return _policyStatus[policyHash] == ValenTypes.PolicyStatus.Active && !_frozenPolicies[policyHash];
    }

    function getPolicyStatus(bytes32 policyHash) external view returns (ValenTypes.PolicyStatus) {
        return _policyStatus[policyHash];
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}
}
