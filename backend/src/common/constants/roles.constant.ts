export const PLATFORM_ROLES = [
  'platform_admin',
  'organization_owner',
  'compliance_officer',
  'risk_officer',
  'policy_manager',
  'settlement_operator',
  'auditor',
  'developer',
  'agent',
  'service_account',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
