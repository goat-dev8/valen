use alloy_primitives::{B256, U256};

use crate::errors::EngineError;
use crate::types::intent::{bind_result_hash, IntentContext, RiskFactors};
use crate::types::reason_code::{ComplianceReason, RiskTier, VerdictStatus};
use crate::types::verdict::{EngineVerdict, RiskVerdict};

pub struct RiskInput<'a> {
    pub intent: &'a IntentContext,
    pub factors: &'a RiskFactors,
    pub historical_summary_hash: B256,
    pub external_risk_attestation_hash: B256,
    pub external_risk_expiry: u64,
    pub active_model_hash: B256,
    pub low_threshold: u16,
    pub medium_threshold: u16,
    pub high_threshold: u16,
    pub max_factor_count: u16,
    pub engine_version: B256,
    pub now: u64,
}

const MAX_FACTOR_VALUE: u16 = 100;
const WEIGHTS: [u16; 6] = [20, 15, 20, 15, 15, 15];

pub fn evaluate_risk(input: RiskInput<'_>) -> Result<RiskVerdict, EngineError> {
    if !input.intent.required_fields_valid() {
        return Err(EngineError::InvalidInput);
    }

    if input.external_risk_attestation_hash.is_zero() || input.historical_summary_hash.is_zero() {
        return Err(EngineError::InvalidInput);
    }

    if input.external_risk_expiry <= input.now {
        return Err(EngineError::RiskAttestationExpired);
    }

    let factor_values = [
        input.factors.amount_factor,
        input.factors.asset_factor,
        input.factors.counterparty_factor,
        input.factors.velocity_factor,
        input.factors.mandate_usage_factor,
        input.factors.anomaly_factor,
    ];

    let active_factors = factor_values
        .iter()
        .filter(|value| **value > 0)
        .count() as u16;

    if active_factors > input.max_factor_count.max(1) {
        return Err(EngineError::FactorOutOfRange);
    }

    for value in factor_values {
        if value > MAX_FACTOR_VALUE {
            return Err(EngineError::FactorOutOfRange);
        }
    }

    let mut weighted_sum: u32 = 0;
    let mut weight_total: u32 = 0;
    for (value, weight) in factor_values.iter().zip(WEIGHTS.iter()) {
        if *value == 0 {
            continue;
        }
        weighted_sum = weighted_sum.saturating_add(u32::from(*value) * u32::from(*weight));
        weight_total = weight_total.saturating_add(u32::from(*weight));
    }

    let base_score = if weight_total == 0 {
        0
    } else {
        (weighted_sum / weight_total).min(100) as u16
    };

    let correlation_adjustment = if input.factors.anomaly_factor > 50 {
        10u16
    } else {
        0
    };

    let score = base_score.saturating_add(correlation_adjustment).min(100);

    let tier = RiskTier::from_score(
        score,
        input.low_threshold,
        input.medium_threshold,
        input.high_threshold,
    );

    let requires_approval = tier.requires_approval();

    let input_hashes = [
        input.intent.execution_hash,
        input.historical_summary_hash,
        input.external_risk_attestation_hash,
        B256::from(U256::from(score)),
    ];
    let result_hash = bind_result_hash(
        input.engine_version,
        input.active_model_hash,
        &input_hashes,
    );

    let status = if requires_approval {
        VerdictStatus::ApprovalRequired
    } else {
        VerdictStatus::Pass
    };

    let verdict = EngineVerdict {
        status: status as u8,
        reason_code: ComplianceReason::Compliant as u8,
        result_hash,
        engine_version: input.engine_version,
        expires_at: input.external_risk_expiry,
    };

    Ok(RiskVerdict {
        score,
        tier: tier as u8,
        requires_approval,
        result_hash,
        verdict,
    })
}
