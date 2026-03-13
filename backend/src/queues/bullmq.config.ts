import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.types';

export function createBullMqConnection(configService: ConfigService<AppConfig, true>) {
  const redisUrl = configService.get('redisUrl', { infer: true });
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: true,
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
    reconnectOnError: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('readonly') || message.includes('connect');
    },
  };
}

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};
