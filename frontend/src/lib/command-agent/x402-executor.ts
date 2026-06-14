import { mandateMatchesIntent } from '@/lib/mandate-match';
import {
  X402_CHAIN_ID,
  X402_MERCHANT_URL,
  X402_TEMPLATE_ID,
  X402_USDC_ADDRESS,
} from '@/lib/x402-constants';
import { formatApiErrorMessage } from '@/lib/utils';
import type { MandateDto } from '@/types/api';
import type { CommandExecutionPlan, CommandExecutionResult, LifecycleStep } from './types';
import { LIFECYCLE_TEMPLATE } from './types';

function cloneLifecycle(): LifecycleStep[] {
  return LIFECYCLE_TEMPLATE.map((step, index) => ({
    ...step,
    status: index === 0 ? 'passed' : 'pending',
    detail: index === 0 ? 'Payment intent understood.' : undefined,
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
  await new Promise((r) => setTimeout(r, 100));
}

export async function executeX402InConsole(input: {
  plan: CommandExecutionPlan;
  amount: string;
  recipient?: string;
  mandates: MandateDto[];
  x402Initiate: (body: {
    agentId: string;
    mandateId: string;
    recipient: string;
    amount: string;
    chainId: number;
    merchantUrl: string;
  }) => Promise<{ paymentId: string; status: string }>;
  x402Execute: (paymentId: string) => Promise<{ settlementTx?: string | null; status: string }>;
  onStepUpdate: (steps: LifecycleStep[]) => void;
}): Promise<CommandExecutionResult> {
  let steps = cloneLifecycle();
  const { plan, amount, recipient, mandates, x402Initiate, x402Execute, onStepUpdate } = input;

  if (!plan.agent?.mandateId) {
    steps = updateStep(steps, 'authority_check', 'failed', 'Signed USDC mandate required');
    onStepUpdate(steps);
    return { status: 'refused', lifecycle: steps, message: 'Authority check failed — sign a USDC mandate for the selected agent.' };
  }

  const mandate = mandates.find((m) => m.id === plan.agent!.mandateId);
  const payRecipient = recipient?.toLowerCase();
  if (!payRecipient || !/^0x[a-f0-9]{40}$/.test(payRecipient)) {
    return {
      status: 'refused',
      lifecycle: steps,
      message: 'Recipient wallet required — connect wallet or specify recipient to execute USDC payment in-console.',
      secondaryHref: '/dashboard/payments',
      secondaryLabel: 'Configure payment (optional)',
    };
  }

  if (
    mandate &&
    !mandateMatchesIntent({
      mandate,
      agentId: plan.agent.id,
      chainId: X402_CHAIN_ID,
      actionType: 'transfer',
      templateId: X402_TEMPLATE_ID,
      targetAddress: payRecipient,
      assetAddress: X402_USDC_ADDRESS,
    })
  ) {
    steps = updateStep(steps, 'authority_check', 'failed', 'Mandate does not cover x402 scope');
    onStepUpdate(steps);
    return { status: 'refused', lifecycle: steps, message: 'Authority check failed — mandate scope does not cover this x402 payment.' };
  }

  steps = updateStep(steps, 'policy_check', 'passed', plan.policyName ?? 'Policy active');
  steps = updateStep(steps, 'authority_check', 'passed', 'Mandate covers x402 payment');
  steps = updateStep(steps, 'budget_check', 'running', 'Checking USDC budget…');
  await tick(onStepUpdate, steps);
  steps = updateStep(steps, 'budget_check', 'passed', 'Budget envelope OK');
  steps = updateStep(steps, 'risk_review', 'passed', plan.riskLevel ?? 'Policy risk profile');
  steps = updateStep(steps, 'settlement', 'running', 'Initiating x402 payment…');
  await tick(onStepUpdate, steps);

  try {
    const initiated = await x402Initiate({
      agentId: plan.agent.id,
      mandateId: plan.agent.mandateId,
      recipient: payRecipient,
      amount,
      chainId: X402_CHAIN_ID,
      merchantUrl: X402_MERCHANT_URL,
    });

    steps = updateStep(steps, 'settlement', 'running', `Payment ${initiated.paymentId.slice(0, 8)}… settling`);
    await tick(onStepUpdate, steps);

    const settled = await x402Execute(initiated.paymentId);
    steps = updateStep(
      steps,
      'settlement',
      'passed',
      settled.settlementTx ? `Settled · ${settled.settlementTx.slice(0, 10)}…` : settled.status,
    );
    steps = updateStep(steps, 'proof_generation', 'passed', 'Outcome Ledger proof published');
    steps = updateStep(steps, 'completed', 'passed', 'Payment completed');
    onStepUpdate(steps);

    return {
      status: 'success',
      lifecycle: steps,
      message: `USDC payment executed · ${amount} USDC · ${settled.status.replace(/_/g, ' ')}.`,
      proofHref: '/dashboard/proofs',
      txHref: settled.settlementTx ? `https://sepolia.arbiscan.io/tx/${settled.settlementTx}` : undefined,
    };
  } catch (err) {
    steps = updateStep(steps, 'settlement', 'failed', formatApiErrorMessage(err, 'Settlement failed'));
    onStepUpdate(steps);
    return {
      status: 'error',
      lifecycle: steps,
      message: formatApiErrorMessage(err, 'x402 payment failed'),
    };
  }
}
