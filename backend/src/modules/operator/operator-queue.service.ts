import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
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
    const queue = this.getQueue(name);
    const counts = await withRedisTimeout(
      queue.getJobCounts(
        'waiting',
        'active',
        'delayed',
        'completed',
        'failed',
        'paused',
      ),
      REDIS_OP_TIMEOUT_MS,
      `${name} job counts`,
    );
    return {
      name,
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      delayed: counts.delayed ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      paused: counts.paused ?? 0,
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

  async getWorkerCount(): Promise<number> {
    return (await this.isWorkerHeartbeatFresh()) ? 1 : 0;
  }

  async listJobs(
    queueName: string,
    state: 'waiting' | 'active' | 'delayed' | 'completed' | 'failed',
    start = 0,
    end = 49,
  ) {
    const queue = this.getQueue(queueName);
    const jobs = await withRedisTimeout(
      queue.getJobs([state], start, end, false),
      REDIS_OP_TIMEOUT_MS,
      `${queueName} list jobs`,
    );
    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        name: job.name,
        state,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        data: job.data,
      })),
    );
  }

  async getJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await withRedisTimeout(
      queue.getJob(jobId),
      REDIS_OP_TIMEOUT_MS,
      `${queueName} get job`,
    );
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
    }
    const state = await withRedisTimeout(
      job.getState(),
      REDIS_OP_TIMEOUT_MS,
      `${queueName} job state`,
    );
    return {
      id: job.id,
      name: job.name,
      state,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      data: job.data,
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
