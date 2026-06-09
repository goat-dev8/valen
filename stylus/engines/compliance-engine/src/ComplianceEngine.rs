extern crate alloc;

use alloy_primitives::{Address, B256};
use stylus_sdk::{
    alloy_primitives::U32,
    prelude::*,
    storage::{StorageAddress, StorageB256, StorageBool, StorageU32},
};

use crate::valen_abi::{ComplianceContext, EngineVerdict, IntentContext};
use valen_stylus_common::{
    eval::{evaluate_compliance, ComplianceInput},
    EngineError,
};

#[storage]
#[entrypoint]
pub struct ComplianceEngine {
    engine_version: StorageB256,
    authorized_caller: StorageAddress,
    active_compliance_rule_hash: StorageB256,
    max_attestations: StorageU32,
    reason_code_registry_hash: StorageB256,
    active: StorageBool,
}

#[public]
impl ComplianceEngine {
    pub fn initialize(
        &mut self,
        engine_version: B256,
        authorized_caller: Address,
        active_compliance_rule_hash: B256,
        max_attestations: u32,
        reason_code_registry_hash: B256,
    ) -> Result<(), Vec<u8>> {
        if !self.engine_version.get().is_zero() {
            return Err(EngineError::InvalidInput.encode());
        }
        if authorized_caller == Address::ZERO {
            return Err(EngineError::Unauthorized.encode());
        }
        self.engine_version.set(engine_version);
        self.authorized_caller.set(authorized_caller);
        self.active_compliance_rule_hash
            .set(active_compliance_rule_hash);
        self.max_attestations
            .set(U32::from(max_attestations.max(1)));
        self.reason_code_registry_hash
            .set(reason_code_registry_hash);
        self.active.set(true);
        Ok(())
    }

    pub fn set_active(&mut self, active: bool) -> Result<(), Vec<u8>> {
        self.only_authorized()?;
        self.active.set(active);
        Ok(())
    }

    pub fn evaluate(
        &self,
        intent: IntentContext,
        context: ComplianceContext,
        mandate_status_hash: B256,
        eligibility_result_hash: B256,
    ) -> Result<(EngineVerdict, u8), Vec<u8>> {
        self.only_authorized()?;
        if !self.active.get() {
            return Err(EngineError::Inactive.encode());
        }

        let now = self.vm().block_timestamp();
        let core_intent = valen_stylus_common::types::intent::IntentContext::from(intent);
        let core_context =
            valen_stylus_common::types::intent::ComplianceContext::from(context);

        match evaluate_compliance(ComplianceInput {
            intent: &core_intent,
            context: &core_context,
            mandate_status_hash,
            eligibility_result_hash,
            active_rule_hash: self.active_compliance_rule_hash.get(),
            max_attestations: self.max_attestations.get().to::<u32>(),
            engine_version: self.engine_version.get(),
            now,
        }) {
            Ok((verdict, reason)) => Ok((verdict.into(), reason as u8)),
            Err(error) => {
                let reason = error.to_compliance_reason();
                let verdict = valen_stylus_common::types::verdict::EngineVerdict::fail(
                    self.engine_version.get(),
                    B256::ZERO,
                    0,
                    reason as u8,
                );
                Ok((verdict.into(), reason as u8))
            }
        }
    }

    pub fn get_engine_version(&self) -> Result<B256, Vec<u8>> {
        Ok(self.engine_version.get())
    }

    pub fn get_active_compliance_rule_hash(&self) -> Result<B256, Vec<u8>> {
        Ok(self.active_compliance_rule_hash.get())
    }

    pub fn get_max_attestations(&self) -> Result<u32, Vec<u8>> {
        Ok(self.max_attestations.get().to::<u32>())
    }
}

impl ComplianceEngine {
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
    use valen_stylus_common::types::reason_code::ComplianceReason;

    #[test]
    fn evaluate_passes_with_valid_attestations() {
        let vm = TestVM::new();
        vm.set_block_timestamp(1_700_000_000);
        let mut contract = ComplianceEngine::from(&vm);

        contract
            .initialize(
                b256!("0x00000000000000000000000000000000000000000000000000000000000000aa"),
                vm.msg_sender(),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000bb"),
                8,
                B256::ZERO,
            )
            .unwrap();

        let context = ComplianceContext {
            principal_hash: b256!("0x00000000000000000000000000000000000000000000000000000000000000cc"),
            jurisdiction_hash: b256!("0x00000000000000000000000000000000000000000000000000000000000000bb"),
            counterparty: address!("0x0000000000000000000000000000000000000004"),
            attestation_hashes: vec![b256!(
                "0x00000000000000000000000000000000000000000000000000000000000000dd"
            )],
            attestation_expiries: vec![vm.block_timestamp() + 3600],
        };

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

        let (verdict, reason) = contract
            .evaluate(
                intent,
                context,
                b256!("0x00000000000000000000000000000000000000000000000000000000000000ee"),
                b256!("0x00000000000000000000000000000000000000000000000000000000000000ff"),
            )
            .unwrap();

        assert_eq!(reason, ComplianceReason::Compliant as u8);
        assert!(!verdict.result_hash.is_zero());
    }
}
