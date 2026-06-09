extern crate alloc;

use alloy_primitives::{Address, B256};
use stylus_sdk::{
    alloy_primitives::U32,
    prelude::*,
    storage::{StorageAddress, StorageB256, StorageBool, StorageU32},
};

use crate::valen_abi::EligibilityVerdict;
use valen_stylus_common::{
    eval::{evaluate_eligibility, EligibilityInput},
    EngineError,
};

#[storage]
#[entrypoint]
pub struct EligibilityEngine {
    engine_version: StorageB256,
    authorized_caller: StorageAddress,
    eligibility_root_hash: StorageB256,
    max_scope_dimensions: StorageU32,
    active: StorageBool,
}

#[public]
impl EligibilityEngine {
    pub fn initialize(
        &mut self,
        engine_version: B256,
        authorized_caller: Address,
        eligibility_root_hash: B256,
        max_scope_dimensions: u32,
    ) -> Result<(), Vec<u8>> {
        if !self.engine_version.get().is_zero() {
            return Err(EngineError::InvalidInput.encode());
        }
        if authorized_caller == Address::ZERO {
            return Err(EngineError::Unauthorized.encode());
        }
        self.engine_version.set(engine_version);
        self.authorized_caller.set(authorized_caller);
        self.eligibility_root_hash.set(eligibility_root_hash);
        self.max_scope_dimensions
            .set(U32::from(max_scope_dimensions.max(1)));
        self.active.set(true);
        Ok(())
    }

    pub fn check(
        &self,
        principal_hash: B256,
        agent: Address,
        asset: Address,
        counterparty: Address,
        scope_hash: B256,
        eligibility_attestation_hash: B256,
        expiry: u64,
    ) -> Result<EligibilityVerdict, Vec<u8>> {
        self.only_authorized()?;
        if !self.active.get() {
            return Err(EngineError::Inactive.encode());
        }

        let now = self.vm().block_timestamp();

        evaluate_eligibility(EligibilityInput {
            principal_hash,
            agent,
            asset,
            counterparty,
            scope_hash,
            eligibility_attestation_hash,
            expiry,
            eligibility_root_hash: self.eligibility_root_hash.get(),
            max_scope_dimensions: self.max_scope_dimensions.get().to::<u32>(),
            engine_version: self.engine_version.get(),
            now,
        })
        .map(EligibilityVerdict::from)
        .map_err(|error| error.encode())
    }

    pub fn get_eligibility_root_hash(&self) -> Result<B256, Vec<u8>> {
        Ok(self.eligibility_root_hash.get())
    }
}

impl EligibilityEngine {
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
    use valen_stylus_common::types::reason_code::{EligibilityDimension, VerdictStatus};

    #[test]
    fn check_passes_for_valid_dimensions() {
        let vm = TestVM::new();
        vm.set_block_timestamp(1_700_000_000);
        let mut contract = EligibilityEngine::from(&vm);

        contract
            .initialize(
                b256!("0x00000000000000000000000000000000000000000000000000000000000000aa"),
                vm.msg_sender(),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000bb"),
                8,
            )
            .unwrap();

        let verdict = contract
            .check(
                b256!("0x00000000000000000000000000000000000000000000000000000000000000cc"),
                address!("0x0000000000000000000000000000000000000001"),
                address!("0x0000000000000000000000000000000000000002"),
                address!("0x0000000000000000000000000000000000000003"),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000dd"),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000ee"),
                vm.block_timestamp() + 3600,
            )
            .unwrap();

        assert_eq!(
            verdict.failed_dimension,
            B256::from(U256::from(EligibilityDimension::None as u8))
        );
        assert_eq!(verdict.verdict.status, VerdictStatus::Pass as u8);
    }
}
