import { PlatformRole } from '../constants/roles.constant';

export interface OrganizationMembership {
  organizationId: string;
  role: PlatformRole;
  status: string;
}

export interface AuthenticatedUser {
  id: string;
  privyUserId: string;
  email: string | null;
  displayName: string | null;
  status: string;
  isPlatformAdmin: boolean;
  memberships: OrganizationMembership[];
}

export interface ApiKeyAuthContext {
  apiKeyId: string;
  organizationId: string;
  agentId: string | null;
  scopes: string[];
}
