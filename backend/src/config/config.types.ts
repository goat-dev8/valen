export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  port: number;
  apiPrefix: string;
  databaseUrl: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  redisUrl: string;
  privyAppId: string;
  privyAppSecret: string;
  alchemyApiKey: string;
  sentryDsn?: string;
  posthogApiKey?: string;
  posthogHost?: string;
  arbitrumSepoliaRpcUrl: string;
  robinhoodTestnetRpcUrl: string;
  settlementPrivateKey: `0x${string}`;
  arbitrumSepoliaValenRegistry: `0x${string}`;
  arbitrumSepoliaValenSettlement: `0x${string}`;
  robinhoodTestnetValenRegistry: `0x${string}`;
  robinhoodTestnetValenSettlement: `0x${string}`;
  operatorDashboardSecret?: string;
}
