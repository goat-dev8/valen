interface IComplianceEngine {
    function initialize(bytes32 engine_version, address authorized_caller, bytes32 active_compliance_rule_hash, uint32 max_attestations, bytes32 reason_code_registry_hash) external;

    function setActive(bool active) external;

    function evaluate(IntentContext intent, ComplianceContext context, bytes32 mandate_status_hash, bytes32 eligibility_result_hash) external view returns (EngineVerdict memory, uint8);

    function getEngineVersion() external view returns (bytes32);

    function getActiveComplianceRuleHash() external view returns (bytes32);

    function getMaxAttestations() external view returns (uint32);
}
