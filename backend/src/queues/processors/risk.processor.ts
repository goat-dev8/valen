import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RISK_QUEUE } from '../../common/constants/queues.constant';
import { RiskWorkerService } from '../../modules/risk/risk.service';
import { PipelineWorkerProcessor } from '../pipeline-worker.processor';
import { WorkerConsumerHealthService } from '../worker-consumer-health.service';
import { PIPELINE_WORKER_OPTIONS } from '../worker-options.constant';

@Processor(RISK_QUEUE, PIPELINE_WORKER_OPTIONS)
export class RiskProcessor extends PipelineWorkerProcessor {
  private readonly logger = new Logger(RiskProcessor.name);

  constructor(
    consumerHealth: WorkerConsumerHealthService,
    private readonly riskWorker: RiskWorkerService,
  ) {
    super(consumerHealth);
  }

  protected async handleJob(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing risk job ${job.id}`);
    await this.riskWorker.processExecution(job.data.executionId);
  }
}
