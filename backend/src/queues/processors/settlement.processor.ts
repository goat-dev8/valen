import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SETTLEMENT_QUEUE } from '../../common/constants/queues.constant';
import { SettlementWorkerService } from '../../modules/settlement/settlement.service';
import { OnChainAttestationService } from '../../modules/stylus/onchain-attestation.service';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';

@Processor(SETTLEMENT_QUEUE)
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(
    private readonly settlementWorker: SettlementWorkerService,
    private readonly onChainAttestationService: OnChainAttestationService,
    private readonly executionsRepository: ExecutionsRepository,
  ) {
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
    await this.onChainAttestationService.attestExecution(job.data.executionId);
    const execution = await this.executionsRepository.findById(job.data.executionId);
    if (!execution?.metadata?.onchain) {
      throw new Error('Settlement attestation did not produce metadata.onchain');
    }
    await this.settlementWorker.processSettlement(job.data.settlementId);
  }
}
