// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title IValenGovernance
/// @notice Governance proposal references and governed action queue.
interface IValenGovernance {
    event ProposalRegistered(bytes32 indexed proposalHash, bytes32 metadataHash);
    event ActionQueued(bytes32 indexed actionHash);
    event ActionCancelled(bytes32 indexed actionHash);
    event ActionExecuted(bytes32 indexed actionHash);
    event GovernanceSafeUpdated(address indexed governanceSafe);

    function initialize(address timelock, address governanceSafe, address admin) external;

    function registerProposal(bytes32 proposalHash, bytes32 metadataHash) external;

    function queueAction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external returns (bytes32 operationId);

    function cancelAction(bytes32 operationId) external;

    function executeAction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable;

    function setGovernanceSafe(address governanceSafe) external;

    function isActionQueued(bytes32 actionHash) external view returns (bool);
}
