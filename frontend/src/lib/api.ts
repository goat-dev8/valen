import { ApiClientError, apiRequest } from '@/lib/api-client';
import type {
  AgentDto,
  AgentWalletDto,
  ApiKeyDto,
  ApprovalInput,
  AuditLogDto,
  ComplianceCheckDto,
  ComplianceSubjectDto,
  CreateExecutionInput,
  ExecutionDto,
  MeResponseDto,
  OrganizationDto,
  PaginatedResult,
  PolicyDetailDto,
  PolicyDto,
  RiskScoreDto,
  SettlementDto,
  TeamMemberDto,
  TimelineEventDto,
  UpdateOrganizationInput,
  WebhookDto,
} from '@/types/api';

export class OperatorFetchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'OperatorFetchError';
  }
}

export async function operatorFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const response = await fetch(`/api/operator/${normalized}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : `Operator request failed (${response.status})`;
    throw new OperatorFetchError(message, response.status);
  }

  return data as T;
}

function orgPath(orgId: string, suffix: string) {
  return `/v1/organizations/${orgId}${suffix}`;
}

function normalizeList<T>(data: T[] | PaginatedResult<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}

export const api = {
  auth: {
    sync: (token: string, body: { privyUserId: string; email?: string }) =>
      apiRequest<MeResponseDto>('/v1/auth/sync', { method: 'POST', body, token }),
    me: (token: string) => apiRequest<MeResponseDto>('/v1/me', { token }),
  },

  organizations: {
    create: (token: string, body: { name: string; slug: string; defaultChainId?: number }) =>
      apiRequest<OrganizationDto>('/v1/organizations', { method: 'POST', body, token }),
    get: (token: string, orgId: string) =>
      apiRequest<OrganizationDto>(orgPath(orgId, ''), { token }),
    update: (token: string, orgId: string, body: UpdateOrganizationInput) =>
      apiRequest<OrganizationDto>(orgPath(orgId, ''), { method: 'PATCH', body, token }),
  },

  agents: {
    list: (token: string, orgId: string, params?: { status?: string; page?: number; limit?: number }) =>
      apiRequest<PaginatedResult<AgentDto>>(orgPath(orgId, '/agents'), { token, params }),
    create: (
      token: string,
      orgId: string,
      body: { name: string; description?: string; agentType: string; defaultPolicyId?: string },
    ) => apiRequest<AgentDto>(orgPath(orgId, '/agents'), { method: 'POST', body, token }),
    activate: (token: string, orgId: string, agentId: string) =>
      apiRequest<AgentDto>(orgPath(orgId, `/agents/${agentId}/activate`), { method: 'POST', body: {}, token }),
    get: (token: string, orgId: string, agentId: string) =>
      apiRequest<AgentDto>(orgPath(orgId, `/agents/${agentId}`), { token }),
    update: (
      token: string,
      orgId: string,
      agentId: string,
      body: { name?: string; description?: string; defaultPolicyId?: string },
    ) => apiRequest<AgentDto>(orgPath(orgId, `/agents/${agentId}`), { method: 'PATCH', body, token }),
    suspend: (token: string, orgId: string, agentId: string, reason: string) =>
      apiRequest<AgentDto>(orgPath(orgId, `/agents/${agentId}/suspend`), { method: 'POST', body: { reason }, token }),
    revoke: (token: string, orgId: string, agentId: string, reason: string) =>
      apiRequest<AgentDto>(orgPath(orgId, `/agents/${agentId}/revoke`), { method: 'POST', body: { reason }, token }),
    linkWallet: (
      token: string,
      orgId: string,
      agentId: string,
      body: { chainId: number; walletAddress: string; walletType: string; isPrimary: boolean },
    ) => apiRequest<AgentWalletDto>(orgPath(orgId, `/agents/${agentId}/wallets`), { method: 'POST', body, token }),
    createApiKey: (
      token: string,
      orgId: string,
      agentId: string,
      body: { name: string; scopes: string[]; expiresAt?: string },
    ) => apiRequest<ApiKeyDto>(orgPath(orgId, `/agents/${agentId}/api-keys`), { method: 'POST', body, token }),
  },

  policies: {
    list: (token: string, orgId: string, params?: { status?: string }) =>
      apiRequest<PolicyDto[] | PaginatedResult<PolicyDto>>(orgPath(orgId, '/policies'), {
        token,
        params,
      }).then(normalizeList),
    get: (token: string, orgId: string, policyId: string) =>
      apiRequest<PolicyDetailDto>(orgPath(orgId, `/policies/${policyId}`), { token }),
    create: (token: string, orgId: string, body: { name: string; description?: string }) =>
      apiRequest<PolicyDto>(orgPath(orgId, '/policies'), { method: 'POST', body, token }),
  },

  executions: {
    list: (
      token: string,
      orgId: string,
      params?: { status?: string; agentId?: string; page?: number; limit?: number },
    ) => apiRequest<PaginatedResult<ExecutionDto>>(orgPath(orgId, '/executions'), { token, params }),
    get: (token: string, orgId: string, executionId: string) =>
      apiRequest<ExecutionDto>(orgPath(orgId, `/executions/${executionId}`), { token }),
    create: (token: string, orgId: string, body: CreateExecutionInput) =>
      apiRequest<ExecutionDto>(orgPath(orgId, '/executions'), { method: 'POST', body, token }),
    approve: (token: string, orgId: string, executionId: string, body: ApprovalInput) =>
      apiRequest<ExecutionDto>(orgPath(orgId, `/executions/${executionId}/approve`), {
        method: 'POST',
        body,
        token,
      }),
    cancel: (token: string, orgId: string, executionId: string, reason: string) =>
      apiRequest<ExecutionDto>(orgPath(orgId, `/executions/${executionId}/cancel`), {
        method: 'POST',
        body: { reason },
        token,
      }),
    timeline: (token: string, orgId: string, executionId: string) =>
      apiRequest<TimelineEventDto[]>(orgPath(orgId, `/executions/${executionId}/timeline`), { token }),
  },

  compliance: {
    getChecks: (token: string, orgId: string, executionId: string) =>
      apiRequest<ComplianceCheckDto[]>(orgPath(orgId, `/executions/${executionId}/compliance`), { token }),
    getSubject: (token: string, orgId: string, subjectRef: string) =>
      apiRequest<ComplianceSubjectDto>(orgPath(orgId, `/compliance/subjects/${subjectRef}`), { token }),
  },

  risk: {
    get: (token: string, orgId: string, executionId: string) =>
      apiRequest<RiskScoreDto>(orgPath(orgId, `/executions/${executionId}/risk`), { token }),
  },

  settlements: {
    get: (token: string, orgId: string, executionId: string) =>
      apiRequest<SettlementDto>(orgPath(orgId, `/executions/${executionId}/settlement`), { token }),
    retry: (token: string, orgId: string, settlementId: string, reason: string) =>
      apiRequest<SettlementDto>(orgPath(orgId, `/settlements/${settlementId}/retry`), {
        method: 'POST',
        body: { reason },
        token,
      }),
  },

  audit: {
    list: (
      token: string,
      orgId: string,
      params?: { page?: number; limit?: number; entityType?: string },
    ) => apiRequest<PaginatedResult<AuditLogDto>>(orgPath(orgId, '/audit-logs'), { token, params }),
    export: (
      token: string,
      orgId: string,
      body: { startDate: string; endDate: string; format: string; entityTypes: string[] },
    ) => apiRequest<{ exportId: string; status: string; format: string; recordCount: number }>(
      orgPath(orgId, '/audit-exports'),
      { method: 'POST', body, token },
    ),
  },

  team: {
    list: (token: string, orgId: string, params?: { page?: number; limit?: number }) =>
      apiRequest<PaginatedResult<TeamMemberDto>>(orgPath(orgId, '/team'), { token, params }),
    invite: (token: string, orgId: string, body: { email: string; role: string }) =>
      apiRequest<TeamMemberDto>(orgPath(orgId, '/team/invitations'), { method: 'POST', body, token }),
    updateMember: (
      token: string,
      orgId: string,
      memberId: string,
      body: { role?: string; status?: string },
    ) => apiRequest<TeamMemberDto>(orgPath(orgId, `/team/${memberId}`), { method: 'PATCH', body, token }),
  },

  webhooks: {
    list: (token: string, orgId: string) =>
      apiRequest<WebhookDto[]>(orgPath(orgId, '/webhooks'), { token }),
    create: (token: string, orgId: string, body: { name: string; url: string; subscribedEvents: string[] }) =>
      apiRequest<WebhookDto>(orgPath(orgId, '/webhooks'), { method: 'POST', body, token }),
    update: (
      token: string,
      orgId: string,
      webhookId: string,
      body: { name?: string; url?: string; subscribedEvents?: string[]; status?: string },
    ) => apiRequest<WebhookDto>(orgPath(orgId, `/webhooks/${webhookId}`), { method: 'PATCH', body, token }),
    delete: (token: string, orgId: string, webhookId: string) =>
      apiRequest<WebhookDto>(orgPath(orgId, `/webhooks/${webhookId}`), { method: 'DELETE', token }),
    test: (token: string, orgId: string, webhookId: string) =>
      apiRequest<{ deliveryId: string; status: string; statusCode: number | null }>(
        orgPath(orgId, `/webhooks/${webhookId}/test`),
        { method: 'POST', body: {}, token },
      ),
  },
};

export { ApiClientError };
