// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenBudgetVault
/// @notice ERC-20 budget envelope for a single agent and asset.
contract ValenBudgetVault is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant BUDGET_MANAGER_ROLE = keccak256("BUDGET_MANAGER_ROLE");
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    IERC20 public immutable asset;
    bytes32 public immutable agentKey;
    uint256 public cap;
    uint256 public spent;
    uint64 public periodStartedAt;
    uint64 public periodSeconds;

    event BudgetTopUp(bytes32 indexed agentKey, address indexed from, uint256 amount, uint256 cap);
    event BudgetSpend(bytes32 indexed agentKey, bytes32 indexed executionHash, uint256 amount, uint256 spent, uint256 remaining);
    event BudgetExceeded(bytes32 indexed agentKey, bytes32 indexed executionHash, uint256 amount, uint256 remaining);

    constructor(address admin, address settlement, address asset_, bytes32 agentKey_, uint256 cap_, uint64 periodSeconds_) {
        if (admin == address(0) || settlement == address(0) || asset_ == address(0) || agentKey_ == bytes32(0)) {
            revert ValenErrors.ZeroAddress();
        }
        if (cap_ == 0 || periodSeconds_ == 0) revert ValenErrors.InvalidInput();
        asset = IERC20(asset_);
        agentKey = agentKey_;
        cap = cap_;
        periodStartedAt = uint64(block.timestamp);
        periodSeconds = periodSeconds_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(BUDGET_MANAGER_ROLE, admin);
        _grantRole(SETTLEMENT_ROLE, settlement);
    }

    function topUp(uint256 amount, uint256 newCap) external onlyRole(BUDGET_MANAGER_ROLE) {
        if (amount == 0 || newCap == 0) revert ValenErrors.InvalidInput();
        asset.safeTransferFrom(msg.sender, address(this), amount);
        cap = newCap;
        emit BudgetTopUp(agentKey, msg.sender, amount, newCap);
    }

    function remaining() public view returns (uint256) {
        if (spent >= cap) return 0;
        return cap - spent;
    }

    function commitSpend(bytes32 executionHash, uint256 amount) external onlyRole(SETTLEMENT_ROLE) {
        if (executionHash == bytes32(0) || amount == 0) revert ValenErrors.InvalidInput();
        if (block.timestamp >= periodStartedAt + periodSeconds) {
            spent = 0;
            periodStartedAt = uint64(block.timestamp);
        }
        uint256 available = remaining();
        if (amount > available) {
            emit BudgetExceeded(agentKey, executionHash, amount, available);
            revert ValenErrors.CapExceeded();
        }
        spent += amount;
        emit BudgetSpend(agentKey, executionHash, amount, spent, remaining());
    }
}
