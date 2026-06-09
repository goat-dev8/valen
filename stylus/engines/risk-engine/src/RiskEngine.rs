extern crate alloc;

use alloy_primitives::{Address, B256};
use stylus_sdk::{
    alloy_primitives::U16,
    prelude::*,
    storage::{StorageAddress, StorageB256, StorageBool, StorageU16},
};

use crate::valen_abi::{IntentContext, RiskFactors, RiskVerdict};
use valen_stylus_common::{
    eval::{evaluate_risk, RiskInput},
    EngineError,
};

#[storage]
#[entrypoint]
pub struct RiskEngine {
    engine_version: StorageB256,
    authorized_caller: StorageAddress,
    active_risk_model_hash: StorageB256,
    low_threshold: StorageU16,
    medium_threshold: StorageU16,
    high_threshold: StorageU16,
    max_factor_count: StorageU16,
    active: StorageBool,
}

#[public]
impl RiskEngine {
    pub fn initialize(
        &mut self,
        engine_version: B256,
        authorized_caller: Address,
        active_risk_model_hash: B256,
        low_threshold: u16,
        medium_threshold: u16,
        high_threshold: u16,
        max_factor_count: u16,
    ) -> Result<(), Vec<u8>> {
        if !self.engine_version.get().is_zero() {
            return Err(EngineError::InvalidInput.encode());
        }
        if authorized_caller == Address::ZERO {
            return Err(EngineError::Unauthorized.encode());
        }
        self.engine_version.set(engine_version);
        self.authorized_caller.set(authorized_caller);
        self.active_risk_model_hash.set(active_risk_model_hash);
        self.low_threshold.set(U16::from(low_threshold));
        self.medium_threshold.set(U16::from(medium_threshold));
        self.high_threshold.set(U16::from(high_threshold));
        self.max_factor_count.set(U16::from(max_factor_count.max(1)));
        self.active.set(true);
        Ok(())
    }

    pub fn calculate(
        &self,
        intent: IntentContext,
        factors: RiskFactors,
        historical_summary_hash: B256,
        external_risk_attestation_hash: B256,
        external_risk_expiry: u64,
    ) -> Result<RiskVerdict, Vec<u8>> {
        self.only_authorized()?;
        if !self.active.get() {
            return Err(EngineError::Inactive.encode());
        }

        let now = self.vm().block_timestamp();
        let core_intent = valen_stylus_common::types::intent::IntentContext::from(intent);
        let core_factors = valen_stylus_common::types::intent::RiskFactors::from(factors);

        evaluate_risk(RiskInput {
            intent: &core_intent,
            factors: &core_factors,
            historical_summary_hash,
            external_risk_attestation_hash,
            external_risk_expiry,
            active_model_hash: self.active_risk_model_hash.get(),
            low_threshold: self.low_threshold.get().to::<u16>(),
            medium_threshold: self.medium_threshold.get().to::<u16>(),
            high_threshold: self.high_threshold.get().to::<u16>(),
            max_factor_count: self.max_factor_count.get().to::<u16>(),
            engine_version: self.engine_version.get(),
            now,
        })
        .map(RiskVerdict::from)
        .map_err(|error| error.encode())
    }

    pub fn get_thresholds(&self) -> Result<(u16, u16, u16), Vec<u8>> {
        Ok((
            self.low_threshold.get().to::<u16>(),
            self.medium_threshold.get().to::<u16>(),
            self.high_threshold.get().to::<u16>(),
        ))
    }
}

impl RiskEngine {
    fn only_authorized(&self) -> Result<(), Vec<u8>> {
        let caller = self.authorized_caller.get();
        if caller != Address::ZERO && caller != self.vm().msg_sender() {
            return Err(EngineError::Unauthorized.encode());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy_primitives::{address, b256, U256};
    use stylus_sdk::testing::TestVM;

    #[test]
    fn calculate_returns_bounded_score() {
        let vm = TestVM::new();
        vm.set_block_timestamp(1_700_000_000);
        let mut contract = RiskEngine::from(&vm);

        contract
            .initialize(
                b256!("0x00000000000000000000000000000000000000000000000000000000000000aa"),
                vm.msg_sender(),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000bb"),
                25,
                50,
                75,
                6,
            )
            .unwrap();

        let intent = IntentContext {
            execution_hash: b256!("0x0000000000000000000000000000000000000000000000000000000000000001"),
            organization_hash: b256!("0x0000000000000000000000000000000000000000000000000000000000000002"),
            agent: address!("0x0000000000000000000000000000000000000001"),
            mandate_id: b256!("0x0000000000000000000000000000000000000000000000000000000000000003"),
            action_type: b256!("0x0000000000000000000000000000000000000000000000000000000000000004"),
            target_chain_id: 421614,
            target: address!("0x0000000000000000000000000000000000000002"),
            asset: address!("0x0000000000000000000000000000000000000003"),
            amount: U256::from(1_000u64),
        };

        let factors = RiskFactors {
            amount_factor: 10,
            asset_factor: 20,
            counterparty_factor: 15,
            velocity_factor: 5,
            mandate_usage_factor: 10,
            anomaly_factor: 0,
        };

        let verdict = contract
            .calculate(
                intent,
                factors,
                b256!("0x00000000000000000000000000000000000000000000000000000000000000cc"),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000dd"),
                vm.block_timestamp() + 3600,
            )
            .unwrap();

        assert!(verdict.score <= 100);
        assert!(!verdict.result_hash.is_zero());
    }
}
