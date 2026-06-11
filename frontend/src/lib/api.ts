import { apiRequest } from '@/lib/api-client';
import type {
  AgentDto,
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

function orgPath(orgId: string, suffix: string) {
  return `/v1/organizations/${orgId}${suffix}`;
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
  },

  policies: {
    list: (token: string, orgId: string, params?: { status?: string }) =>
      apiRequest<PolicyDto[]>(orgPath(orgId, '/policies'), { token, params }),
    get: (token: string, orgId: string, policyId: string) =>
      apiRequest<PolicyDetailDto>(orgPath(orgId, `/policies/${policyId}`), { token }),
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
  },

  webhooks: {
    list: (token: string, orgId: string) =>
      apiRequest<WebhookDto[]>(orgPath(orgId, '/webhooks'), { token }),
    test: (token: string, orgId: string, webhookId: string) =>
      apiRequest<{ success: boolean; message: string }>(orgPath(orgId, `/webhooks/${webhookId}/test`), {
        method: 'POST',
        body: {},
        token,
      }),
  },
};
