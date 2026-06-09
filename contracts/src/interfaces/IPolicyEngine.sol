// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IPolicyEngine
/// @notice Stylus policy engine ABI surface.
interface IPolicyEngine {
    function evaluate(
        ValenTypes.IntentContext calldata intent,
        ValenTypes.PolicyFacts calldata facts,
        uint8 riskTier,
        uint16 riskScore,
        bytes32[] calldata ruleCommitmentHashes
    ) external view returns (ValenTypes.PolicyVerdict memory);
}
