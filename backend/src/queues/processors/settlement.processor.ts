import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SETTLEMENT_QUEUE } from '../../common/constants/queues.constant';
import { SettlementWorkerService } from '../../modules/settlement/settlement.service';
import { OnChainAttestationService } from '../../modules/stylus/onchain-attestation.service';
import { hasStoredOnChainAttestation } from '../../common/utils/execution-onchain.util';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { PipelineWorkerProcessor } from '../pipeline-worker.processor';
import { WorkerConsumerHealthService } from '../worker-consumer-health.service';
import { PIPELINE_WORKER_OPTIONS } from '../worker-options.constant';

@Processor(SETTLEMENT_QUEUE, PIPELINE_WORKER_OPTIONS)
export class SettlementProcessor extends PipelineWorkerProcessor {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(
    consumerHealth: WorkerConsumerHealthService,
    private readonly settlementWorker: SettlementWorkerService,
    private readonly onChainAttestationService: OnChainAttestationService,
    private readonly executionsRepository: ExecutionsRepository,
  ) {
    super(consumerHealth);
  }

  protected async handleJob(
    job: Job<{
      organizationId: string;
      executionId: string;
      settlementId: string;
      idempotencyKey: string;
    }>,
  ) {
    this.logger.log(`Processing settlement job ${job.id}`);
    const execution = await this.executionsRepository.findById(job.data.executionId);
    if (!execution) {
      throw new Error(`Execution ${job.data.executionId} not found for settlement`);
    }
    if (!hasStoredOnChainAttestation(execution.metadata)) {
      await this.onChainAttestationService.attestExecution(job.data.executionId);
    }
    const refreshed = await this.executionsRepository.findById(job.data.executionId);
    if (!hasStoredOnChainAttestation(refreshed?.metadata)) {
      throw new Error('Settlement attestation did not produce metadata.onchain');
    }
    await this.settlementWorker.processSettlement(job.data.settlementId);
  }
}
