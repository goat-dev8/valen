// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title RobinhoodAssetRegistry
/// @notice Canonical VALEN registry for Robinhood Chain demo assets.
contract RobinhoodAssetRegistry is AccessControl {
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    struct AssetRecord {
        bytes32 ticker;
        address token;
        uint8 decimals;
        bool verified;
        string supportLevel;
        string metadataUri;
    }

    mapping(bytes32 => AssetRecord) private _assets;
    bytes32[] private _tickers;

    event RobinhoodAssetRegistered(
        bytes32 indexed ticker,
        address indexed token,
        uint8 decimals,
        bool verified,
        string supportLevel,
        string metadataUri
    );

    constructor(address admin) {
        if (admin == address(0)) revert ValenErrors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ASSET_MANAGER_ROLE, admin);
    }

    function registerAsset(
        bytes32 ticker,
        address token,
        uint8 decimals,
        bool verified,
        string calldata supportLevel,
        string calldata metadataUri
    ) external onlyRole(ASSET_MANAGER_ROLE) {
        if (ticker == bytes32(0) || decimals == 0 || bytes(supportLevel).length == 0) {
            revert ValenErrors.InvalidInput();
        }
        if (verified && token == address(0)) revert ValenErrors.ZeroAddress();

        if (_assets[ticker].ticker == bytes32(0)) {
            _tickers.push(ticker);
        }

        _assets[ticker] = AssetRecord({
            ticker: ticker,
            token: token,
            decimals: decimals,
            verified: verified,
            supportLevel: supportLevel,
            metadataUri: metadataUri
        });

        emit RobinhoodAssetRegistered(ticker, token, decimals, verified, supportLevel, metadataUri);
    }

    function getAsset(bytes32 ticker) external view returns (AssetRecord memory) {
        AssetRecord memory record = _assets[ticker];
        if (record.ticker == bytes32(0)) revert ValenErrors.NotFound();
        return record;
    }

    function isVerified(bytes32 ticker) external view returns (bool) {
        return _assets[ticker].verified;
    }

    function tickers() external view returns (bytes32[] memory) {
        return _tickers;
    }
}
