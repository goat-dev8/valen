'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { api } from '@/lib/api';
import { asArray } from '@/lib/array';
import type {
  ApprovalInput,
  ApiKeyDto,
  CreateExecutionInput,
  CreateSignedMandateDto,
  MandateDto,
  MandateTypedDataRequestDto,
  UpdateOrganizationInput,
  WalletChallengeDto,
  WalletVerificationDto,
  WalletVerifyDto,
} from '@/types/api';

function useAuthOrg() {
  const { token } = useAuth();
  const { orgId } = useOrganization();
  return { token, orgId, enabled: Boolean(token && orgId) };
}

export function useAgents(params?: { status?: string; page?: number; limit?: number }) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['agents', orgId, params],
    queryFn: () => api.agents.list(token!, orgId!, params),
    enabled,
  });
}

export function useAgent(agentId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['agent', orgId, agentId],
    queryFn: () => api.agents.get(token!, orgId!, agentId),
    enabled: enabled && Boolean(agentId),
  });
}

export function useAgentApiKeys(agentId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['agent-api-keys', orgId, agentId],
    queryFn: () => api.agents.listApiKeys(token!, orgId!, agentId),
    select: (data): ApiKeyDto[] => asArray<ApiKeyDto>(data),
    enabled: enabled && Boolean(agentId),
  });
}

export function useExecutions(params?: { status?: string; agentId?: string; page?: number; limit?: number }) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['executions', orgId, params],
    queryFn: () => api.executions.list(token!, orgId!, params),
    enabled,
  });
}

export function useExecution(executionId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['execution', orgId, executionId],
    queryFn: () => api.executions.get(token!, orgId!, executionId),
    enabled: enabled && Boolean(executionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ['executed', 'failed', 'cancelled', 'compliance_failed', 'risk_failed', 'policy_rejected'].includes(status)
        ? false
        : 5000;
    },
  });
}

export function useExecutionCompliance(executionId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['execution-compliance', orgId, executionId],
    queryFn: () => api.compliance.getChecks(token!, orgId!, executionId),
    enabled: enabled && Boolean(executionId),
  });
}

export function useExecutionRisk(executionId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['execution-risk', orgId, executionId],
    queryFn: () => api.risk.get(token!, orgId!, executionId),
    enabled: enabled && Boolean(executionId),
    retry: false,
  });
}

export function useExecutionSettlement(executionId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['execution-settlement', orgId, executionId],
    queryFn: () => api.settlements.get(token!, orgId!, executionId),
    enabled: enabled && Boolean(executionId),
    retry: false,
  });
}

export function useExecutionTimeline(executionId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['execution-timeline', orgId, executionId],
    queryFn: () => api.executions.timeline(token!, orgId!, executionId),
    enabled: enabled && Boolean(executionId),
    retry: false,
    refetchInterval: 5000,
  });
}

export function usePolicies() {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['policies', orgId],
    queryFn: async () => {
      const policies = await api.policies.list(token!, orgId!);
      return policies ?? [];
    },
    enabled,
  });
}

export function useWalletVerifications() {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['wallet-verifications', orgId],
    queryFn: () => api.wallets.list(token!, orgId!),
    select: (data): WalletVerificationDto[] => asArray<WalletVerificationDto>(data),
    enabled,
  });
}

export function useCreateWalletChallenge() {
  const { token, orgId } = useAuthOrg();
  return useMutation({
    mutationFn: (body: WalletChallengeDto) => api.wallets.challenge(token!, orgId!, body),
  });
}

export function useVerifyWallet() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: WalletVerifyDto) => api.wallets.verify(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-verifications', orgId] });
    },
  });
}

export function useMandates() {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['mandates', orgId],
    queryFn: () => api.mandates.list(token!, orgId!),
    select: (data): MandateDto[] => asArray<MandateDto>(data),
    enabled,
  });
}

export function useCreateMandateTypedData() {
  const { token, orgId } = useAuthOrg();
  return useMutation({
    mutationFn: (body: MandateTypedDataRequestDto) => api.mandates.typedData(token!, orgId!, body),
  });
}

export function useCreateSignedMandate() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSignedMandateDto) => api.mandates.create(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates', orgId] });
    },
  });
}

export function useRevokeMandate() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mandateId, reason }: { mandateId: string; reason: string }) =>
      api.mandates.revoke(token!, orgId!, mandateId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates', orgId] });
    },
  });
}

export function usePolicy(policyId: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['policy', orgId, policyId],
    queryFn: () => api.policies.get(token!, orgId!, policyId),
    enabled: enabled && Boolean(policyId),
  });
}

export function useAuditLogs(params?: { page?: number; limit?: number }) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['audit-logs', orgId, params],
    queryFn: () => api.audit.list(token!, orgId!, params),
    enabled,
  });
}

export function useTeam(params?: { page?: number; limit?: number }) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['team', orgId, params],
    queryFn: () => api.team.list(token!, orgId!, params),
    enabled,
  });
}

export function useWebhooks() {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['webhooks', orgId],
    queryFn: () => api.webhooks.list(token!, orgId!),
    enabled,
  });
}

export function useComplianceSubject(subjectRef: string) {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['compliance-subject', orgId, subjectRef],
    queryFn: () => api.compliance.getSubject(token!, orgId!, subjectRef),
    enabled: enabled && Boolean(subjectRef),
    retry: false,
  });
}

export function useApproveExecution() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ executionId, body }: { executionId: string; body: ApprovalInput }) =>
      api.executions.approve(token!, orgId!, executionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', orgId] });
      queryClient.invalidateQueries({ queryKey: ['execution', orgId] });
    },
  });
}

export function useCreateAgent() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; description?: string; agentType: string; defaultPolicyId?: string }) =>
      api.agents.create(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', orgId] });
    },
  });
}

export function useActivateAgent() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => api.agents.activate(token!, orgId!, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', orgId] });
      queryClient.invalidateQueries({ queryKey: ['agent', orgId] });
    },
  });
}

export function useSuspendAgent() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason: string }) =>
      api.agents.suspend(token!, orgId!, agentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', orgId] });
      queryClient.invalidateQueries({ queryKey: ['agent', orgId] });
    },
  });
}

export function useRevokeAgent() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason: string }) =>
      api.agents.revoke(token!, orgId!, agentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', orgId] });
      queryClient.invalidateQueries({ queryKey: ['agent', orgId] });
    },
  });
}

export function useLinkAgentWallet() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      body,
    }: {
      agentId: string;
      body: { chainId: number; walletAddress: string; walletType: string; isPrimary: boolean };
    }) => api.agents.linkWallet(token!, orgId!, agentId, body),
    onSuccess: (_data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agent', orgId, agentId] });
    },
  });
}

export function useCreateAgentApiKey() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      body,
    }: {
      agentId: string;
      body: { name: string; scopes: string[]; expiresAt?: string; mandateId?: string };
    }) => api.agents.createApiKey(token!, orgId!, agentId, body),
    onSuccess: (_data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agent-api-keys', orgId, agentId] });
    },
  });
}

export function useCreateExecution() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateExecutionInput) => api.executions.create(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', orgId] });
    },
  });
}

export function useCancelExecution() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ executionId, reason }: { executionId: string; reason: string }) =>
      api.executions.cancel(token!, orgId!, executionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', orgId] });
      queryClient.invalidateQueries({ queryKey: ['execution', orgId] });
    },
  });
}

export function useRetrySettlement() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ settlementId, reason }: { settlementId: string; reason: string }) =>
      api.settlements.retry(token!, orgId!, settlementId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-settlement', orgId] });
      queryClient.invalidateQueries({ queryKey: ['executions', orgId] });
    },
  });
}

export function useCreatePolicy() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; description?: string }) => api.policies.create(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies', orgId] });
    },
  });
}

export function useCreatePolicyVersion() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, rules }: { policyId: string; rules: Record<string, unknown> }) =>
      api.policies.createVersion(token!, orgId!, policyId, { rules }),
    onSuccess: (_data, { policyId }) => {
      queryClient.invalidateQueries({ queryKey: ['policy', orgId, policyId] });
      queryClient.invalidateQueries({ queryKey: ['policies', orgId] });
    },
  });
}

export function useUpdateAgent() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      body,
    }: {
      agentId: string;
      body: { name?: string; description?: string; defaultPolicyId?: string };
    }) => api.agents.update(token!, orgId!, agentId, body),
    onSuccess: (_data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agents', orgId] });
      queryClient.invalidateQueries({ queryKey: ['agent', orgId, agentId] });
    },
  });
}

export function usePublishPolicyVersion() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, versionId, approvalRef }: { policyId: string; versionId: string; approvalRef?: string }) =>
      api.policies
        .submitVersion(token!, orgId!, policyId, versionId, 'Template version ready for activation')
        .then(() => api.policies.publishVersion(token!, orgId!, policyId, versionId, { approvalRef })),
    onSuccess: (_data, { policyId }) => {
      queryClient.invalidateQueries({ queryKey: ['policy', orgId, policyId] });
      queryClient.invalidateQueries({ queryKey: ['policies', orgId] });
    },
  });
}

export function useActivatePolicyVersion() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, versionId, approvalRef }: { policyId: string; versionId: string; approvalRef?: string }) =>
      api.policies.activateVersion(token!, orgId!, policyId, versionId, {
        approvalRef,
        comment: 'Activated through VALEN policy template flow',
      }),
    onSuccess: (_data, { policyId }) => {
      queryClient.invalidateQueries({ queryKey: ['policy', orgId, policyId] });
      queryClient.invalidateQueries({ queryKey: ['policies', orgId] });
    },
  });
}

export function useUpdateOrganization() {
  const { token, orgId } = useAuthOrg();
  const { refreshOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateOrganizationInput) => api.organizations.update(token!, orgId!, body),
    onSuccess: async () => {
      await refreshOrganization();
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] });
    },
  });
}

export function useTestWebhook() {
  const { token, orgId } = useAuthOrg();

  return useMutation({
    mutationFn: (webhookId: string) => api.webhooks.test(token!, orgId!, webhookId),
  });
}

export function useCreateWebhook() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; url: string; subscribedEvents: string[] }) =>
      api.webhooks.create(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', orgId] });
    },
  });
}

export function useUpdateWebhook() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      webhookId,
      body,
    }: {
      webhookId: string;
      body: { name?: string; url?: string; subscribedEvents?: string[]; status?: string };
    }) => api.webhooks.update(token!, orgId!, webhookId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', orgId] });
    },
  });
}

export function useDeleteWebhook() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => api.webhooks.delete(token!, orgId!, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', orgId] });
    },
  });
}

export function useInviteTeamMember() {
  const { token, orgId } = useAuthOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { email: string; role: string }) => api.team.invite(token!, orgId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', orgId] });
    },
  });
}

export function useAuditExport() {
  const { token, orgId } = useAuthOrg();

  return useMutation({
    mutationFn: (body: { startDate: string; endDate: string; format: string; entityTypes: string[] }) =>
      api.audit.export(token!, orgId!, body),
  });
}
