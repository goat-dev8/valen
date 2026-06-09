use alloy_primitives::{Address, B256};

use crate::errors::EngineError;
use crate::types::intent::bind_result_hash;
use crate::types::reason_code::{ComplianceReason, EligibilityDimension, VerdictStatus};
use crate::types::verdict::{EligibilityVerdict, EngineVerdict};

pub struct EligibilityInput {
    pub principal_hash: B256,
    pub agent: Address,
    pub asset: Address,
    pub counterparty: Address,
    pub scope_hash: B256,
    pub eligibility_attestation_hash: B256,
    pub expiry: u64,
    pub eligibility_root_hash: B256,
    pub max_scope_dimensions: u32,
    pub engine_version: B256,
    pub now: u64,
}

pub fn evaluate_eligibility(input: EligibilityInput) -> Result<EligibilityVerdict, EngineError> {
    if input.principal_hash.is_zero() {
        return fail(input, EligibilityDimension::Principal);
    }

    if input.agent == Address::ZERO {
        return fail(input, EligibilityDimension::Agent);
    }

    if input.asset == Address::ZERO {
        return fail(input, EligibilityDimension::Asset);
    }

    if input.counterparty == Address::ZERO {
        return fail(input, EligibilityDimension::Counterparty);
    }

    if input.scope_hash.is_zero() {
        return fail(input, EligibilityDimension::Scope);
    }

    if input.eligibility_attestation_hash.is_zero() {
        return fail(input, EligibilityDimension::Attestation);
    }

    if input.expiry <= input.now {
        return fail(input, EligibilityDimension::Attestation);
    }

    if input.max_scope_dimensions == 0 {
        return Err(EngineError::InvalidInput);
    }

    let input_hashes = [
        input.principal_hash,
        input.scope_hash,
        input.eligibility_attestation_hash,
        input.eligibility_root_hash,
    ];
    let result_hash = bind_result_hash(
        input.engine_version,
        input.eligibility_root_hash,
        &input_hashes,
    );

    let verdict = EngineVerdict::pass(
        input.engine_version,
        result_hash,
        input.expiry,
        ComplianceReason::Compliant as u8,
    );

    Ok(EligibilityVerdict {
        verdict,
        failed_dimension: EligibilityDimension::None as u8,
        result_hash,
    })
}

fn fail(input: EligibilityInput, dimension: EligibilityDimension) -> Result<EligibilityVerdict, EngineError> {
    let input_hashes = [input.principal_hash, input.scope_hash];
    let result_hash = bind_result_hash(
        input.engine_version,
        input.eligibility_root_hash,
        &input_hashes,
    );

    Ok(EligibilityVerdict {
        verdict: EngineVerdict {
            status: VerdictStatus::Fail as u8,
            reason_code: ComplianceReason::IdentityNotFound as u8,
            result_hash,
            engine_version: input.engine_version,
            expires_at: 0,
        },
        failed_dimension: dimension as u8,
        result_hash,
    })
}
