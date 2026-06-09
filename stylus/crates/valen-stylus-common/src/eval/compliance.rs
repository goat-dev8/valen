use alloy_primitives::{Address, B256};

use crate::errors::EngineError;
use crate::types::intent::{bind_result_hash, ComplianceContext, IntentContext};
use crate::types::reason_code::ComplianceReason;
use crate::types::verdict::EngineVerdict;

pub struct ComplianceInput<'a> {
    pub intent: &'a IntentContext,
    pub context: &'a ComplianceContext,
    pub mandate_status_hash: B256,
    pub eligibility_result_hash: B256,
    pub active_rule_hash: B256,
    pub max_attestations: u32,
    pub engine_version: B256,
    pub now: u64,
}

pub fn evaluate_compliance(input: ComplianceInput<'_>) -> Result<(EngineVerdict, ComplianceReason), EngineError> {
    if !input.intent.required_fields_valid() {
        return Err(EngineError::InvalidInput);
    }

    if input.mandate_status_hash.is_zero() || input.eligibility_result_hash.is_zero() {
        return Err(EngineError::MandateInvalid);
    }

    if input.context.principal_hash.is_zero() || input.context.jurisdiction_hash.is_zero() {
        return Err(EngineError::InvalidInput);
    }

    if input.context.counterparty == Address::ZERO {
        return Err(EngineError::InvalidInput);
    }

    if !input.context.attestation_arrays_aligned() {
        return Err(EngineError::AttestationMisaligned);
    }

    let attestation_count = input.context.attestation_hashes.len();
    if attestation_count == 0 {
        return Err(EngineError::InvalidInput);
    }

    if attestation_count > input.max_attestations as usize {
        return Err(EngineError::AttestationLimitExceeded);
    }

    let mut min_expiry = u64::MAX;
    for (hash, expiry) in input
        .context
        .attestation_hashes
        .iter()
        .zip(input.context.attestation_expiries.iter())
    {
        if hash.is_zero() {
            return Err(EngineError::InvalidInput);
        }
        if *expiry <= input.now {
            return Err(EngineError::AttestationExpired);
        }
        min_expiry = min_expiry.min(*expiry);
    }

    if input.context.jurisdiction_hash != input.active_rule_hash && !input.active_rule_hash.is_zero() {
        return Err(EngineError::HashMismatch);
    }

    let input_hashes = [
        input.intent.execution_hash,
        input.context.principal_hash,
        input.context.jurisdiction_hash,
        input.mandate_status_hash,
        input.eligibility_result_hash,
    ];
    let result_hash = bind_result_hash(
        input.engine_version,
        input.active_rule_hash,
        &input_hashes,
    );

    let verdict = EngineVerdict::pass(
        input.engine_version,
        result_hash,
        min_expiry,
        ComplianceReason::Compliant as u8,
    );

    Ok((verdict, ComplianceReason::Compliant))
}
