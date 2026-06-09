#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]

extern crate alloc;

#[path = "../../shared/valen_abi.rs"]
mod valen_abi;

#[path = "ComplianceEngine.rs"]
mod compliance_engine;

pub use compliance_engine::ComplianceEngine;
