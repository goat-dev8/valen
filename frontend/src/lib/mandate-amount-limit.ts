export type ParsedMandateAmountLimit = {
  amount: string | null;
  unit: string | null;
  display: string;
};

/** Extract numeric amount from human policy limits like "100 USDG" or "250 USDC equivalent". */
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

/** Normalize mandate cap for Postgres numeric columns and on-chain numeric comparisons. */
export function normalizeMandateAmountForDb(input: string | null | undefined): string | undefined {
  const { amount } = parseMandateAmountLimit(input);
  return amount ?? undefined;
}

export function formatMandateAmountDisplay(amount: string | null | undefined, unit?: string | null): string {
  const normalized = String(amount ?? '').trim();
  if (!normalized) return '';
  if (!unit?.trim()) return normalized;
  return `${normalized} ${unit.trim()}`;
}
