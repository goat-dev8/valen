import type { BudgetValidationResult } from '@/lib/agent-budget-validation';
import type { IntentEligibilityResult } from '@/lib/intent-eligibility';

/** User-facing rejection label for agent cards (FIX 9). */
export function eligibilityFailureLabel(
  result: IntentEligibilityResult,
  budgetCheck?: BudgetValidationResult | null,
): string {
  if (result.eligible && budgetCheck && !budgetCheck.allow) {
    return budgetCheck.message;
  }

  if (result.mandateStatus === 'missing') return 'No Active Mandate';
  if (result.mandateStatus === 'expired') return 'Mandate Expired';
  if (result.mandateStatus === 'stale') return 'Mandate Expired';
  if (result.mandateStatus === 'revoked') return 'No Active Mandate';

  const failed = result.checks.find((check) => !check.passed);
  if (!failed) return result.failureReason ?? 'Not eligible';

  switch (failed.id) {
    case 'asset':
      return 'Asset Not Allowed';
    case 'action':
      return 'Missing Permission';
    case 'network':
      return 'Network Not Allowed';
    case 'policy':
      return 'Missing Permission';
    case 'mandate':
      return failed.detail === 'Expired' || failed.detail.includes('Stale')
        ? 'Mandate Expired'
        : 'No Active Mandate';
    default:
      return result.failureReason ?? 'Not eligible';
  }
}

export function isAgentRunnable(
  evaluation: IntentEligibilityResult,
  budgetCheck: BudgetValidationResult | null,
  requiresBudget: boolean,
): boolean {
  if (!evaluation.eligible) return false;
  if (!requiresBudget) return true;
  return budgetCheck?.allow ?? false;
}
