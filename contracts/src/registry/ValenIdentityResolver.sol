// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ValenErrors} from "../libraries/ValenErrors.sol";

/// @title ValenIdentityResolver
/// @notice Maps VALEN internal agent IDs to ERC-8004-ready identity metadata.
contract ValenIdentityResolver is AccessControl {
    bytes32 public constant IDENTITY_MANAGER_ROLE = keccak256("IDENTITY_MANAGER_ROLE");

    struct IdentityRecord {
        bytes32 agentKey;
        address registry;
        uint256 tokenId;
        address owner;
        string tokenUri;
        bytes32 metadataHash;
        bool registered;
        bool exists;
    }

    mapping(bytes32 => IdentityRecord) private _identities;

    event IdentityBound(
        bytes32 indexed agentKey,
        address indexed registry,
        uint256 indexed tokenId,
        address owner,
        bytes32 metadataHash,
        bool registered
    );

    constructor(address admin) {
        if (admin == address(0)) revert ValenErrors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(IDENTITY_MANAGER_ROLE, admin);
    }

    function bindIdentity(
        bytes32 agentKey,
        address registry,
        uint256 tokenId,
        address owner,
        string calldata tokenUri,
        bytes32 metadataHash,
        bool registered
    ) external onlyRole(IDENTITY_MANAGER_ROLE) {
        if (agentKey == bytes32(0) || metadataHash == bytes32(0)) revert ValenErrors.InvalidInput();
        if (registered && (registry == address(0) || owner == address(0))) revert ValenErrors.ZeroAddress();

        _identities[agentKey] = IdentityRecord({
            agentKey: agentKey,
            registry: registry,
            tokenId: tokenId,
            owner: owner,
            tokenUri: tokenUri,
            metadataHash: metadataHash,
            registered: registered,
            exists: true
        });

        emit IdentityBound(agentKey, registry, tokenId, owner, metadataHash, registered);
    }

    function getIdentity(bytes32 agentKey) external view returns (IdentityRecord memory) {
        IdentityRecord memory record = _identities[agentKey];
        if (!record.exists) revert ValenErrors.NotFound();
        return record;
    }
}
