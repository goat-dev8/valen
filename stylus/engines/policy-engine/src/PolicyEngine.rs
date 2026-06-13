extern crate alloc;

use alloy_primitives::{Address, B256};
use stylus_sdk::{
    alloy_primitives::U32,
    prelude::*,
    storage::{StorageAddress, StorageB256, StorageBool, StorageU32},
};

use crate::valen_abi::{IntentContext, PolicyFacts, PolicyVerdict};
use valen_stylus_common::{
    eval::{evaluate_policy, PolicyInput},
    EngineError,
};

#[storage]
#[entrypoint]
pub struct PolicyEngine {
    engine_version: StorageB256,
    authorized_caller: StorageAddress,
    active_policy_registry: StorageB256,
    max_rules: StorageU32,
    max_time_window_count: StorageU32,
    active: StorageBool,
}

#[public]
impl PolicyEngine {
    pub fn initialize(
        &mut self,
        engine_version: B256,
        authorized_caller: Address,
        active_policy_registry: B256,
        max_rules: u32,
        max_time_window_count: u32,
    ) -> Result<(), Vec<u8>> {
        if !self.engine_version.get().is_zero() {
            return Err(EngineError::InvalidInput.encode());
        }
        if authorized_caller == Address::ZERO {
            return Err(EngineError::Unauthorized.encode());
        }
        self.engine_version.set(engine_version);
        self.authorized_caller.set(authorized_caller);
        self.active_policy_registry.set(active_policy_registry);
        self.max_rules.set(U32::from(max_rules.max(1)));
        self.max_time_window_count
            .set(U32::from(max_time_window_count.max(1)));
        self.active.set(true);
        Ok(())
    }

    pub fn evaluate(
        &self,
        intent: IntentContext,
        facts: PolicyFacts,
        risk_tier: u8,
        risk_score: u16,
        rule_commitment_hashes: Vec<B256>,
    ) -> Result<PolicyVerdict, Vec<u8>> {
        self.only_authorized()?;
        if !self.active.get() {
            return Err(EngineError::Inactive.encode());
        }

        if rule_commitment_hashes.len() > self.max_rules.get().to::<u32>() as usize {
            return Err(EngineError::InvalidInput.encode());
        }

        let core_intent = valen_stylus_common::types::intent::IntentContext::from(intent);
        let core_facts = valen_stylus_common::types::intent::PolicyFacts::from(facts);

        evaluate_policy(PolicyInput {
            intent: &core_intent,
            facts: &core_facts,
            risk_tier,
            risk_score,
            rule_commitment_hashes: &rule_commitment_hashes,
            active_policy_hash: self.active_policy_registry.get(),
            max_rules: self.max_rules.get().to::<u32>(),
            engine_version: self.engine_version.get(),
        })
        .map(PolicyVerdict::from)
        .map_err(|error| error.encode())
    }

    pub fn get_active_policy_registry(&self) -> Result<B256, Vec<u8>> {
        Ok(self.active_policy_registry.get())
    }

    pub fn evaluate_robinhood_policy(
        &self,
        mandate: B256,
        asset_key: B256,
        amount: alloy_primitives::U256,
        timestamp: u64,
    ) -> Result<u8, Vec<u8>> {
        if mandate.is_zero() || asset_key.is_zero() {
            return Ok(3);
        }
        if timestamp == 0 {
            return Ok(1);
        }
        if amount > alloy_primitives::U256::from(100u64) {
            return Ok(2);
        }
        Ok(0)
    }
}

impl PolicyEngine {
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
    use valen_stylus_common::types::reason_code::{PolicyReason, RiskTier, VerdictStatus};

    #[test]
    fn evaluate_requires_approval_for_high_risk() {
        let vm = TestVM::new();
        let mut contract = PolicyEngine::from(&vm);

        let policy_hash =
            b256!("0x00000000000000000000000000000000000000000000000000000000000000aa");
        contract
            .initialize(
                b256!("0x00000000000000000000000000000000000000000000000000000000000000bb"),
                vm.msg_sender(),
                policy_hash,
                16,
                8,
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

        let facts = PolicyFacts {
            compliance_hash: b256!("0x00000000000000000000000000000000000000000000000000000000000000cc"),
            risk_hash: b256!("0x00000000000000000000000000000000000000000000000000000000000000dd"),
            policy_version_hash: policy_hash,
            mandate_scope_hash: b256!("0x00000000000000000000000000000000000000000000000000000000000000ee"),
            time_bucket: 1_700_000_000,
        };

        let verdict = contract
            .evaluate(
                intent,
                facts,
                RiskTier::High as u8,
                80,
                vec![b256!(
                    "0x00000000000000000000000000000000000000000000000000000000000000ff"
                )],
            )
            .unwrap();

        assert_eq!(verdict.verdict.status, VerdictStatus::ApprovalRequired as u8);
        assert_eq!(verdict.policy_reason, PolicyReason::ApprovalRequired as u8);
    }

    #[test]
    fn robinhood_policy_returns_all_phase_d_verdicts() {
        let vm = TestVM::new();
        let contract = PolicyEngine::from(&vm);
        let mandate =
            b256!("0x0000000000000000000000000000000000000000000000000000000000000001");
        let asset_key =
            b256!("0x0000000000000000000000000000000000000000000000000000000000000002");

        assert_eq!(
            contract
                .evaluate_robinhood_policy(mandate, asset_key, U256::from(10u64), 1)
                .unwrap(),
            0
        );
        assert_eq!(
            contract
                .evaluate_robinhood_policy(mandate, asset_key, U256::from(10u64), 0)
                .unwrap(),
            1
        );
        assert_eq!(
            contract
                .evaluate_robinhood_policy(mandate, asset_key, U256::from(250u64), 1)
                .unwrap(),
            2
        );
        assert_eq!(
            contract
                .evaluate_robinhood_policy(B256::ZERO, asset_key, U256::from(10u64), 1)
                .unwrap(),
            3
        );
    }
}
