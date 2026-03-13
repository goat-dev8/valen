import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { INTENT_QUEUE } from '../../common/constants/queues.constant';
import { ComplianceProducer } from '../producers/index';
import { OnChainAttestationService } from '../../modules/stylus/onchain-attestation.service';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';

@Processor(INTENT_QUEUE)
export class IntentProcessor extends WorkerHost {
  private readonly logger = new Logger(IntentProcessor.name);

  constructor(
    private readonly onChainAttestationService: OnChainAttestationService,
    private readonly complianceProducer: ComplianceProducer,
    private readonly executionsRepository: ExecutionsRepository,
  ) {
    super();
  }

  async process(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing intent job ${job.id}`);
    try {
      await this.onChainAttestationService.attestExecution(job.data.executionId);
      await this.complianceProducer.enqueue(job.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Intent attestation failed for ${job.data.executionId}: ${message}`);
      await this.executionsRepository.updateStatus(job.data.executionId, 'failed');
      throw error;
    }
  }
}
