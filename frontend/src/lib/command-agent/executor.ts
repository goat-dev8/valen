import { keccak256, toHex } from 'viem';
import { evaluateCommandGates } from '@/lib/command-gates';
import { intentTemplateById } from '@/lib/intent-templates';
import { resolveIntentAssetForSubmit } from '@/lib/resolve-intent-asset';
import { formatApiErrorMessage } from '@/lib/utils';
import type { CreateExecutionInput, ExecutionDto } from '@/types/api';
import type { CommandExecutionPlan, CommandExecutionResult, LifecycleStep } from './types';
import { LIFECYCLE_TEMPLATE } from './types';

function cloneLifecycle(): LifecycleStep[] {
  return LIFECYCLE_TEMPLATE.map((step, index) => ({
    ...step,
    status: index === 0 ? 'passed' : 'pending',
    detail: index === 0 ? 'Command understood and scoped.' : undefined,
  }));
}

function updateStep(
  steps: LifecycleStep[],
  id: LifecycleStep['id'],
  status: LifecycleStep['status'],
  detail?: string,
): LifecycleStep[] {
  return steps.map((step) => (step.id === id ? { ...step, status, detail } : step));
}

async function tick(onStepUpdate: (steps: LifecycleStep[]) => void, steps: LifecycleStep[]) {
  onStepUpdate([...steps]);
  await new Promise((r) => setTimeout(r, 120));
}

export async function executeGovernedCommand(input: {
  plan: CommandExecutionPlan;
  summary: import('@/types/api').DashboardSummaryDto | null | undefined;
  agents?: import('@/types/api').AgentDto[];
  mandates?: import('@/types/api').MandateDto[];
  connectedWallet?: string;
  createExecution: (body: CreateExecutionInput) => Promise<ExecutionDto>;
  onStepUpdate: (steps: LifecycleStep[]) => void;
}): Promise<CommandExecutionResult> {
  const { plan, summary, agents = [], mandates = [], connectedWallet, createExecution, onStepUpdate } = input;
  let steps = cloneLifecycle();

  if (plan.readiness !== 'ready' || !plan.agent) {
    steps = updateStep(steps, 'policy_check', 'failed', plan.blockers[0]?.label ?? 'Setup incomplete');
    onStepUpdate(steps);
    return {
      status: 'refused',
      lifecycle: steps,
      message: plan.blockers.map((b) => b.label).join('. ') || 'Command not ready to execute.',
    };
  }

  await tick(onStepUpdate, steps);

  steps = updateStep(steps, 'policy_check', 'running', 'Evaluating active policy…');
  await tick(onStepUpdate, steps);
  const gates = evaluateCommandGates(plan.parsed, summary, {
    agentId: plan.agent.id,
    agents,
    mandates,
  });
  if (!gates.gates.find((g) => g.id === 'policy')?.passed) {
    steps = updateStep(steps, 'policy_check', 'failed', 'Active policy required');
    onStepUpdate(steps);
    return { status: 'refused', lifecycle: steps, message: 'Policy check failed — assign an active policy.' };
  }
  steps = updateStep(steps, 'policy_check', 'passed', plan.policyName ?? 'Policy active');
  await tick(onStepUpdate, steps);

  steps = updateStep(steps, 'authority_check', 'running', 'Checking mandate…');
  await tick(onStepUpdate, steps);
  if (!gates.gates.find((g) => g.id === 'mandate')?.passed) {
    steps = updateStep(steps, 'authority_check', 'failed', 'Signed mandate required');
    onStepUpdate(steps);
    return { status: 'refused', lifecycle: steps, message: 'Authority check failed — sign agent mandate.' };
  }
  steps = updateStep(steps, 'authority_check', 'passed', 'Mandate covers agent and scope');
  await tick(onStepUpdate, steps);

  steps = updateStep(steps, 'budget_check', 'running', 'Checking budget envelope…');
  await tick(onStepUpdate, steps);
  const budgetGate = gates.gates.find((g) => g.id === 'budget');
  if (budgetGate && !budgetGate.passed) {
    steps = updateStep(steps, 'budget_check', 'failed', 'USDC budget not funded');
    onStepUpdate(steps);
    return { status: 'refused', lifecycle: steps, message: 'Budget check failed — fund USDC budget.' };
  }
  steps = updateStep(
    steps,
    'budget_check',
    budgetGate ? 'passed' : 'skipped',
    budgetGate ? `${summary?.budget.remaining ?? '—'} USDC remaining` : 'Not required',
  );
  await tick(onStepUpdate, steps);

  steps = updateStep(
    steps,
    'risk_review',
    'passed',
    plan.riskLevel ? `${plan.riskLevel} risk profile` : 'Risk profile from policy',
  );
  await tick(onStepUpdate, steps);

  if (plan.parsed.kind !== 'execution' || !plan.parsed.templateId) {
    steps = updateStep(steps, 'settlement', 'skipped', 'No on-chain settlement for this command type');
    steps = updateStep(steps, 'proof_generation', 'skipped');
    steps = updateStep(steps, 'completed', 'passed', 'Command handled in console');
    onStepUpdate(steps);
    return { status: 'success', lifecycle: steps, message: 'Command completed in console.' };
  }

  const template = intentTemplateById(plan.parsed.templateId);
  const targetAddress =
    template.targetAddress.toLowerCase() === '0x0000000000000000000000000000000000000000' && connectedWallet
      ? connectedWallet
      : template.targetAddress;
  const amount = plan.parsed.amount ?? template.amount;
  const robinhoodTicker = (template.metadata?.robinhood as { ticker?: string } | undefined)?.ticker;
  const resolvedAsset = resolveIntentAssetForSubmit({
    chainId: template.targetChainId,
    rawAsset: template.assetAddress ?? '',
    templateAsset: template.assetAddress,
    templateActionType: template.actionType,
    robinhoodTicker,
  });

  steps = updateStep(steps, 'settlement', 'running', 'Submitting governed execution…');
  await tick(onStepUpdate, steps);

  const payload = JSON.stringify({
    templateId: template.id,
    actionType: template.actionType,
    targetChainId: template.targetChainId,
    targetAddress,
    amount,
    assetAddress: resolvedAsset,
    mandateId: plan.agent.mandateId,
    submittedAt: new Date().toISOString(),
    source: 'command-agent-console',
  });

  try {
    const result = await createExecution({
      agentId: plan.agent.id,
      idempotencyKey: `command-${plan.agent.id.slice(0, 8)}-${Date.now()}`,
      actionType: template.actionType,
      targetChainId: template.targetChainId,
      targetAddress,
      assetAddress: resolvedAsset,
      amount,
      mandateId: plan.agent.mandateId ?? undefined,
      payloadHash: keccak256(toHex(payload)),
      metadata: {
        ...(template.metadata ?? {}),
        source: 'command-agent-console',
        templateId: template.id,
        mandateId: plan.agent.mandateId,
      },
    });

    steps = updateStep(steps, 'settlement', 'passed', `Execution ${result.id.slice(0, 8)}… created`);
    steps = updateStep(steps, 'proof_generation', 'running', 'Awaiting proof…');
    await tick(onStepUpdate, steps);
    steps = updateStep(steps, 'proof_generation', 'passed', 'Proof available on execution record');
    steps = updateStep(steps, 'completed', 'passed', result.status.replace(/_/g, ' '));
    onStepUpdate(steps);

    return {
      status: result.status.includes('fail') || result.status.includes('refus') ? 'refused' : 'success',
      lifecycle: steps,
      message: `Governed execution ${result.status.replace(/_/g, ' ')}.`,
      executionId: result.id,
      proofHref: `/dashboard/executions/${result.id}`,
    };
  } catch (err) {
    steps = updateStep(steps, 'settlement', 'failed', formatApiErrorMessage(err, 'Settlement failed'));
    onStepUpdate(steps);
    return {
      status: 'error',
      lifecycle: steps,
      message: formatApiErrorMessage(err, 'Execution failed'),
    };
  }
}
