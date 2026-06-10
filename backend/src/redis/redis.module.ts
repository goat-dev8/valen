import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/config.types';
import { REDIS_CLIENT } from './redis.constants';
import { createProductionRedisClient } from './redis-connection';
import { RedisService } from './redis.service';

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
