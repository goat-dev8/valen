// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";

/// @title ValenAccessControl
/// @notice Base access-control module for upgradeable VALEN contracts.
abstract contract ValenAccessControl is Initializable, AccessControlUpgradeable {
    /// @notice Initializes role hierarchy with admin and timelock as privileged roles.
    /// @param admin Initial admin (typically timelock after bootstrap).
    /// @param timelock Timelock controller address.
    function __ValenAccessControl_init(address admin, address timelock) internal onlyInitializing {
        __AccessControl_init();

        _grantRole(ValenConstants.DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ValenConstants.UPGRADER_ROLE, timelock);
        _setRoleAdmin(ValenConstants.UPGRADER_ROLE, ValenConstants.DEFAULT_ADMIN_ROLE);
    }

    /// @notice Grants a role to an account. Caller must hold the role's admin role.
    function grantValenRole(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /// @notice Revokes a role from an account.
    function revokeValenRole(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }
}
