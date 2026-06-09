// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenTreasury} from "../interfaces/IValenTreasury.sol";
import {IValenRegistry} from "../interfaces/IValenRegistry.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenTreasury
/// @notice UUPS treasury for protocol fee accrual and withdrawal.
contract ValenTreasury is IValenTreasury, ValenAccessControl, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    IValenRegistry public registry;
    address public feeRecipient;
    address public settlementContract;

    mapping(bytes32 => uint256) private _feeBpsByAction;
    mapping(address => uint256) private _accruedFees;

    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address registry_, address admin, address timelock) external initializer {
        if (registry_ == address(0) || admin == address(0) || timelock == address(0)) {
            revert ValenErrors.ZeroAddress();
        }

        registry = IValenRegistry(registry_);
        feeRecipient = admin;
        __ValenAccessControl_init(admin, timelock);
        _grantRole(ValenConstants.TREASURY_ROLE, admin);
    }

    function setSettlementContract(address settlement) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (settlement == address(0)) revert ValenErrors.ZeroAddress();
        settlementContract = settlement;
    }

    function setFeeRecipient(address recipient) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (recipient == address(0)) revert ValenErrors.InvalidRecipient();
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    function setFeeConfig(bytes32 actionHash, uint256 basisPoints) external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        if (basisPoints > ValenConstants.MAX_FEE_BPS) revert ValenErrors.InvalidFee();
        _feeBpsByAction[actionHash] = basisPoints;
        emit FeeConfigUpdated(actionHash, basisPoints);
    }

    function calculateFee(bytes32 actionHash, uint256 amount) external view returns (uint256) {
        return (amount * _feeBpsByAction[actionHash]) / ValenConstants.MAX_FEE_BPS;
    }

    function accrueFee(address asset, uint256 amount) external payable {
        if (msg.sender != settlementContract) revert ValenErrors.Unauthorized();
        if (amount == 0) revert ValenErrors.InvalidInput();
        if (asset == address(0)) {
            if (msg.value != amount) revert ValenErrors.InvalidInput();
        } else if (msg.value != 0) {
            revert ValenErrors.InvalidInput();
        }

        _accruedFees[asset] += amount;
        emit FeeAccrued(asset, amount);
    }

    function withdrawFees(
        address asset,
        address recipient,
        uint256 amount
    ) external onlyRole(ValenConstants.TREASURY_ROLE) {
        if (recipient == address(0)) revert ValenErrors.InvalidRecipient();
        if (amount == 0 || _accruedFees[asset] < amount) revert ValenErrors.InsufficientFees();

        _accruedFees[asset] -= amount;

        if (asset == address(0)) {
            (bool sent, ) = recipient.call{value: amount}("");
            if (!sent) revert ValenErrors.TransferFailed();
        } else {
            IERC20(asset).safeTransfer(recipient, amount);
        }

        emit FeeWithdrawn(asset, recipient, amount);
    }

    function getAccruedFees(address asset) external view returns (uint256) {
        return _accruedFees[asset];
    }

    receive() external payable {
        _accruedFees[address(0)] += msg.value;
        emit FeeAccrued(address(0), msg.value);
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}
}
