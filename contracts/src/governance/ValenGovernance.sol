// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenGovernance} from "../interfaces/IValenGovernance.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenGovernance
/// @notice UUPS governance module tracking proposals and governed action queue state.
contract ValenGovernance is IValenGovernance, ValenAccessControl, UUPSUpgradeable {
    address public governanceSafe;
    TimelockController public timelock;

    mapping(bytes32 => bool) private _proposalExists;
    mapping(bytes32 => bytes32) private _proposalMetadata;
    mapping(bytes32 => bool) private _actionQueued;
    mapping(bytes32 => bool) private _actionExecuted;

    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address timelock_, address governanceSafe_, address admin) external initializer {
        if (timelock_ == address(0) || governanceSafe_ == address(0) || admin == address(0)) {
            revert ValenErrors.ZeroAddress();
        }

        timelock = TimelockController(payable(timelock_));
        governanceSafe = governanceSafe_;
        __ValenAccessControl_init(admin, timelock_);
    }

    function registerProposal(bytes32 proposalHash, bytes32 metadataHash) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (proposalHash == bytes32(0)) revert ValenErrors.InvalidProposal();
        if (_proposalExists[proposalHash]) revert ValenErrors.AlreadyExists();

        _proposalExists[proposalHash] = true;
        _proposalMetadata[proposalHash] = metadataHash;
        emit ProposalRegistered(proposalHash, metadataHash);
    }

    function queueAction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) returns (bytes32 operationId) {
        if (target == address(0)) revert ValenErrors.ZeroAddress();

        operationId = timelock.hashOperation(target, value, data, predecessor, salt);
        if (_actionQueued[operationId]) revert ValenErrors.ActionAlreadyQueued();

        timelock.schedule(target, value, data, predecessor, salt, delay);
        _actionQueued[operationId] = true;
        emit ActionQueued(operationId);
    }

    function cancelAction(bytes32 operationId) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (!_actionQueued[operationId]) revert ValenErrors.ActionNotQueued();

        timelock.cancel(operationId);
        _actionQueued[operationId] = false;
        emit ActionCancelled(operationId);
    }

    function executeAction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (target == address(0)) revert ValenErrors.ZeroAddress();
        bytes32 operationId = timelock.hashOperation(target, value, data, predecessor, salt);
        if (!_actionQueued[operationId]) revert ValenErrors.ActionNotQueued();

        timelock.execute{value: value}(target, value, data, predecessor, salt);
        _actionQueued[operationId] = false;
        _actionExecuted[operationId] = true;
        emit ActionExecuted(operationId);
    }

    function setGovernanceSafe(address governanceSafe_) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (governanceSafe_ == address(0)) revert ValenErrors.ZeroAddress();
        governanceSafe = governanceSafe_;
        emit GovernanceSafeUpdated(governanceSafe_);
    }

    function isActionQueued(bytes32 actionHash) external view returns (bool) {
        return _actionQueued[actionHash];
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}
}
