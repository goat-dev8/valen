import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RISK_QUEUE } from '../../common/constants/queues.constant';
import { RiskWorkerService } from '../../modules/risk/risk.service';
import { PIPELINE_WORKER_OPTIONS } from '../worker-options.constant';

@Processor(RISK_QUEUE, PIPELINE_WORKER_OPTIONS)
export class RiskProcessor extends WorkerHost {
  private readonly logger = new Logger(RiskProcessor.name);

  constructor(private readonly riskWorker: RiskWorkerService) {
    super();
  }

  async process(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing risk job ${job.id}`);
    await this.riskWorker.processExecution(job.data.executionId);
  }
}
