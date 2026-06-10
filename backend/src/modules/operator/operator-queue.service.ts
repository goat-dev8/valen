import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { ALL_QUEUES } from '../../common/constants/queues.constant';
import { AppConfig } from '../../config/config.types';
import { createBullMqConnection } from '../../queues/bullmq.config';
import { RedisService } from '../../redis/redis.service';
import {
  REDIS_OP_TIMEOUT_MS,
  withRedisTimeout,
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS,
} from '../../redis/redis-connection';
import {
  WORKER_CONSUMER_KEY,
  WorkerConsumerHealthService,
} from '../../queues/worker-consumer-health.service';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
  workers: number;
}

@Injectable()
export class OperatorQueueService implements OnModuleDestroy {
  private readonly connection: ReturnType<typeof createBullMqConnection>;
  private readonly queues = new Map<string, Queue>();

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly redisService: RedisService,
  ) {
    this.connection = createBullMqConnection(configService);
  }

  private getQueue(name: string): Queue {
    if (!ALL_QUEUES.includes(name as (typeof ALL_QUEUES)[number])) {
      throw new NotFoundException(`Unknown queue: ${name}`);
    }
    const existing = this.queues.get(name);
    if (existing) return existing;

    const queue = new Queue(name, {
      connection: this.connection,
      prefix: '{valen}',
    });
    this.queues.set(name, queue);
    return queue;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
  }

  private queueKey(name: string, suffix: string): string {
    return `{valen}:${name}:${suffix}`;
  }

  private async countList(name: string, suffix: string): Promise<number> {
    return withRedisTimeout(
      this.redisService.getClient().llen(this.queueKey(name, suffix)),
      REDIS_OP_TIMEOUT_MS,
      `${name} ${suffix} count`,
    );
  }

  private async countZset(name: string, suffix: string): Promise<number> {
    return withRedisTimeout(
      this.redisService.getClient().zcard(this.queueKey(name, suffix)),
      REDIS_OP_TIMEOUT_MS,
      `${name} ${suffix} count`,
    );
  }

  private parseJobData(value: string | undefined): unknown {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async isWorkerHeartbeatFresh(): Promise<boolean> {
    try {
      const heartbeat = await withRedisTimeout(
        this.redisService.get(WORKER_HEARTBEAT_KEY),
        REDIS_OP_TIMEOUT_MS,
        'worker heartbeat read',
      );
      if (!heartbeat) return false;
      const ageMs = Date.now() - parseInt(heartbeat, 10);
      return ageMs >= 0 && ageMs <= WORKER_HEARTBEAT_TTL_SECONDS * 1000;
    } catch {
      return false;
    }
  }

  private async getQueueStats(name: string, workerCount: number): Promise<QueueStats> {
    const [waiting, active, delayed, completed, failed, paused] =
      await Promise.all([
        this.countList(name, 'wait'),
        this.countList(name, 'active'),
        this.countZset(name, 'delayed'),
        this.countZset(name, 'completed'),
        this.countZset(name, 'failed'),
        this.countList(name, 'paused'),
      ]);
    return {
      name,
      waiting,
      active,
      delayed,
      completed,
      failed,
      paused,
      workers: workerCount,
    };
  }

  async listQueueStats(): Promise<QueueStats[]> {
    const workerCount = (await this.isWorkerHeartbeatFresh()) ? 1 : 0;
    const stats = await Promise.all(
      ALL_QUEUES.map((name) => this.getQueueStats(name, workerCount)),
    );
    return stats;
  }

  async isWorkerConsumerFresh(): Promise<boolean> {
    try {
      const payload = await withRedisTimeout(
        this.redisService.get(WORKER_CONSUMER_KEY),
        REDIS_OP_TIMEOUT_MS,
        'worker consumer read',
      );
      return WorkerConsumerHealthService.isFresh(
        payload,
        WORKER_HEARTBEAT_TTL_SECONDS * 1000,
      );
    } catch {
      return false;
    }
  }

  async getPipelineBacklog(): Promise<number> {
    const pipelineQueues = [
      'valen-intent',
      'valen-compliance',
      'valen-risk',
      'valen-policy',
      'valen-settlement',
    ];
    const stats = await Promise.all(
      pipelineQueues.map((name) => this.getQueueStats(name, 0)),
    );
    return stats.reduce((sum, q) => sum + q.waiting + q.active, 0);
  }

  async getWorkerCount(): Promise<number> {
    const [heartbeat, consumer] = await Promise.all([
      this.isWorkerHeartbeatFresh(),
      this.isWorkerConsumerFresh(),
    ]);
    return heartbeat && consumer ? 1 : 0;
  }

  async listJobs(
    queueName: string,
    state: 'waiting' | 'active' | 'delayed' | 'completed' | 'failed',
    start = 0,
    end = 49,
  ) {
    const redis = this.redisService.getClient();
    const ids =
      state === 'waiting' || state === 'active'
        ? await withRedisTimeout(
            redis.lrange(
              this.queueKey(queueName, state === 'waiting' ? 'wait' : 'active'),
              start,
              end,
            ),
            REDIS_OP_TIMEOUT_MS,
            `${queueName} ${state} jobs`,
          )
        : await withRedisTimeout(
            redis.zrange(this.queueKey(queueName, state), start, end),
            REDIS_OP_TIMEOUT_MS,
            `${queueName} ${state} jobs`,
          );

    return Promise.all(
      ids.map(async (id) => {
        const job = await withRedisTimeout(
          redis.hgetall(`{valen}:${queueName}:${id}`),
          REDIS_OP_TIMEOUT_MS,
          `${queueName} ${id} job hash`,
        );
        return {
          id,
          name: job.name,
          state,
          attemptsMade: Number(job.attemptsMade ?? job.atm ?? 0),
          timestamp: job.timestamp ? Number(job.timestamp) : undefined,
          processedOn: job.processedOn ? Number(job.processedOn) : undefined,
          finishedOn: job.finishedOn ? Number(job.finishedOn) : undefined,
          failedReason: job.failedReason,
          data: this.parseJobData(job.data),
        };
      }),
    );
  }

  async getJob(queueName: string, jobId: string) {
    if (!ALL_QUEUES.includes(queueName as (typeof ALL_QUEUES)[number])) {
      throw new NotFoundException(`Unknown queue: ${queueName}`);
    }
    const job = await withRedisTimeout(
      this.redisService.getClient().hgetall(`{valen}:${queueName}:${jobId}`),
      REDIS_OP_TIMEOUT_MS,
      `${queueName} get job`,
    );
    if (!job || Object.keys(job).length === 0) {
      throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
    }
    return {
      id: jobId,
      name: job.name,
      state: 'unknown',
      attemptsMade: Number(job.attemptsMade ?? job.atm ?? 0),
      timestamp: job.timestamp ? Number(job.timestamp) : undefined,
      processedOn: job.processedOn ? Number(job.processedOn) : undefined,
      finishedOn: job.finishedOn ? Number(job.finishedOn) : undefined,
      failedReason: job.failedReason,
      stacktrace: this.parseJobData(job.stacktrace) ?? [],
      data: this.parseJobData(job.data),
      returnvalue: job.returnvalue,
    };
  }

  async retryJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await withRedisTimeout(
      queue.getJob(jobId),
      REDIS_OP_TIMEOUT_MS,
      `${queueName} retry lookup`,
    );
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
    }
    await withRedisTimeout(job.retry(), REDIS_OP_TIMEOUT_MS, `${queueName} retry`);
    return { id: job.id, state: await job.getState() };
  }

  async removeJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await withRedisTimeout(
      queue.getJob(jobId),
      REDIS_OP_TIMEOUT_MS,
      `${queueName} remove lookup`,
    );
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
    }
    await withRedisTimeout(job.remove(), REDIS_OP_TIMEOUT_MS, `${queueName} remove`);
    return { removed: true, id: jobId };
  }
}
