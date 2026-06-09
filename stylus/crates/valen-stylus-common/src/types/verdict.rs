use alloy_primitives::B256;

use super::reason_code::{ComplianceReason, PolicyReason, VerdictStatus};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineVerdict {
    pub status: u8,
    pub reason_code: u8,
    pub result_hash: B256,
    pub engine_version: B256,
    pub expires_at: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RiskVerdict {
    pub score: u16,
    pub tier: u8,
    pub requires_approval: bool,
    pub result_hash: B256,
    pub verdict: EngineVerdict,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EligibilityVerdict {
    pub verdict: EngineVerdict,
    pub failed_dimension: u8,
    pub result_hash: B256,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PolicyVerdict {
    pub verdict: EngineVerdict,
    pub policy_reason: u8,
    pub approval_level: u8,
    pub result_hash: B256,
}

impl EngineVerdict {
    pub fn pass(
        engine_version: B256,
        result_hash: B256,
        expires_at: u64,
        reason_code: u8,
    ) -> Self {
        Self {
            status: VerdictStatus::Pass as u8,
            reason_code,
            result_hash,
            engine_version,
            expires_at,
        }
    }

    pub fn fail(
        engine_version: B256,
        result_hash: B256,
        expires_at: u64,
        reason_code: u8,
    ) -> Self {
        Self {
            status: VerdictStatus::Fail as u8,
            reason_code,
            result_hash,
            engine_version,
            expires_at,
        }
    }

    pub fn approval_required(
        engine_version: B256,
        result_hash: B256,
        expires_at: u64,
        reason_code: u8,
    ) -> Self {
        Self {
            status: VerdictStatus::ApprovalRequired as u8,
            reason_code,
            result_hash,
            engine_version,
            expires_at,
        }
    }

    pub fn error(engine_version: B256, result_hash: B256, reason_code: u8) -> Self {
        Self {
            status: VerdictStatus::Error as u8,
            reason_code,
            result_hash,
            engine_version,
            expires_at: 0,
        }
    }

    pub fn status(&self) -> VerdictStatus {
        VerdictStatus::from_u8(self.status)
    }
}

impl RiskVerdict {
    pub fn compliant_reason_code(&self) -> u8 {
        ComplianceReason::Compliant as u8
    }
}

impl PolicyVerdict {
    pub fn policy_reason(&self) -> PolicyReason {
        PolicyReason::from_u8(self.policy_reason)
    }
}
