'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { api } from '@/lib/api';
import type { ApprovalInput, CreateExecutionInput, UpdateOrganizationInput } from '@/types/api';

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
  });
}

export function usePolicies() {
  const { token, orgId, enabled } = useAuthOrg();
  return useQuery({
    queryKey: ['policies', orgId],
    queryFn: () => api.policies.list(token!, orgId!),
    enabled,
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

export function useAuditExport() {
  const { token, orgId } = useAuthOrg();

  return useMutation({
    mutationFn: (body: { startDate: string; endDate: string; format: string; entityTypes: string[] }) =>
      api.audit.export(token!, orgId!, body),
  });
}
