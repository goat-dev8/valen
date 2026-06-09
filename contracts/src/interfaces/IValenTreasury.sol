// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title IValenTreasury
/// @notice Protocol fee accrual and treasury withdrawals.
interface IValenTreasury {
    event FeeConfigUpdated(bytes32 indexed actionHash, uint256 basisPoints);
    event FeeAccrued(address indexed asset, uint256 amount);
    event FeeWithdrawn(address indexed asset, address indexed recipient, uint256 amount);
    event FeeRecipientUpdated(address indexed recipient);

    function initialize(address registry, address admin, address timelock) external;

    function setFeeRecipient(address recipient) external;

    function setFeeConfig(bytes32 actionHash, uint256 basisPoints) external;

    function accrueFee(address asset, uint256 amount) external payable;

    function calculateFee(bytes32 actionHash, uint256 amount) external view returns (uint256);

    function withdrawFees(address asset, address recipient, uint256 amount) external;

    function getAccruedFees(address asset) external view returns (uint256);
}
