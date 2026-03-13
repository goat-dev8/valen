import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../config/config.types';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

function createProductionRedisClient(redisUrl: string): Redis {
  const tls = redisUrl.startsWith('rediss://') ? {} : undefined;
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    tls,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    reconnectOnError: (error) => {
      const message = error.message.toLowerCase();
      return message.includes('readonly') || message.includes('connect');
    },
  });
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const redisUrl = configService.get('redisUrl', { infer: true });
        return createProductionRedisClient(redisUrl);
      },
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
