import type { CommandGate } from '@/lib/command-gates';
import type { ParsedCommand } from '@/lib/command-parser';

export type CommandSessionState =
  | 'draft'
  | 'planned'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'refused';

export type LifecycleStepId =
  | 'intent_parsed'
  | 'policy_check'
  | 'authority_check'
  | 'budget_check'
  | 'risk_review'
  | 'settlement'
  | 'proof_generation'
  | 'completed';

export type LifecycleStepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export type LifecycleStep = {
  id: LifecycleStepId;
  label: string;
  status: LifecycleStepStatus;
  detail?: string;
};

export type AgentCandidate = {
  id: string;
  name: string;
  policyId: string | null;
  policyName: string | null;
  mandateId: string | null;
  score: number;
  capabilityMatch: string;
};

export type CommandExecutionPlan = {
  parsed: ParsedCommand;
  intentLabel: string;
  agent: AgentCandidate | null;
  agentCandidates: AgentCandidate[];
  requiresAgentSelection: boolean;
  agentTemplateName: string | null;
  policyName: string | null;
  riskLevel: string | null;
  chainId: number;
  budgetStatus: 'passed' | 'blocked' | 'not_required';
  budgetMessage?: string | null;
  authorityStatus: 'passed' | 'blocked' | 'not_required';
  authorityRequirements: string[];
  budgetRequirements: string[];
  settlementPath: string;
  proofPath: string;
  executionRoute: string;
  proofRoute: string;
  statusLabel: string;
  readiness: 'ready' | 'blocked';
  blockers: CommandGate[];
  lifecyclePreview: LifecycleStep[];
};

export type CommandExecutionResult = {
  status: 'success' | 'refused' | 'error';
  lifecycle: LifecycleStep[];
  message: string;
  executionId?: string;
  proofHref?: string;
  txHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  draftAgentId?: string;
};

export const LIFECYCLE_TEMPLATE: Array<{ id: LifecycleStepId; label: string }> = [
  { id: 'intent_parsed', label: 'Intent parsed' },
  { id: 'policy_check', label: 'Policy check' },
  { id: 'authority_check', label: 'Authority check' },
  { id: 'budget_check', label: 'Budget check' },
  { id: 'risk_review', label: 'Risk review' },
  { id: 'settlement', label: 'Settlement' },
  { id: 'proof_generation', label: 'Proof generation' },
  { id: 'completed', label: 'Completed' },
];

export function initialLifecycle(): LifecycleStep[] {
  return LIFECYCLE_TEMPLATE.map((step, index) => ({
    ...step,
    status: index === 0 ? 'passed' : 'pending',
    detail: index === 0 ? 'Command understood and scoped.' : undefined,
  }));
}
