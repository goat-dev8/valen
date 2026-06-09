#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

extern crate alloc;

#[path = "../../shared/valen_abi.rs"]
mod valen_abi;

#[path = "RiskEngine.rs"]
mod risk_engine;

pub use risk_engine::RiskEngine;
