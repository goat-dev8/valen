// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ValenAccessControl} from "../core/ValenAccessControl.sol";
import {IValenRegistry} from "../interfaces/IValenRegistry.sol";
import {ValenConstants} from "../libraries/ValenConstants.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";
import {ValenTypes} from "../libraries/ValenTypes.sol";

/// @title ValenRegistry
/// @notice UUPS upgradeable canonical registry for VALEN contracts, engines, and chains.
contract ValenRegistry is IValenRegistry, ValenAccessControl, UUPSUpgradeable, PausableUpgradeable {
    mapping(bytes32 => address) private _contracts;
    mapping(bytes32 => string) private _contractVersions;
    mapping(bytes32 => bool) private _contractDisabled;

    mapping(bytes32 => address) private _engines;
    mapping(bytes32 => string) private _engineVersions;
    mapping(bytes32 => bool) private _engineDisabled;

    mapping(uint256 => ValenTypes.ChainSupport) private _chainSupport;

    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address timelock) external initializer {
        if (admin == address(0) || timelock == address(0)) revert ValenErrors.ZeroAddress();
        __ValenAccessControl_init(admin, timelock);
        __Pausable_init();
        _grantRole(ValenConstants.REGISTRY_MANAGER_ROLE, admin);
    }

    function registerContract(
        bytes32 nameHash,
        address contractAddr,
        string calldata version
    ) external onlyRole(ValenConstants.REGISTRY_MANAGER_ROLE) whenNotPaused {
        if (contractAddr == address(0)) revert ValenErrors.ZeroAddress();
        if (bytes(version).length == 0) revert ValenErrors.VersionEmpty();

        _contracts[nameHash] = contractAddr;
        _contractVersions[nameHash] = version;
        _contractDisabled[nameHash] = false;

        emit ContractRegistered(nameHash, contractAddr, version);
    }

    function deprecateContract(bytes32 nameHash) external {
        if (
            !hasRole(ValenConstants.REGISTRY_MANAGER_ROLE, msg.sender) &&
            !hasRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, msg.sender)
        ) {
            revert ValenErrors.Unauthorized();
        }
        if (_contracts[nameHash] == address(0)) revert ValenErrors.NotFound();

        _contractDisabled[nameHash] = true;
        emit ContractDeprecated(nameHash);
    }

    function registerEngine(
        bytes32 nameHash,
        address engineAddr,
        string calldata version
    ) external onlyRole(ValenConstants.REGISTRY_MANAGER_ROLE) whenNotPaused {
        if (engineAddr == address(0)) revert ValenErrors.ZeroAddress();
        if (bytes(version).length == 0) revert ValenErrors.VersionEmpty();

        _engines[nameHash] = engineAddr;
        _engineVersions[nameHash] = version;
        _engineDisabled[nameHash] = false;

        emit EngineRegistered(nameHash, engineAddr, version);
    }

    function deprecateEngine(bytes32 nameHash) external {
        if (
            !hasRole(ValenConstants.REGISTRY_MANAGER_ROLE, msg.sender) &&
            !hasRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE, msg.sender)
        ) {
            revert ValenErrors.Unauthorized();
        }
        if (_engines[nameHash] == address(0)) revert ValenErrors.NotFound();

        _engineDisabled[nameHash] = true;
        emit EngineDeprecated(nameHash);
    }

    function setChainSupport(
        uint256 chainId,
        bool enabled,
        bool stylusSupported
    ) external onlyRole(ValenConstants.REGISTRY_MANAGER_ROLE) whenNotPaused {
        _chainSupport[chainId] = ValenTypes.ChainSupport({enabled: enabled, stylusSupported: stylusSupported});
        emit ChainSupportUpdated(chainId, enabled, stylusSupported);
    }

    function getContract(bytes32 nameHash) external view returns (address contractAddr, string memory version) {
        if (_contractDisabled[nameHash]) revert ValenErrors.ContractDisabled();
        contractAddr = _contracts[nameHash];
        if (contractAddr == address(0)) revert ValenErrors.NotFound();
        version = _contractVersions[nameHash];
    }

    function getEngine(bytes32 nameHash) external view returns (address engineAddr, string memory version) {
        if (_engineDisabled[nameHash]) revert ValenErrors.EngineDisabled();
        engineAddr = _engines[nameHash];
        if (engineAddr == address(0)) revert ValenErrors.NotFound();
        version = _engineVersions[nameHash];
    }

    function isChainSupported(uint256 chainId) external view returns (bool) {
        return _chainSupport[chainId].enabled;
    }

    function getChainSupport(uint256 chainId) external view returns (ValenTypes.ChainSupport memory) {
        return _chainSupport[chainId];
    }

    function pause() external onlyRole(ValenConstants.EMERGENCY_GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ValenConstants.DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address) internal override onlyRole(ValenConstants.UPGRADER_ROLE) {}
}
