export type ParsedMandateAmountLimit = {
  amount: string | null;
  unit: string | null;
  display: string;
};

export function parseMandateAmountLimit(input: string | null | undefined): ParsedMandateAmountLimit {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) {
    return { amount: null, unit: null, display: '' };
  }

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return { amount: trimmed, unit: null, display: trimmed };
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) {
    return { amount: null, unit: null, display: trimmed };
  }

  const amount = match[1];
  const unit = match[2]?.trim() || null;
  return { amount, unit, display: trimmed };
}

export function normalizeMandateAmountForDb(input: string | null | undefined): string | null {
  const { amount } = parseMandateAmountLimit(input);
  return amount;
}
