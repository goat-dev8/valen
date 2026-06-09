import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { INTENT_QUEUE } from '../../common/constants/queues.constant';
import { ComplianceProducer } from '../producers/index';

@Processor(INTENT_QUEUE)
export class IntentProcessor extends WorkerHost {
  private readonly logger = new Logger(IntentProcessor.name);

  constructor(private readonly complianceProducer: ComplianceProducer) {
    super();
  }

  async process(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing intent job ${job.id}`);
    await this.complianceProducer.enqueue(job.data);
  }
}
