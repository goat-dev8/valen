//! Solidity ABI types shared across VALEN Stylus engine crates.

use stylus_sdk::{alloy_primitives::U256, alloy_sol_types::sol, prelude::*};

sol! {
    #[derive(AbiType)]
    struct IntentContext {
        bytes32 execution_hash;
        bytes32 organization_hash;
        address agent;
        bytes32 mandate_id;
        bytes32 action_type;
        uint64 target_chain_id;
        address target;
        address asset;
        uint256 amount;
    }

    #[derive(AbiType)]
    struct ComplianceContext {
        bytes32 principal_hash;
        bytes32 jurisdiction_hash;
        address counterparty;
        bytes32[] attestation_hashes;
        uint64[] attestation_expiries;
    }

    #[derive(AbiType)]
    struct RiskFactors {
        uint16 amount_factor;
        uint16 asset_factor;
        uint16 counterparty_factor;
        uint16 velocity_factor;
        uint16 mandate_usage_factor;
        uint16 anomaly_factor;
    }

    #[derive(AbiType)]
    struct PolicyFacts {
        bytes32 compliance_hash;
        bytes32 risk_hash;
        bytes32 policy_version_hash;
        bytes32 mandate_scope_hash;
        uint64 time_bucket;
    }

    #[derive(AbiType)]
    struct EngineVerdict {
        uint8 status;
        uint16 reason_code;
        bytes32 result_hash;
        bytes32 engine_version;
        uint64 expires_at;
    }

    #[derive(AbiType)]
    struct RiskVerdict {
        uint16 score;
        uint8 tier;
        bool requires_approval;
        bytes32 result_hash;
        EngineVerdict verdict;
    }

    #[derive(AbiType)]
    struct EligibilityVerdict {
        EngineVerdict verdict;
        bytes32 failed_dimension;
    }

    #[derive(AbiType)]
    struct PolicyVerdict {
        EngineVerdict verdict;
        uint8 policy_reason;
        uint8 approval_level;
    }
}

use valen_stylus_common::types::intent::{
    ComplianceContext as CoreComplianceContext, IntentContext as CoreIntentContext,
    PolicyFacts as CorePolicyFacts, RiskFactors as CoreRiskFactors,
};
use valen_stylus_common::types::verdict::{
    EligibilityVerdict as CoreEligibilityVerdict, EngineVerdict as CoreEngineVerdict,
    PolicyVerdict as CorePolicyVerdict, RiskVerdict as CoreRiskVerdict,
};

impl From<IntentContext> for CoreIntentContext {
    fn from(value: IntentContext) -> Self {
        Self {
            execution_hash: value.execution_hash,
            organization_hash: value.organization_hash,
            agent: value.agent,
            mandate_id: value.mandate_id,
            action_type: value.action_type,
            target_chain_id: value.target_chain_id,
            target: value.target,
            asset: value.asset,
            amount: value.amount,
        }
    }
}

impl From<CoreIntentContext> for IntentContext {
    fn from(value: CoreIntentContext) -> Self {
        Self {
            execution_hash: value.execution_hash,
            organization_hash: value.organization_hash,
            agent: value.agent,
            mandate_id: value.mandate_id,
            action_type: value.action_type,
            target_chain_id: value.target_chain_id,
            target: value.target,
            asset: value.asset,
            amount: value.amount,
        }
    }
}

impl From<ComplianceContext> for CoreComplianceContext {
    fn from(value: ComplianceContext) -> Self {
        Self {
            principal_hash: value.principal_hash,
            jurisdiction_hash: value.jurisdiction_hash,
            counterparty: value.counterparty,
            attestation_hashes: value.attestation_hashes,
            attestation_expiries: value.attestation_expiries,
        }
    }
}

impl From<CoreComplianceContext> for ComplianceContext {
    fn from(value: CoreComplianceContext) -> Self {
        Self {
            principal_hash: value.principal_hash,
            jurisdiction_hash: value.jurisdiction_hash,
            counterparty: value.counterparty,
            attestation_hashes: value.attestation_hashes,
            attestation_expiries: value.attestation_expiries,
        }
    }
}

impl From<RiskFactors> for CoreRiskFactors {
    fn from(value: RiskFactors) -> Self {
        Self {
            amount_factor: value.amount_factor,
            asset_factor: value.asset_factor,
            counterparty_factor: value.counterparty_factor,
            velocity_factor: value.velocity_factor,
            mandate_usage_factor: value.mandate_usage_factor,
            anomaly_factor: value.anomaly_factor,
        }
    }
}

impl From<PolicyFacts> for CorePolicyFacts {
    fn from(value: PolicyFacts) -> Self {
        Self {
            compliance_hash: value.compliance_hash,
            risk_hash: value.risk_hash,
            policy_version_hash: value.policy_version_hash,
            mandate_scope_hash: value.mandate_scope_hash,
            time_bucket: value.time_bucket,
        }
    }
}

impl From<CoreEngineVerdict> for EngineVerdict {
    fn from(value: CoreEngineVerdict) -> Self {
        Self {
            status: value.status,
            reason_code: value.reason_code as u16,
            result_hash: value.result_hash,
            engine_version: value.engine_version,
            expires_at: value.expires_at,
        }
    }
}

impl From<CoreRiskVerdict> for RiskVerdict {
    fn from(value: CoreRiskVerdict) -> Self {
        Self {
            score: value.score,
            tier: value.tier,
            requires_approval: value.requires_approval,
            result_hash: value.result_hash,
            verdict: value.verdict.into(),
        }
    }
}

impl From<CoreEligibilityVerdict> for EligibilityVerdict {
    fn from(value: CoreEligibilityVerdict) -> Self {
        Self {
            verdict: value.verdict.into(),
            failed_dimension: alloy_primitives::B256::from(U256::from(value.failed_dimension)),
        }
    }
}

impl From<CorePolicyVerdict> for PolicyVerdict {
    fn from(value: CorePolicyVerdict) -> Self {
        Self {
            verdict: value.verdict.into(),
            policy_reason: value.policy_reason,
            approval_level: value.approval_level,
        }
    }
}
