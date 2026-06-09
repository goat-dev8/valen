// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IComplianceEngine
/// @notice Stylus compliance engine ABI surface.
interface IComplianceEngine {
    function evaluate(
        ValenTypes.IntentContext calldata intent,
        ValenTypes.ComplianceContext calldata context,
        bytes32 mandateStatusHash,
        bytes32 eligibilityResultHash
    ) external view returns (ValenTypes.EngineVerdict memory verdict, ValenTypes.ComplianceReason reason);
}
