// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IEligibilityEngine
/// @notice Stylus eligibility engine ABI surface.
interface IEligibilityEngine {
    function check(
        bytes32 principalHash,
        address agent,
        address asset,
        address counterparty,
        bytes32 scopeHash,
        bytes32 eligibilityAttestationHash,
        uint64 expiry
    ) external view returns (ValenTypes.EligibilityVerdict memory);
}
