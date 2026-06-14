import { parseUnits } from 'viem';
import type { BudgetDto } from '@/types/api';
import { parseUsdcBaseUnits } from '@/lib/token-amount';

export type BudgetValidationReason =
  | 'budget_ok'
  | 'budget_missing'
  | 'budget_exhausted'
  | 'budget_exceeded'
  | 'budget_paused'
  | 'not_required';

export type BudgetValidationResult = {
  allow: boolean;
  reason: BudgetValidationReason;
  message: string;
  remainingBaseUnits: bigint;
  capBaseUnits: bigint;
  spentBaseUnits: bigint;
};

export function budgetRefusalMessage(reason: string | null | undefined): string {
  switch (reason) {
    case 'budget_exhausted':
      return 'Budget exhausted';
    case 'budget_paused':
      return 'Budget paused';
    case 'budget_exceeded':
      return 'Budget cap exceeded';
    case 'budget_missing':
      return 'Budget not configured';
    default:
      return reason ? reason.replace(/_/g, ' ') : 'Budget unavailable';
  }
}

export function parsePaymentAmountBaseUnits(
  amountHuman: string | null | undefined,
  decimals = 6,
): bigint {
  if (!amountHuman?.trim()) return BigInt(0);
  const trimmed = amountHuman.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return BigInt(0);
  return decimals === 18 ? parseUnits(trimmed, 18) : parseUnits(trimmed, decimals);
}

/** Mirrors backend BudgetService rules for a selected agent budget row. */
export function evaluateAgentBudget(input: {
  budget: BudgetDto | null | undefined;
  amountHuman?: string | null;
  amountDecimals?: number;
  required?: boolean;
}): BudgetValidationResult {
  const { budget, amountHuman, amountDecimals = 6, required = true } = input;
  const empty = {
    remainingBaseUnits: BigInt(0),
    capBaseUnits: BigInt(0),
    spentBaseUnits: BigInt(0),
  };

  if (!required) {
    return {
      allow: true,
      reason: 'not_required',
      message: 'Not required',
      ...empty,
    };
  }

  const amount = parsePaymentAmountBaseUnits(amountHuman, amountDecimals);

  if (!budget) {
    return {
      allow: false,
      reason: 'budget_missing',
      message: 'Budget not configured',
      ...empty,
    };
  }

  const cap = parseUsdcBaseUnits(budget.cap) ?? BigInt(0);
  const spent = parseUsdcBaseUnits(budget.spent) ?? BigInt(0);
  const remaining = parseUsdcBaseUnits(budget.remaining) ?? (cap > spent ? cap - spent : BigInt(0));

  if (budget.status !== 'active') {
    const reason: BudgetValidationReason =
      budget.status === 'exhausted' ? 'budget_exhausted' : 'budget_paused';
    return {
      allow: false,
      reason,
      message: budgetRefusalMessage(reason),
      remainingBaseUnits: remaining,
      capBaseUnits: cap,
      spentBaseUnits: spent,
    };
  }

  const afterSpent = spent + amount;
  if (amount > BigInt(0) && afterSpent > cap) {
    const reason: BudgetValidationReason = remaining <= BigInt(0) ? 'budget_exhausted' : 'budget_exceeded';
    return {
      allow: false,
      reason,
      message: budgetRefusalMessage(reason),
      remainingBaseUnits: remaining,
      capBaseUnits: cap,
      spentBaseUnits: spent,
    };
  }

  if (remaining <= BigInt(0) && amount > BigInt(0)) {
    return {
      allow: false,
      reason: 'budget_exhausted',
      message: 'Budget exhausted',
      remainingBaseUnits: remaining,
      capBaseUnits: cap,
      spentBaseUnits: spent,
    };
  }

  return {
    allow: true,
    reason: 'budget_ok',
    message: 'Budget available',
    remainingBaseUnits: remaining,
    capBaseUnits: cap,
    spentBaseUnits: spent,
  };
}
