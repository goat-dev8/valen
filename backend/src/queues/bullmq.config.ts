import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.types';
import {
  createProductionRedisOptions,
  createRedisRetryStrategy,
  shouldReconnectOnRedisError,
} from '../redis/redis-connection';

type BullMqConnectionConfig = ReturnType<typeof buildBullMqConnectionConfig>;
let cachedConnection: BullMqConnectionConfig | null = null;

function buildBullMqConnectionConfig(redisUrl: string) {
  const parsed = new URL(redisUrl);
  const shared = createProductionRedisOptions(redisUrl);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: shared.maxRetriesPerRequest,
    enableReadyCheck: shared.enableReadyCheck,
    connectTimeout: shared.connectTimeout,
    keepAlive: shared.keepAlive,
    retryStrategy: createRedisRetryStrategy(),
    reconnectOnError: shouldReconnectOnRedisError,
  };
}

export function createBullMqConnection(configService: ConfigService<AppConfig, true>) {
  if (cachedConnection) {
    return cachedConnection;
  }
  const redisUrl = configService.get('redisUrl', { infer: true });
  cachedConnection = buildBullMqConnectionConfig(redisUrl);
  return cachedConnection;
}

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};
