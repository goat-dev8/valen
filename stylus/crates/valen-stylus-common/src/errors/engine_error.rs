use alloy_sol_types::{sol, SolError};

use crate::types::reason_code::{ComplianceReason, PolicyReason};

sol! {
    error ValenEngineError(uint8 code);
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EngineError {
    Unauthorized,
    Inactive,
    InvalidInput,
    AttestationExpired,
    AttestationLimitExceeded,
    AttestationMisaligned,
    HashMismatch,
    MandateInvalid,
    EligibilityFailed,
    RiskAttestationExpired,
    FactorOutOfRange,
    PolicyInactive,
    ComplianceNotPass,
    RiskInconsistent,
    Unknown,
}

impl EngineError {
    pub fn code(self) -> u8 {
        match self {
            Self::Unauthorized => 1,
            Self::Inactive => 2,
            Self::InvalidInput => 3,
            Self::AttestationExpired => 4,
            Self::AttestationLimitExceeded => 5,
            Self::AttestationMisaligned => 6,
            Self::HashMismatch => 7,
            Self::MandateInvalid => 8,
            Self::EligibilityFailed => 9,
            Self::RiskAttestationExpired => 10,
            Self::FactorOutOfRange => 11,
            Self::PolicyInactive => 12,
            Self::ComplianceNotPass => 13,
            Self::RiskInconsistent => 14,
            Self::Unknown => 255,
        }
    }

    pub fn encode(self) -> alloc::vec::Vec<u8> {
        ValenEngineError { code: self.code() }.abi_encode()
    }

    pub fn to_compliance_reason(&self) -> ComplianceReason {
        match self {
            Self::AttestationExpired => ComplianceReason::KycExpired,
            Self::AttestationLimitExceeded | Self::AttestationMisaligned => {
                ComplianceReason::AttestationRevoked
            }
            Self::HashMismatch => ComplianceReason::JurisdictionBlocked,
            Self::MandateInvalid => ComplianceReason::MandateInvalid,
            Self::EligibilityFailed => ComplianceReason::IdentityNotFound,
            Self::InvalidInput => ComplianceReason::UnknownError,
            _ => ComplianceReason::UnknownError,
        }
    }

    pub fn to_policy_reason(&self) -> PolicyReason {
        match self {
            Self::PolicyInactive => PolicyReason::PolicyInactive,
            Self::ComplianceNotPass => PolicyReason::ActionNotAllowed,
            Self::RiskInconsistent => PolicyReason::LimitExceeded,
            Self::InvalidInput => PolicyReason::ActionNotAllowed,
            _ => PolicyReason::ActionNotAllowed,
        }
    }
}

extern crate alloc;
