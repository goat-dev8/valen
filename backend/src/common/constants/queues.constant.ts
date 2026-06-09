export const QUEUE_PREFIX = 'valen';

export const INTENT_QUEUE = 'valen-intent';
export const COMPLIANCE_QUEUE = 'valen-compliance';
export const RISK_QUEUE = 'valen-risk';
export const POLICY_QUEUE = 'valen-policy';
export const SETTLEMENT_QUEUE = 'valen-settlement';
export const CONFIRMATION_QUEUE = 'valen-confirmation';
export const AUDIT_QUEUE = 'valen-audit';
export const NOTIFICATION_QUEUE = 'valen-notification';
export const VENDOR_QUEUE = 'valen-vendor';
export const INDEXER_QUEUE = 'valen-indexer';
export const MAINTENANCE_QUEUE = 'valen-maintenance';
export const DEAD_LETTER_QUEUE = 'valen-dead-letter';

export const ALL_QUEUES = [
  INTENT_QUEUE,
  COMPLIANCE_QUEUE,
  RISK_QUEUE,
  POLICY_QUEUE,
  SETTLEMENT_QUEUE,
  CONFIRMATION_QUEUE,
  AUDIT_QUEUE,
  NOTIFICATION_QUEUE,
  VENDOR_QUEUE,
  INDEXER_QUEUE,
  MAINTENANCE_QUEUE,
  DEAD_LETTER_QUEUE,
] as const;
