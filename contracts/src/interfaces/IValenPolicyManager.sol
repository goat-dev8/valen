// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IValenPolicyManager
/// @notice Onchain policy hash lifecycle for organizations.
interface IValenPolicyManager {
    event PolicyPublished(bytes32 indexed orgKey, bytes32 indexed policyId, bytes32 policyHash, address publisher);
    event PolicyActivated(bytes32 indexed orgKey, bytes32 indexed policyId, bytes32 policyHash, uint64 activatedAt);
    event PolicyRetired(bytes32 indexed orgKey, bytes32 indexed policyId, bytes32 policyHash);
    event PolicyFrozen(bytes32 indexed policyHash);
    event PolicyUnfrozen(bytes32 indexed policyHash);

    function initialize(address registry, address admin, address timelock) external;

    function publishPolicy(bytes32 orgKey, bytes32 policyId, bytes32 policyHash) external;

    function activatePolicy(bytes32 orgKey, bytes32 policyId, bytes32 policyHash) external;

    function retirePolicy(bytes32 orgKey, bytes32 policyId, bytes32 policyHash) external;

    function freezePolicy(bytes32 policyHash) external;

    function unfreezePolicy(bytes32 policyHash) external;

    function getActivePolicyHash(bytes32 orgKey, bytes32 policyId) external view returns (bytes32);

    function isPolicyActive(bytes32 policyHash) external view returns (bool);

    function getPolicyStatus(bytes32 policyHash) external view returns (ValenTypes.PolicyStatus);
}
