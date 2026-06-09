// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IRiskEngine
/// @notice Stylus risk engine ABI surface.
interface IRiskEngine {
    function calculate(
        ValenTypes.IntentContext calldata intent,
        ValenTypes.RiskFactors calldata factors,
        bytes32 historicalSummaryHash,
        bytes32 externalRiskAttestationHash,
        uint64 externalRiskExpiry
    ) external view returns (ValenTypes.RiskVerdict memory);
}
