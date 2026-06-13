// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IValenTokenSettlementAdapter} from "../interfaces/IValenTokenSettlementAdapter.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenTokenSettlementAdapter
/// @notice ERC-20 settlement adapter callable only by ValenSettlement.
contract ValenTokenSettlementAdapter is IValenTokenSettlementAdapter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable settlement;

    mapping(bytes32 => bool) public executionSettled;

    constructor(address settlement_) {
        if (settlement_ == address(0)) revert ValenErrors.ZeroAddress();
        settlement = settlement_;
    }

    modifier onlySettlement() {
        if (msg.sender != settlement) revert ValenErrors.Unauthorized();
        _;
    }

    function settleToken(
        bytes32 executionHash,
        address token,
        address from,
        address to,
        uint256 amount
    ) external onlySettlement nonReentrant {
        if (executionHash == bytes32(0) || token == address(0) || from == address(0) || to == address(0)) {
            revert ValenErrors.InvalidInput();
        }
        if (amount == 0) revert ValenErrors.InvalidInput();
        if (executionSettled[executionHash]) revert ValenErrors.SettlementAlreadyUsed();

        executionSettled[executionHash] = true;
        IERC20(token).safeTransferFrom(from, to, amount);

        emit TokenSettled(executionHash, token, from, to, amount);
    }
}
