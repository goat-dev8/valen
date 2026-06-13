#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

extern crate alloc;

#[path = "BudgetEngine.rs"]
mod budget_engine;

pub use budget_engine::BudgetEngine;
