use alloy_primitives::B256;

use crate::errors::EngineError;
use crate::types::intent::{bind_result_hash, IntentContext, PolicyFacts};
use crate::types::reason_code::{PolicyReason, RiskTier, VerdictStatus};
use crate::types::verdict::{EngineVerdict, PolicyVerdict};

pub struct PolicyInput<'a> {
    pub intent: &'a IntentContext,
    pub facts: &'a PolicyFacts,
    pub risk_tier: u8,
    pub risk_score: u16,
    pub rule_commitment_hashes: &'a [B256],
    pub active_policy_hash: B256,
    pub max_rules: u32,
    pub engine_version: B256,
}

pub fn evaluate_policy(input: PolicyInput<'_>) -> Result<PolicyVerdict, EngineError> {
    if !input.intent.required_fields_valid() {
        return Err(EngineError::InvalidInput);
    }

    if input.facts.policy_version_hash.is_zero() {
        return Err(EngineError::PolicyInactive);
    }

    if input.facts.policy_version_hash != input.active_policy_hash && !input.active_policy_hash.is_zero()
    {
        return Err(EngineError::PolicyInactive);
    }

    if input.facts.compliance_hash.is_zero() || input.facts.risk_hash.is_zero() {
        return Err(EngineError::ComplianceNotPass);
    }

    let tier = RiskTier::from_u8(input.risk_tier);
    if tier.requires_approval() && input.risk_score > 100 {
        return Err(EngineError::RiskInconsistent);
    }

    if input.rule_commitment_hashes.len() > input.max_rules as usize {
        return Err(EngineError::InvalidInput);
    }

    for rule_hash in input.rule_commitment_hashes {
        if rule_hash.is_zero() {
            return rejected(
                input,
                PolicyReason::ActionNotAllowed,
                VerdictStatus::Fail,
                0,
            );
        }
    }

    if tier.requires_approval() {
        return rejected(
            input,
            PolicyReason::ApprovalRequired,
            VerdictStatus::ApprovalRequired,
            2,
        );
    }

    let input_hashes = [
        input.intent.execution_hash,
        input.facts.compliance_hash,
        input.facts.risk_hash,
        input.facts.policy_version_hash,
        input.facts.mandate_scope_hash,
    ];
    let result_hash = bind_result_hash(
        input.engine_version,
        input.active_policy_hash,
        &input_hashes,
    );

    let verdict = EngineVerdict::pass(
        input.engine_version,
        result_hash,
        input.facts.time_bucket,
        PolicyReason::Approved as u8,
    );

    Ok(PolicyVerdict {
        verdict,
        policy_reason: PolicyReason::Approved as u8,
        approval_level: 0,
        result_hash,
    })
}

fn rejected(
    input: PolicyInput<'_>,
    reason: PolicyReason,
    status: VerdictStatus,
    approval_level: u8,
) -> Result<PolicyVerdict, EngineError> {
    let input_hashes = [
        input.intent.execution_hash,
        input.facts.compliance_hash,
        input.facts.risk_hash,
    ];
    let result_hash = bind_result_hash(
        input.engine_version,
        input.active_policy_hash,
        &input_hashes,
    );

    let verdict = EngineVerdict {
        status: status as u8,
        reason_code: reason as u8,
        result_hash,
        engine_version: input.engine_version,
        expires_at: input.facts.time_bucket,
    };

    Ok(PolicyVerdict {
        verdict,
        policy_reason: reason as u8,
        approval_level,
        result_hash,
    })
}
