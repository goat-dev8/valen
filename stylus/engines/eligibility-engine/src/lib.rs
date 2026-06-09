#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

extern crate alloc;

#[path = "../../shared/valen_abi.rs"]
mod valen_abi;

#[path = "EligibilityEngine.rs"]
mod eligibility_engine;

pub use eligibility_engine::EligibilityEngine;
