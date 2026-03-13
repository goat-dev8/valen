import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import {
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS,
} from '../redis/redis-connection';

@Injectable()
export class WorkerHeartbeatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerHeartbeatService.name);
  private timer?: NodeJS.Timeout;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  onModuleInit() {
    void this.beat();
    this.timer = setInterval(() => {
      void this.beat();
    }, 15_000);
    this.logger.log('Worker heartbeat started');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async beat(): Promise<void> {
    await this.redis.set(
      WORKER_HEARTBEAT_KEY,
      Date.now().toString(),
      'EX',
      WORKER_HEARTBEAT_TTL_SECONDS,
    );
  }
}
