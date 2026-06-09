interface IEligibilityEngine {
    function initialize(bytes32 engine_version, address authorized_caller, bytes32 eligibility_root_hash, uint32 max_scope_dimensions) external;

    function check(bytes32 principal_hash, address agent, address asset, address counterparty, bytes32 scope_hash, bytes32 eligibility_attestation_hash, uint64 expiry) external view returns (EligibilityVerdict memory);

    function getEligibilityRootHash() external view returns (bytes32);

    struct EngineVerdict {uint8 status;uint8 reason_code;bytes32 result_hash;bytes32 engine_version;uint64 expires_at;}

    struct EligibilityVerdict {EngineVerdict verdict;uint8 failed_dimension;bytes32 result_hash;}
}
