import { createHash, randomBytes } from 'crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashPayload(payload: unknown): string {
  return sha256(JSON.stringify(payload));
}

export function generateApiKeySecret(): string {
  return `valen_${randomBytes(32).toString('hex')}`;
}

export function apiKeyPrefix(secret: string): string {
  return secret.slice(0, 12);
}
