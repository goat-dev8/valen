// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IValenMandateRegistry
/// @notice ERC-8226-aligned mandate registry with caps and usage accounting.
interface IValenMandateRegistry {
    event MandateGranted(
        bytes32 indexed mandateId,
        address indexed principal,
        address indexed agent,
        bytes32 scopeHash,
        uint64 validFrom,
        uint64 validUntil,
        uint256 maxPerTx,
        uint256 maxTotal
    );
    event MandateActivated(bytes32 indexed mandateId);
    event MandateRevoked(bytes32 indexed mandateId, uint16 reasonCode);
    event MandateFrozen(bytes32 indexed mandateId, uint16 reasonCode);
    event MandateUnfrozen(bytes32 indexed mandateId);
    event MandateUsageRecorded(bytes32 indexed mandateId, uint256 amount, bytes32 executionHash);

    function initialize(address registry, address admin, address timelock) external;

    function grantMandate(
        address principal,
        address agent,
        bytes32 scopeHash,
        uint64 validFrom,
        uint64 validUntil,
        uint256 maxPerTx,
        uint256 maxTotal
    ) external returns (bytes32 mandateId);

    function activateMandate(bytes32 mandateId) external;

    function revokeMandate(bytes32 mandateId, uint16 reasonCode) external;

    function allowScope(bytes32 scopeHash) external;

    function allowScopeBinding(bytes32 scopeHash, address asset, bytes32 actionHash) external;

    function freezeMandate(bytes32 mandateId, uint16 reasonCode) external;

    function unfreezeMandate(bytes32 mandateId) external;

    function recordExecution(bytes32 mandateId, uint256 amount, bytes32 executionHash) external;

    function checkMandate(
        bytes32 mandateId,
        address agent,
        address asset,
        uint256 amount,
        bytes32 actionHash
    ) external view returns (bool);

    function getMandate(bytes32 mandateId) external view returns (ValenTypes.MandateRecord memory);
}
