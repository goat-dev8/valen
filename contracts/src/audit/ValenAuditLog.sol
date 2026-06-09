// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IValenAuditLog} from "../interfaces/IValenAuditLog.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenAuditLog
/// @notice Non-upgradeable immutable audit commitment ledger.
contract ValenAuditLog is IValenAuditLog, AccessControl {
    mapping(bytes32 => bool) private _commitments;
    mapping(bytes32 => address) private _commitmentEmitter;
    mapping(address => bool) private _authorizedEmitters;
    bool private _initialized;

    constructor() {
        _grantRole(ValenConstants.DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ValenConstants.AUDIT_WRITER_ROLE, msg.sender);
    }

    function initialize(address admin) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (_initialized) revert ValenErrors.AlreadyExists();
        if (admin == address(0)) revert ValenErrors.ZeroAddress();
        _grantRole(ValenConstants.DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ValenConstants.AUDIT_WRITER_ROLE, admin);
        _initialized = true;
    }

    function recordAuditCommitment(bytes32 commitmentHash, bytes32 entityHash) external {
        if (!_authorizedEmitters[msg.sender] && !hasRole(ValenConstants.AUDIT_WRITER_ROLE, msg.sender)) {
            revert ValenErrors.UnauthorizedEmitter();
        }
        if (commitmentHash == bytes32(0)) revert ValenErrors.InvalidCommitment();
        if (_commitments[commitmentHash]) revert ValenErrors.DuplicateCommitment();

        _commitments[commitmentHash] = true;
        _commitmentEmitter[commitmentHash] = msg.sender;

        emit AuditCommitmentRecorded(commitmentHash, entityHash, msg.sender);
    }

    function authorizeEmitter(address emitter, bool enabled) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (emitter == address(0)) revert ValenErrors.ZeroAddress();
        _authorizedEmitters[emitter] = enabled;
        emit AuditEmitterUpdated(emitter, enabled);
    }

    function commitmentExists(bytes32 commitmentHash) external view returns (bool) {
        return _commitments[commitmentHash];
    }

    function commitmentEmitter(bytes32 commitmentHash) external view returns (address) {
        return _commitmentEmitter[commitmentHash];
    }
}
