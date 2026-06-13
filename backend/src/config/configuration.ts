import { AppConfig } from './config.types';
import { EnvSchema } from './env.validation';

export function configuration(env: EnvSchema): AppConfig {
  const alchemyKey = env.ALCHEMY_API_KEY;
  const settlementPrivateKey = env.PRIVATE_KEY.startsWith('0x')
    ? env.PRIVATE_KEY
    : `0x${env.PRIVATE_KEY}`;
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    databaseUrl: env.DATABASE_URL,
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    redisUrl: env.REDIS_URL,
    privyAppId: env.PRIVY_APP_ID,
    privyAppSecret: env.PRIVY_APP_SECRET,
    alchemyApiKey: alchemyKey,
    sentryDsn: env.SENTRY_DSN,
    posthogApiKey: env.POSTHOG_API_KEY,
    posthogHost: env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
    arbitrumSepoliaRpcUrl:
      env.ARBITRUM_SEPOLIA_RPC_URL ??
      `https://arb-sepolia.g.alchemy.com/v2/${alchemyKey}`,
    robinhoodTestnetRpcUrl:
      env.ROBINHOOD_TESTNET_RPC_URL ??
      `https://robinhood-testnet.g.alchemy.com/v2/${alchemyKey}`,
    settlementPrivateKey: settlementPrivateKey as `0x${string}`,
    arbitrumSepoliaValenRegistry:
      env.ARBITRUM_SEPOLIA_VALEN_REGISTRY as `0x${string}`,
    arbitrumSepoliaValenSettlement:
      env.ARBITRUM_SEPOLIA_VALEN_SETTLEMENT as `0x${string}`,
    robinhoodTestnetValenRegistry:
      env.ROBINHOOD_TESTNET_VALEN_REGISTRY as `0x${string}`,
    robinhoodTestnetValenSettlement:
      env.ROBINHOOD_TESTNET_VALEN_SETTLEMENT as `0x${string}`,
    arbitrumSepoliaTokenSettlementAdapter:
      env.ARBITRUM_SEPOLIA_TOKEN_SETTLEMENT_ADAPTER as `0x${string}` | undefined,
    robinhoodTestnetTokenSettlementAdapter:
      env.ROBINHOOD_TESTNET_TOKEN_SETTLEMENT_ADAPTER as `0x${string}` | undefined,
    robinhoodAssetRegistryAddress:
      env.ROBINHOOD_ASSET_REGISTRY_ADDRESS as `0x${string}` | undefined,
    erc8004RegistryAddress: env.ERC8004_REGISTRY_ADDRESS as `0x${string}` | undefined,
    erc8004RegistryChainId: env.ERC8004_REGISTRY_CHAIN_ID,
    valenIdentityResolverAddress: env.VALEN_IDENTITY_RESOLVER_ADDRESS as `0x${string}` | undefined,
    valenBudgetVaultAddress: env.VALEN_BUDGET_VAULT_ADDRESS as `0x${string}` | undefined,
    x402FacilitatorUrl: env.X402_FACILITATOR_URL,
    operatorDashboardSecret: env.OPERATOR_DASHBOARD_SECRET,
  };
}
