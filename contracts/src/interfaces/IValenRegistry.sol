// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title IValenRegistry
/// @notice Canonical registry of VALEN contracts, Stylus engines, and chain support.
interface IValenRegistry {
    event ContractRegistered(bytes32 indexed nameHash, address indexed contractAddr, string version);
    event ContractDeprecated(bytes32 indexed nameHash);
    event EngineRegistered(bytes32 indexed nameHash, address indexed engineAddr, string version);
    event EngineDeprecated(bytes32 indexed nameHash);
    event ChainSupportUpdated(uint256 indexed chainId, bool enabled, bool stylusSupported);

    function initialize(address admin, address timelock) external;

    function registerContract(bytes32 nameHash, address contractAddr, string calldata version) external;

    function deprecateContract(bytes32 nameHash) external;

    function registerEngine(bytes32 nameHash, address engineAddr, string calldata version) external;

    function deprecateEngine(bytes32 nameHash) external;

    function setChainSupport(uint256 chainId, bool enabled, bool stylusSupported) external;

    function getContract(bytes32 nameHash) external view returns (address contractAddr, string memory version);

    function getEngine(bytes32 nameHash) external view returns (address engineAddr, string memory version);

    function isChainSupported(uint256 chainId) external view returns (bool);

    function getChainSupport(uint256 chainId) external view returns (ValenTypes.ChainSupport memory);
}
