import { validateEnv } from './env.validation';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/valen',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  REDIS_URL: 'redis://localhost:6379',
  PRIVY_APP_ID: 'privy-app-id',
  PRIVY_APP_SECRET: 'privy-app-secret',
  ALCHEMY_API_KEY: 'alchemy-api-key',
  PRIVATE_KEY: '0x'.padEnd(66, '1'),
  ARBITRUM_SEPOLIA_VALEN_REGISTRY: '0x'.padEnd(42, '2'),
  ARBITRUM_SEPOLIA_VALEN_SETTLEMENT: '0x'.padEnd(42, '3'),
  ROBINHOOD_TESTNET_VALEN_REGISTRY: '0x'.padEnd(42, '4'),
  ROBINHOOD_TESTNET_VALEN_SETTLEMENT: '0x'.padEnd(42, '5'),
};

describe('validateEnv', () => {
  it('accepts required chain settlement configuration', () => {
    const env = validateEnv(baseEnv);

    expect(env.PRIVATE_KEY).toHaveLength(66);
    expect(env.ARBITRUM_SEPOLIA_VALEN_SETTLEMENT).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(env.ROBINHOOD_TESTNET_VALEN_REGISTRY).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('rejects missing settlement contract addresses', () => {
    const { ARBITRUM_SEPOLIA_VALEN_SETTLEMENT: _unused, ...env } = baseEnv;

    expect(() => validateEnv(env)).toThrow(
      /ARBITRUM_SEPOLIA_VALEN_SETTLEMENT/,
    );
  });
});
