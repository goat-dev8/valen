import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { COMPLIANCE_QUEUE } from '../../common/constants/queues.constant';
import { ComplianceWorkerService } from '../../modules/compliance/compliance.service';
import { PIPELINE_WORKER_OPTIONS } from '../worker-options.constant';

@Processor(COMPLIANCE_QUEUE, PIPELINE_WORKER_OPTIONS)
export class ComplianceProcessor extends WorkerHost {
  private readonly logger = new Logger(ComplianceProcessor.name);

  constructor(private readonly complianceWorker: ComplianceWorkerService) {
    super();
  }

  async process(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing compliance job ${job.id}`);
    await this.complianceWorker.processExecution(job.data.executionId);
  }
}
