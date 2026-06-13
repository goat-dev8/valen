import type { ComplianceCheckDto, ExecutionDto, RiskScoreDto, SettlementDto } from '@/types/api';

export type ExecutionFailureExplanation = {
  headline: string;
  humanReason: string;
  technicalReason: string;
  suggestedFix: string;
};

type PipelineFailure = {
  stage?: string;
  message?: string;
};

function pipelineFailure(metadata: Record<string, unknown> | undefined): PipelineFailure | null {
  const failure = metadata?.pipelineFailure;
  if (!failure || typeof failure !== 'object' || Array.isArray(failure)) return null;
  return failure as PipelineFailure;
}

export function explainExecutionFailure(input: {
  execution: ExecutionDto;
  compliance?: ComplianceCheckDto[] | null;
  risk?: RiskScoreDto | null;
  settlement?: SettlementDto | null;
}): ExecutionFailureExplanation | null {
  const { execution, compliance, risk, settlement } = input;
  const status = execution.status;
  const pipeline = pipelineFailure(execution.metadata);

  if (status === 'executed') return null;

  if (status === 'compliance_failed') {
    const check = compliance?.find((item) => item.status !== 'passed') ?? compliance?.[0];
    return {
      headline: 'Compliance blocked this intent',
      humanReason: check?.reasonCode
        ? `Compliance check returned ${check.reasonCode.replace(/_/g, ' ')}.`
        : 'Compliance checks did not pass for this intent.',
      technicalReason: check ? `${check.provider} · ${check.reasonCode}` : 'No compliance record',
      suggestedFix: 'Review mandate scope, target address, and asset permissions on Wallet & Authority.',
    };
  }

  if (status === 'risk_failed') {
    return {
      headline: 'Risk engine refused this intent',
      humanReason: risk?.tier
        ? `Risk score ${risk.score} (${risk.tier}) exceeded policy limits.`
        : 'The risk engine blocked this intent before settlement.',
      technicalReason: risk ? `score=${risk.score}, tier=${risk.tier}` : 'Risk evaluation unavailable',
      suggestedFix: 'Lower the amount, widen policy limits, or increase the agent USDC budget cap.',
    };
  }

  if (status === 'policy_rejected') {
    return {
      headline: 'Policy rejected this intent',
      humanReason: 'The assigned policy did not authorize this action, asset, target, or amount.',
      technicalReason: `policyId=${execution.policyId ?? 'default'}`,
      suggestedFix: 'Assign a matching policy or update policy rules for this asset and target.',
    };
  }

  if (settlement && ['failed', 'reverted'].includes(settlement.status)) {
    const reason = settlement.failureReason ?? `settlement.status=${settlement.status}`;
    const vaultCapExceeded =
      reason.includes('CapExceeded') ||
      reason.includes('0xa4875a49') ||
      reason.includes('commitSpend') ||
      reason.includes('budget vault cap exceeded');
    return {
      headline: vaultCapExceeded ? 'On-chain budget vault blocked settlement' : 'Settlement failed on-chain',
      humanReason: vaultCapExceeded
        ? 'The shared on-chain USDC budget vault is exhausted for this agent. DB budget can still show remaining while the vault cap is spent.'
        : settlement.failureReason ?? 'The relayer transaction failed or reverted.',
      technicalReason: reason.slice(0, 500),
      suggestedFix: vaultCapExceeded
        ? 'Top up the agent USDC budget on Fund & Authority, or use an agent whose on-chain vault has remaining cap. Then submit a new intent or retry settlement.'
        : 'Check wallet allowance, relayer balance, mandate validity, and retry settlement from this page.',
    };
  }

  if (status === 'failed') {
    if (pipeline?.message) {
      return {
        headline: `Pipeline failed during ${pipeline.stage ?? 'processing'}`,
        humanReason: pipeline.message,
        technicalReason: `pipelineFailure.stage=${pipeline.stage ?? 'unknown'}`,
        suggestedFix:
          pipeline.stage === 'intent'
            ? 'Retry the intent after confirming Stylus attestation and worker health on Render.'
            : 'Open Audit Logs or retry after confirming backend workers are running.',
      };
    }
    return {
      headline: 'Execution failed before settlement',
      humanReason: 'The pipeline stopped before risk evaluation or settlement could complete.',
      technicalReason: `status=${status}`,
      suggestedFix: 'Check Mission Control readiness, then submit a new intent. If this repeats, inspect Audit Logs.',
    };
  }

  if (status === 'cancelled') {
    return {
      headline: 'Execution cancelled',
      humanReason: 'This intent was cancelled before it could settle.',
      technicalReason: `status=${status}`,
      suggestedFix: 'Submit a new intent if you still need this action.',
    };
  }

  return null;
}
