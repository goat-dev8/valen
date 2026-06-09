import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SETTLEMENT_QUEUE } from '../../common/constants/queues.constant';
import { SettlementWorkerService } from '../../modules/settlement/settlement.service';

@Processor(SETTLEMENT_QUEUE)
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(private readonly settlementWorker: SettlementWorkerService) {
    super();
  }

  async process(
    job: Job<{
      organizationId: string;
      executionId: string;
      settlementId: string;
      idempotencyKey: string;
    }>,
  ) {
    this.logger.log(`Processing settlement job ${job.id}`);
    await this.settlementWorker.processSettlement(job.data.settlementId);
  }
}
