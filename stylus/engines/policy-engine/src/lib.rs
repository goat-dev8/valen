#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

extern crate alloc;

#[path = "../../shared/valen_abi.rs"]
mod valen_abi;

#[path = "PolicyEngine.rs"]
mod policy_engine;

pub use policy_engine::PolicyEngine;
