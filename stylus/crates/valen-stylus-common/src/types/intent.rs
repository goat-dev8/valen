use alloy_primitives::{Address, B256, U256};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IntentContext {
    pub execution_hash: B256,
    pub organization_hash: B256,
    pub agent: Address,
    pub mandate_id: B256,
    pub action_type: B256,
    pub target_chain_id: u64,
    pub target: Address,
    pub asset: Address,
    pub amount: U256,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ComplianceContext {
    pub principal_hash: B256,
    pub jurisdiction_hash: B256,
    pub counterparty: Address,
    pub attestation_hashes: alloc::vec::Vec<B256>,
    pub attestation_expiries: alloc::vec::Vec<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RiskFactors {
    pub amount_factor: u16,
    pub asset_factor: u16,
    pub counterparty_factor: u16,
    pub velocity_factor: u16,
    pub mandate_usage_factor: u16,
    pub anomaly_factor: u16,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PolicyFacts {
    pub compliance_hash: B256,
    pub risk_hash: B256,
    pub policy_version_hash: B256,
    pub mandate_scope_hash: B256,
    pub time_bucket: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineHeader {
    pub engine_version: B256,
    pub policy_hash: B256,
    pub valid_until: u64,
}

impl IntentContext {
    pub fn required_fields_valid(&self) -> bool {
        !self.execution_hash.is_zero()
            && !self.organization_hash.is_zero()
            && self.agent != Address::ZERO
            && !self.mandate_id.is_zero()
            && !self.action_type.is_zero()
            && self.target_chain_id > 0
            && self.target != Address::ZERO
            && self.asset != Address::ZERO
            && !self.amount.is_zero()
    }
}

impl ComplianceContext {
    pub fn attestation_arrays_aligned(&self) -> bool {
        self.attestation_hashes.len() == self.attestation_expiries.len()
    }
}

/// Deterministic keccak256 over ordered 32-byte words.
pub fn hash_words(words: &[B256]) -> B256 {
    let mut buf = alloc::vec::Vec::with_capacity(words.len() * 32);
    for word in words {
        buf.extend_from_slice(word.as_slice());
    }
    alloy_primitives::keccak256(buf)
}

/// Bind engine output to inputs, model hash, and engine version.
pub fn bind_result_hash(
    engine_version: B256,
    model_or_policy_hash: B256,
    input_hashes: &[B256],
) -> B256 {
    let mut words = alloc::vec::Vec::with_capacity(2 + input_hashes.len());
    words.push(engine_version);
    words.push(model_or_policy_hash);
    words.extend_from_slice(input_hashes);
    hash_words(&words)
}

extern crate alloc;
