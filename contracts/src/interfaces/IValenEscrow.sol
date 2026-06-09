// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title IValenEscrow
/// @notice Optional custody layer for settlement-bound fund locking.
interface IValenEscrow {
    event Deposited(address indexed depositor, address indexed asset, uint256 amount);
    event FundsLocked(bytes32 indexed executionHash, address indexed depositor, address indexed asset, uint256 amount);
    event FundsReleased(bytes32 indexed executionHash, address indexed target, uint256 amount);
    event Refunded(bytes32 indexed executionHash, address indexed depositor, uint256 amount);
    event EscrowFrozen(address indexed depositor);
    event AssetFrozen(address indexed asset);

    function initialize(address registry, address settlement, address admin, address timelock) external;

    function deposit(address asset, uint256 amount) external;

    function lockForSettlement(bytes32 executionHash, address depositor, address asset, uint256 amount) external;

    function releaseToTarget(bytes32 executionHash, address target) external;

    function refund(bytes32 executionHash, address depositor) external;

    function freezeDepositor(address depositor) external;

    function freezeAsset(address asset) external;

    function balanceOf(address depositor, address asset) external view returns (uint256);

    function lockedBalance(bytes32 executionHash) external view returns (uint256);
}
