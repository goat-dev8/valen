// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IValenTokenSettlementAdapter {
    event TokenSettled(
        bytes32 indexed executionHash,
        address indexed token,
        address indexed from,
        address to,
        uint256 amount
    );

    function settleToken(
        bytes32 executionHash,
        address token,
        address from,
        address to,
        uint256 amount
    ) external;
}
