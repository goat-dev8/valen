interface IPolicyEngine {
    function initialize(bytes32 engine_version, address authorized_caller, bytes32 active_policy_registry, uint32 max_rules, uint32 max_time_window_count) external;

    function evaluate(IntentContext intent, PolicyFacts facts, uint8 risk_tier, uint16 risk_score, bytes32[] memory rule_commitment_hashes) external view returns (PolicyVerdict memory);

    function getActivePolicyRegistry() external view returns (bytes32);

    struct EngineVerdict {uint8 status;uint8 reason_code;bytes32 result_hash;bytes32 engine_version;uint64 expires_at;}

    struct PolicyVerdict {EngineVerdict verdict;uint8 policy_reason;uint8 approval_level;bytes32 result_hash;}
}
