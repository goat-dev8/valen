import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { POLICY_QUEUE } from '../../common/constants/queues.constant';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { RiskScoresRepository } from '../../database/repositories/risk-scores.repository';
import { SettlementsRepository } from '../../database/repositories/settlements.repository';
import { NotificationProducer, SettlementProducer } from '../producers/index';
import { ChainService } from '../../modules/settlement/chain.service';

@Processor(POLICY_QUEUE)
export class PolicyProcessor extends WorkerHost {
  private readonly logger = new Logger(PolicyProcessor.name);

  constructor(
    private readonly executionsRepository: ExecutionsRepository,
    private readonly riskScoresRepository: RiskScoresRepository,
    private readonly settlementsRepository: SettlementsRepository,
    private readonly settlementProducer: SettlementProducer,
    private readonly chainService: ChainService,
    private readonly notificationProducer: NotificationProducer,
  ) {
    super();
  }

  async process(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing policy job ${job.id}`);
    const score = await this.riskScoresRepository.findLatestByExecution(
      job.data.executionId,
    );
    if (!score) {
      await this.executionsRepository.updateStatus(
        job.data.executionId,
        'policy_rejected',
      );
      throw new Error('Risk score is required before policy processing');
    }

    if (score.requires_approval) {
      await this.executionsRepository.updateStatus(
        job.data.executionId,
        'approval_required',
      );

      await this.notificationProducer.enqueue({
        organizationId: job.data.organizationId,
        recipientType: 'organization',
        recipientRef: job.data.organizationId,
        channel: 'in_app',
        template: 'execution.approval_required',
      });
      return;
    }

    await this.executionsRepository.updateStatus(job.data.executionId, 'approved');

    const execution = await this.executionsRepository.findById(job.data.executionId);
    if (!execution) {
      throw new Error('Execution not found after policy approval');
    }

    const settlement = await this.settlementsRepository.create({
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      chainId: execution.target_chain_id,
      contractAddress: this.chainService.getSettlementAddress(execution.target_chain_id),
      targetAddress: execution.target_address ?? undefined,
    });

    await this.executionsRepository.updateStatus(
      job.data.executionId,
      'settlement_submitted',
    );

    await this.settlementProducer.enqueue({
      organizationId: job.data.organizationId,
      executionId: job.data.executionId,
      settlementId: settlement.id,
      idempotencyKey: `auto-settle-${job.data.executionId}`,
    });
  }
}
