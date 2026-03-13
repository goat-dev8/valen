import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { COMPLIANCE_QUEUE } from '../../common/constants/queues.constant';
import { ComplianceWorkerService } from '../../modules/compliance/compliance.service';
import { PipelineWorkerProcessor } from '../pipeline-worker.processor';
import { WorkerConsumerHealthService } from '../worker-consumer-health.service';
import { PIPELINE_WORKER_OPTIONS } from '../worker-options.constant';

@Processor(COMPLIANCE_QUEUE, PIPELINE_WORKER_OPTIONS)
export class ComplianceProcessor extends PipelineWorkerProcessor {
  private readonly logger = new Logger(ComplianceProcessor.name);

  constructor(
    consumerHealth: WorkerConsumerHealthService,
    private readonly complianceWorker: ComplianceWorkerService,
  ) {
    super(consumerHealth);
  }

  protected async handleJob(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing compliance job ${job.id}`);
    await this.complianceWorker.processExecution(job.data.executionId);
  }
}
