export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisKeyPrefixes = {
  IDEMPOTENCY: 'valen:idempotency:',
  RATE_LIMIT: 'valen:rate:',
  NONCE_LOCK: 'valen:nonce:',
  SESSION: 'valen:session:',
} as const;
