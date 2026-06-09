// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IValenEmergencyGuardian
/// @notice Scoped emergency pause and freeze controls.
interface IValenEmergencyGuardian {
    event EmergencyPauseActivated(ValenTypes.PauseScope scope, bytes32 scopeRef, bytes32 reasonHash);
    event EmergencyPauseLifted(ValenTypes.PauseScope scope, bytes32 scopeRef);
    event MandateEmergencyFrozen(bytes32 indexed mandateId, bytes32 reasonHash);
    event GuardianUpdated(address indexed guardian, bool enabled);

    function initialize(
        address settlement,
        address mandateRegistry,
        address policyManager,
        address admin
    ) external;

    function pauseGlobal(bytes32 reasonHash) external;

    function pauseOrganization(bytes32 orgHash, bytes32 reasonHash) external;

    function pauseAgent(address agent, bytes32 reasonHash) external;

    function pauseAsset(address asset, bytes32 reasonHash) external;

    function freezeMandate(bytes32 mandateId, bytes32 reasonHash) external;

    function freezePolicy(bytes32 policyHash, bytes32 reasonHash) external;

    function requestUnpause(ValenTypes.PauseScope scope, bytes32 scopeRef, bytes32 governanceApprovalRef) external;

    function isScopePaused(ValenTypes.PauseScope scope, bytes32 scopeRef) external view returns (bool);
}
