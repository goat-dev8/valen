interface IRiskEngine {
    function initialize(bytes32 engine_version, address authorized_caller, bytes32 active_risk_model_hash, uint16 low_threshold, uint16 medium_threshold, uint16 high_threshold, uint16 max_factor_count) external;

    function calculate(IntentContext intent, RiskFactors factors, bytes32 historical_summary_hash, bytes32 external_risk_attestation_hash, uint64 external_risk_expiry) external view returns (RiskVerdict memory);

    function getThresholds() external view returns (uint16, uint16, uint16);

    struct EngineVerdict {uint8 status;uint16 reason_code;bytes32 result_hash;bytes32 engine_version;uint64 expires_at;}

    struct RiskVerdict {uint16 score;uint8 tier;bool requires_approval;bytes32 result_hash;EngineVerdict verdict;}
}
