#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum VerdictStatus {
    Pass = 0,
    Fail = 1,
    ApprovalRequired = 2,
    Error = 3,
}

impl VerdictStatus {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Pass,
            1 => Self::Fail,
            2 => Self::ApprovalRequired,
            _ => Self::Error,
        }
    }
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ComplianceReason {
    Compliant = 0,
    KycExpired = 1,
    AmlFlag = 2,
    JurisdictionBlocked = 3,
    IdentityNotFound = 4,
    AttestationRevoked = 5,
    CounterpartyBlocked = 6,
    AssetNotPermitted = 7,
    MandateInvalid = 8,
    UnknownError = 9,
}

impl ComplianceReason {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Compliant,
            1 => Self::KycExpired,
            2 => Self::AmlFlag,
            3 => Self::JurisdictionBlocked,
            4 => Self::IdentityNotFound,
            5 => Self::AttestationRevoked,
            6 => Self::CounterpartyBlocked,
            7 => Self::AssetNotPermitted,
            8 => Self::MandateInvalid,
            _ => Self::UnknownError,
        }
    }
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RiskTier {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}

impl RiskTier {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Low,
            1 => Self::Medium,
            2 => Self::High,
            3 => Self::Critical,
            _ => Self::Critical,
        }
    }

    pub fn from_score(
        score: u16,
        low_threshold: u16,
        medium_threshold: u16,
        high_threshold: u16,
    ) -> Self {
        if score <= low_threshold {
            Self::Low
        } else if score <= medium_threshold {
            Self::Medium
        } else if score <= high_threshold {
            Self::High
        } else {
            Self::Critical
        }
    }

    pub fn requires_approval(self) -> bool {
        matches!(self, Self::High | Self::Critical)
    }
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PolicyReason {
    Approved = 0,
    LimitExceeded = 1,
    ActionNotAllowed = 2,
    AssetNotAllowed = 3,
    CounterpartyNotAllowed = 4,
    TimeWindowBlocked = 5,
    ApprovalRequired = 6,
    PolicyInactive = 7,
}

impl PolicyReason {
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => Self::Approved,
            1 => Self::LimitExceeded,
            2 => Self::ActionNotAllowed,
            3 => Self::AssetNotAllowed,
            4 => Self::CounterpartyNotAllowed,
            5 => Self::TimeWindowBlocked,
            6 => Self::ApprovalRequired,
            7 => Self::PolicyInactive,
            _ => Self::PolicyInactive,
        }
    }
}

/// Eligibility dimension identifiers for failed_dimension field.
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum EligibilityDimension {
    None = 0,
    Principal = 1,
    Agent = 2,
    Asset = 3,
    Counterparty = 4,
    Scope = 5,
    Attestation = 6,
}
