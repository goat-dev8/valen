import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WorkerConsumerHealthService } from './worker-consumer-health.service';

export abstract class PipelineWorkerProcessor extends WorkerHost {
  constructor(private readonly consumerHealth: WorkerConsumerHealthService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    await this.consumerHealth.touch(`job:${job.queueName}`);
    return this.handleJob(job);
  }

  protected abstract handleJob(job: Job): Promise<unknown>;
}
