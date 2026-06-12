import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { INTENT_QUEUE } from '../../common/constants/queues.constant';
import { DEFAULT_JOB_OPTIONS } from '../bullmq.config';
import { ComplianceProducer } from '../producers/index';
import { OnChainAttestationService } from '../../modules/stylus/onchain-attestation.service';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { PipelineWorkerProcessor } from '../pipeline-worker.processor';
import { WorkerConsumerHealthService } from '../worker-consumer-health.service';
import { PIPELINE_WORKER_OPTIONS } from '../worker-options.constant';

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

@Processor(INTENT_QUEUE, PIPELINE_WORKER_OPTIONS)
export class IntentProcessor extends PipelineWorkerProcessor {
  private readonly logger = new Logger(IntentProcessor.name);

  constructor(
    consumerHealth: WorkerConsumerHealthService,
    private readonly onChainAttestationService: OnChainAttestationService,
    private readonly complianceProducer: ComplianceProducer,
    private readonly executionsRepository: ExecutionsRepository,
  ) {
    super(consumerHealth);
  }

  protected async handleJob(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing intent job ${job.id}`);
    try {
      await this.onChainAttestationService.attestExecution(job.data.executionId);
      const execution = await this.executionsRepository.findById(job.data.executionId);
      if (execution?.status === 'failed') {
        await this.executionsRepository.updateStatus(job.data.executionId, 'created');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Intent attestation failed for ${job.data.executionId}: ${message}`);
      await this.executionsRepository.mergeMetadata(job.data.executionId, {
        pipelineFailure: { stage: 'intent', message },
      });

      const maxAttempts = job.opts.attempts ?? DEFAULT_JOB_OPTIONS.attempts;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      if (isFinalAttempt) {
        await this.executionsRepository.updateStatus(job.data.executionId, 'failed');
      }
      throw error;
    }

    try {
      await this.enqueueComplianceWithRetry(job.data, 5);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Compliance enqueue failed after attestation for ${job.data.executionId}: ${message}`,
      );
      throw error;
    }
  }

  private async enqueueComplianceWithRetry(
    data: { organizationId: string; executionId: string },
    attempts: number,
  ): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await this.complianceProducer.enqueue(data);
        this.logger.log(`Enqueued compliance for ${data.executionId}`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Compliance enqueue attempt ${attempt}/${attempts} failed for ${data.executionId}: ${message}`,
        );
        if (attempt < attempts) {
          await sleep(attempt * 1000);
        }
      }
    }
    throw new Error(`Failed to enqueue compliance after ${attempts} attempts`);
  }
}
