// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenEscrow} from "../interfaces/IValenEscrow.sol";
import {IValenRegistry} from "../interfaces/IValenRegistry.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenEscrow
/// @notice UUPS escrow for deposit, lock, release, and refund flows.
contract ValenEscrow is IValenEscrow, ValenAccessControl, UUPSUpgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IValenRegistry public registry;
    address public settlementContract;

    mapping(address => mapping(address => uint256)) private _balances;
    mapping(bytes32 => uint256) private _lockedBalances;
    mapping(bytes32 => address) private _lockedAsset;
    mapping(bytes32 => address) private _lockedDepositor;
    mapping(address => bool) private _frozenDepositors;
    mapping(address => bool) private _frozenAssets;

    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address registry_, address settlement, address admin, address timelock) external initializer {
        if (registry_ == address(0) || settlement == address(0) || admin == address(0) || timelock == address(0)) {
            revert ValenErrors.ZeroAddress();
        }

        registry = IValenRegistry(registry_);
        settlementContract = settlement;
        __ValenAccessControl_init(admin, timelock);
        _grantRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, admin);
    }

    function deposit(address asset, uint256 amount) external nonReentrant {
        if (_frozenDepositors[msg.sender]) revert ValenErrors.EscrowFrozen();
        if (_frozenAssets[asset]) revert ValenErrors.AssetFrozen();
        if (amount == 0) revert ValenErrors.InvalidInput();

        if (asset == address(0)) {
            revert ValenErrors.InvalidAsset();
        }

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        _balances[msg.sender][asset] += amount;
        emit Deposited(msg.sender, asset, amount);
    }

    function lockForSettlement(
        bytes32 executionHash,
        address depositor,
        address asset,
        uint256 amount
    ) external nonReentrant {
        if (msg.sender != settlementContract) revert ValenErrors.NotSettlement();
        if (_frozenDepositors[depositor]) revert ValenErrors.EscrowFrozen();
        if (_frozenAssets[asset]) revert ValenErrors.AssetFrozen();
        if (_balances[depositor][asset] < amount) revert ValenErrors.InsufficientBalance();

        _balances[depositor][asset] -= amount;
        _lockedBalances[executionHash] = amount;
        _lockedAsset[executionHash] = asset;
        _lockedDepositor[executionHash] = depositor;

        emit FundsLocked(executionHash, depositor, asset, amount);
    }

    function releaseToTarget(bytes32 executionHash, address target) external nonReentrant {
        if (msg.sender != settlementContract) revert ValenErrors.NotSettlement();
        if (target == address(0)) revert ValenErrors.ZeroAddress();

        uint256 amount = _lockedBalances[executionHash];
        address asset = _lockedAsset[executionHash];
        if (amount == 0) revert ValenErrors.NotFound();

        delete _lockedBalances[executionHash];
        delete _lockedAsset[executionHash];
        delete _lockedDepositor[executionHash];

        IERC20(asset).safeTransfer(target, amount);
        emit FundsReleased(executionHash, target, amount);
    }

    function refund(bytes32 executionHash, address depositor) external nonReentrant {
        if (msg.sender != settlementContract) revert ValenErrors.NotSettlement();

        uint256 amount = _lockedBalances[executionHash];
        address asset = _lockedAsset[executionHash];
        address lockedDepositor = _lockedDepositor[executionHash];
        if (amount == 0 || lockedDepositor != depositor) revert ValenErrors.NotFound();

        delete _lockedBalances[executionHash];
        delete _lockedAsset[executionHash];
        delete _lockedDepositor[executionHash];

        _balances[depositor][asset] += amount;
        emit Refunded(executionHash, depositor, amount);
    }

    function freezeDepositor(address depositor) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        if (depositor == address(0)) revert ValenErrors.ZeroAddress();
        _frozenDepositors[depositor] = true;
        emit EscrowFrozen(depositor);
    }

    function freezeAsset(address asset) external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        if (asset == address(0)) revert ValenErrors.InvalidAsset();
        _frozenAssets[asset] = true;
        emit AssetFrozen(asset);
    }

    function balanceOf(address depositor, address asset) external view returns (uint256) {
        return _balances[depositor][asset];
    }

    function lockedBalance(bytes32 executionHash) external view returns (uint256) {
        return _lockedBalances[executionHash];
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}
}
