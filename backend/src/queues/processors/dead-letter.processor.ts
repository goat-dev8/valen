import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DEAD_LETTER_QUEUE } from '../../common/constants/queues.constant';
import { DeadLetterJobsRepository } from '../../database/repositories/dead-letter-jobs.repository';

@Processor(DEAD_LETTER_QUEUE)
export class DeadLetterProcessor extends WorkerHost {
  private readonly logger = new Logger(DeadLetterProcessor.name);

  constructor(private readonly deadLetterJobsRepository: DeadLetterJobsRepository) {
    super();
  }

  async process(
    job: Job<{
      queueName: string;
      jobId: string;
      organizationId?: string;
      executionId?: string;
      failureReason: string;
      retryCount: number;
      payloadRef?: string;
    }>,
  ) {
    this.logger.warn(`Recording dead letter for ${job.data.queueName}/${job.data.jobId}`);
    await this.deadLetterJobsRepository.create({
      queueName: job.data.queueName,
      jobId: job.data.jobId,
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      failureReason: job.data.failureReason,
      retryCount: job.data.retryCount,
      payloadRef: job.data.payloadRef,
    });
  }
}
