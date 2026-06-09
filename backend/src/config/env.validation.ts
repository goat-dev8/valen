import { z } from 'zod';

const trimmedString = () => z.string().trim();

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default(''),
  DATABASE_URL: trimmedString().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: trimmedString().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: trimmedString().min(
    1,
    'SUPABASE_SERVICE_ROLE_KEY is required',
  ),
  REDIS_URL: trimmedString().min(1, 'REDIS_URL is required'),
  PRIVY_APP_ID: trimmedString().min(1, 'PRIVY_APP_ID is required'),
  PRIVY_APP_SECRET: trimmedString().min(1, 'PRIVY_APP_SECRET is required'),
  ALCHEMY_API_KEY: trimmedString().min(1, 'ALCHEMY_API_KEY is required'),
  SENTRY_DSN: trimmedString().url().optional(),
  POSTHOG_API_KEY: trimmedString().optional(),
  POSTHOG_HOST: trimmedString().url().optional(),
  ARBITRUM_SEPOLIA_RPC_URL: trimmedString().url().optional(),
  ROBINHOOD_TESTNET_RPC_URL: trimmedString().url().optional(),
  PRIVATE_KEY: trimmedString()
    .regex(/^(0x)?[0-9a-fA-F]{64}$/, 'PRIVATE_KEY must be a 32-byte hex key'),
  ARBITRUM_SEPOLIA_VALEN_REGISTRY: trimmedString()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'ARBITRUM_SEPOLIA_VALEN_REGISTRY must be an EVM address'),
  ARBITRUM_SEPOLIA_VALEN_SETTLEMENT: trimmedString()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'ARBITRUM_SEPOLIA_VALEN_SETTLEMENT must be an EVM address'),
  ROBINHOOD_TESTNET_VALEN_REGISTRY: trimmedString()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'ROBINHOOD_TESTNET_VALEN_REGISTRY must be an EVM address'),
  ROBINHOOD_TESTNET_VALEN_SETTLEMENT: trimmedString()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'ROBINHOOD_TESTNET_VALEN_SETTLEMENT must be an EVM address'),
});

export type EnvSchema = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvSchema {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }
  return result.data;
}
