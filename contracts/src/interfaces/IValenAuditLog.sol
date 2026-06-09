// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title IValenAuditLog
/// @notice Immutable onchain audit commitment ledger.
interface IValenAuditLog {
    event AuditCommitmentRecorded(bytes32 indexed commitmentHash, bytes32 entityHash, address indexed emitter);
    event AuditEmitterUpdated(address indexed emitter, bool enabled);

    function initialize(address admin) external;

    function recordAuditCommitment(bytes32 commitmentHash, bytes32 entityHash) external;

    function authorizeEmitter(address emitter, bool enabled) external;

    function commitmentExists(bytes32 commitmentHash) external view returns (bool);

    function commitmentEmitter(bytes32 commitmentHash) external view returns (address);
}
