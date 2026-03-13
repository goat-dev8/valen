import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { ALL_QUEUES } from '../../common/constants/queues.constant';
import { AppConfig } from '../../config/config.types';
import { createBullMqConnection } from '../../queues/bullmq.config';

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
export class OperatorQueueService {
  private readonly connection: ReturnType<typeof createBullMqConnection>;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.connection = createBullMqConnection(configService);
  }

  private getQueue(name: string): Queue {
    if (!ALL_QUEUES.includes(name as (typeof ALL_QUEUES)[number])) {
      throw new NotFoundException(`Unknown queue: ${name}`);
    }
    return new Queue(name, {
      connection: this.connection,
      prefix: '{valen}',
    });
  }

  async listQueueStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];
    for (const name of ALL_QUEUES) {
      const queue = this.getQueue(name);
      try {
        const [counts, workers] = await Promise.all([
          queue.getJobCounts(
            'waiting',
            'active',
            'delayed',
            'completed',
            'failed',
            'paused',
          ),
          queue.getWorkers(),
        ]);
        stats.push({
          name,
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          delayed: counts.delayed ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          paused: counts.paused ?? 0,
          workers: workers.length,
        });
      } finally {
        await queue.close();
      }
    }
    return stats;
  }

  async getWorkerCount(): Promise<number> {
    const settlementQueue = this.getQueue('valen-settlement');
    try {
      const workers = await settlementQueue.getWorkers();
      return workers.length;
    } finally {
      await settlementQueue.close();
    }
  }

  async listJobs(
    queueName: string,
    state: 'waiting' | 'active' | 'delayed' | 'completed' | 'failed',
    start = 0,
    end = 49,
  ) {
    const queue = this.getQueue(queueName);
    try {
      const jobs = await queue.getJobs([state], start, end, false);
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
    } finally {
      await queue.close();
    }
  }

  async getJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
      }
      const state = await job.getState();
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
    } finally {
      await queue.close();
    }
  }

  async retryJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
      }
      await job.retry();
      return { id: job.id, state: await job.getState() };
    } finally {
      await queue.close();
    }
  }

  async removeJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found in ${queueName}`);
      }
      await job.remove();
      return { removed: true, id: jobId };
    } finally {
      await queue.close();
    }
  }
}
