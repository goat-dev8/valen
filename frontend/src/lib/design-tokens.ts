/** Design system tokens — Ultra Premium Light (W1) */
export const colors = {
  bg: '#FFFFFF',
  bgSubtle: '#FAFBFC',
  bgMuted: '#F4F6F8',
  border: '#E8ECF0',
  borderStrong: '#D1D9E0',
  text: '#1A2332',
  textSecondary: '#5E6C7B',
  textMuted: '#8B98A5',
  textStrong: '#012b54',
  primary: '#0066FF',
  primarySubtle: '#EBF2FF',
  accent: '#84CC16',
  success: '#0D9488',
  successSubtle: '#ECFDF5',
  warning: '#D97706',
  warningSubtle: '#FFFBEB',
  danger: '#DC2626',
  dangerSubtle: '#FEF2F2',
  proof: '#0066FF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const outcomeColors = {
  executed: { bg: '#ECFDF5', border: '#0D9488', label: 'Settled' },
  refused: { bg: '#FEF2F2', border: '#DC2626', label: 'Refused' },
  pending: { bg: '#FFFBEB', border: '#D97706', label: 'Pending' },
  approval: { bg: '#FFF7ED', border: '#F97316', label: 'Awaiting Approval' },
} as const;

export const STATUS_HUMAN_LABELS: Record<string, string> = {
  created: 'Created',
  validated: 'Validated',
  executed: 'Settled',
  compliance_failed: 'Refused — Compliance',
  risk_failed: 'Refused — Risk',
  policy_rejected: 'Refused — Policy',
  approval_required: 'Awaiting Approval',
  approved: 'Approved',
  settlement_submitted: 'Settlement Submitted',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const PIPELINE_STAGES = [
  { id: 'intent', label: 'Intent' },
  { id: 'policy', label: 'Policy Check' },
  { id: 'budget', label: 'Budget Check' },
  { id: 'risk', label: 'Risk Review' },
  { id: 'execution', label: 'Execution' },
  { id: 'proof', label: 'Proof Generation' },
] as const;
