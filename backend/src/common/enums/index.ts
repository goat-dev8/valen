export enum OrganizationStatus {
  Active = 'active',
  Suspended = 'suspended',
  Archived = 'archived',
}

export enum OrganizationPlan {
  Development = 'development',
  Beta = 'beta',
  Pro = 'pro',
  Enterprise = 'enterprise',
}

export enum UserStatus {
  Active = 'active',
  Invited = 'invited',
  Suspended = 'suspended',
  Deleted = 'deleted',
}

export enum TeamMemberStatus {
  Invited = 'invited',
  Active = 'active',
  Suspended = 'suspended',
  Removed = 'removed',
}

export enum PlatformRoleEnum {
  PlatformAdmin = 'platform_admin',
  OrganizationOwner = 'organization_owner',
  ComplianceOfficer = 'compliance_officer',
  RiskOfficer = 'risk_officer',
  PolicyManager = 'policy_manager',
  SettlementOperator = 'settlement_operator',
  Auditor = 'auditor',
  Developer = 'developer',
  Agent = 'agent',
  ServiceAccount = 'service_account',
}

export enum AgentStatus {
  Draft = 'draft',
  Active = 'active',
  Suspended = 'suspended',
  Revoked = 'revoked',
  Archived = 'archived',
}

export enum AgentType {
  Hosted = 'hosted',
  External = 'external',
  Service = 'service',
  Experimental = 'experimental',
}

export enum WalletType {
  Privy = 'privy',
  Safe = 'safe',
  ZeroDev = 'zerodev',
  Turnkey = 'turnkey',
  Eoa = 'eoa',
  Kms = 'kms',
}

export enum PolicyStatus {
  Draft = 'draft',
  Active = 'active',
  Disabled = 'disabled',
  Archived = 'archived',
}

export enum PolicyVersionStatus {
  Draft = 'draft',
  PendingApproval = 'pending_approval',
  Published = 'published',
  Active = 'active',
  Retired = 'retired',
}

export enum ExecutionStatus {
  Created = 'created',
  Validated = 'validated',
  ComplianceFailed = 'compliance_failed',
  RiskFailed = 'risk_failed',
  PolicyRejected = 'policy_rejected',
  ApprovalRequired = 'approval_required',
  Approved = 'approved',
  SettlementSubmitted = 'settlement_submitted',
  Executed = 'executed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum ActionType {
  Transfer = 'transfer',
  Approve = 'approve',
  ContractCall = 'contract_call',
  Rebalance = 'rebalance',
  Swap = 'swap',
  Custom = 'custom',
  RobinhoodTokenTransfer = 'robinhood_token_transfer',
  X402Payment = 'x402_payment',
}

export enum ComplianceStatus {
  Pending = 'pending',
  Passed = 'passed',
  Failed = 'failed',
  Expired = 'expired',
  Error = 'error',
}

export enum ComplianceSubjectType {
  Agent = 'agent',
  Principal = 'principal',
  Counterparty = 'counterparty',
  Asset = 'asset',
  Transaction = 'transaction',
  Contract = 'contract',
}

export enum RiskTier {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum SettlementStatus {
  Pending = 'pending',
  Prepared = 'prepared',
  Submitted = 'submitted',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Reverted = 'reverted',
  Cancelled = 'cancelled',
}

export enum ActorType {
  User = 'user',
  Agent = 'agent',
  ServiceAccount = 'service_account',
  System = 'system',
  Contract = 'contract',
}

export enum NotificationChannel {
  Email = 'email',
  Webhook = 'webhook',
  InApp = 'in_app',
  Slack = 'slack',
  Incident = 'incident',
}

export enum NotificationStatus {
  Queued = 'queued',
  Sent = 'sent',
  Delivered = 'delivered',
  Failed = 'failed',
  Suppressed = 'suppressed',
}

export enum WebhookStatus {
  Active = 'active',
  Disabled = 'disabled',
  Failing = 'failing',
  Revoked = 'revoked',
}

export enum ChainEnvironment {
  Local = 'local',
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

export enum DeploymentStatus {
  Planned = 'planned',
  Active = 'active',
  Deprecated = 'deprecated',
  Disabled = 'disabled',
}
