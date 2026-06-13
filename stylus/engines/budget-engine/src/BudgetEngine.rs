extern crate alloc;

use alloy_primitives::{B256, U256};
use stylus_sdk::{
    prelude::*,
    storage::{StorageB256, StorageBool},
};

#[storage]
#[entrypoint]
pub struct BudgetEngine {
    engine_version: StorageB256,
    active: StorageBool,
}

#[public]
impl BudgetEngine {
    pub fn initialize(&mut self, engine_version: B256) -> Result<(), Vec<u8>> {
        if !self.engine_version.get().is_zero() {
            return Err(vec![1]);
        }
        self.engine_version.set(engine_version);
        self.active.set(true);
        Ok(())
    }

    /// Returns 0=allow, 1=refuse-cap, 2=period-reset.
    pub fn evaluate(
        &self,
        agent_key: B256,
        period_started_at: u64,
        period_seconds: u64,
        cap: U256,
        spent: U256,
        amount: U256,
        now: u64,
    ) -> Result<u8, Vec<u8>> {
        if agent_key.is_zero() || cap.is_zero() || amount.is_zero() || period_seconds == 0 {
            return Err(vec![2]);
        }
        if now >= period_started_at.saturating_add(period_seconds) {
            return Ok(2);
        }
        if spent.saturating_add(amount) > cap {
            return Ok(1);
        }
        Ok(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy_primitives::{b256, U256};
    use stylus_sdk::testing::TestVM;

    #[test]
    fn budget_engine_allows_under_cap() {
        let vm = TestVM::new();
        let contract = BudgetEngine::from(&vm);
        let verdict = contract
            .evaluate(
                b256!("0x0000000000000000000000000000000000000000000000000000000000000001"),
                1_700_000_000,
                86_400,
                U256::from(1_000u64),
                U256::from(100u64),
                U256::from(50u64),
                1_700_000_100,
            )
            .unwrap();
        assert_eq!(verdict, 0);
    }

    #[test]
    fn budget_engine_refuses_over_cap() {
        let vm = TestVM::new();
        let contract = BudgetEngine::from(&vm);
        let verdict = contract
            .evaluate(
                b256!("0x0000000000000000000000000000000000000000000000000000000000000001"),
                1_700_000_000,
                86_400,
                U256::from(1_000u64),
                U256::from(900u64),
                U256::from(101u64),
                1_700_000_100,
            )
            .unwrap();
        assert_eq!(verdict, 1);
    }

    #[test]
    fn budget_engine_flags_period_reset() {
        let vm = TestVM::new();
        let contract = BudgetEngine::from(&vm);
        let verdict = contract
            .evaluate(
                b256!("0x0000000000000000000000000000000000000000000000000000000000000001"),
                1_700_000_000,
                86_400,
                U256::from(1_000u64),
                U256::from(900u64),
                U256::from(101u64),
                1_700_086_401,
            )
            .unwrap();
        assert_eq!(verdict, 2);
    }
}
