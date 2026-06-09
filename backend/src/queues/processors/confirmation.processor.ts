import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CONFIRMATION_QUEUE } from '../../common/constants/queues.constant';
import { SettlementsRepository } from '../../database/repositories/settlements.repository';
import { AlchemyService } from '../../modules/settlement/chain.service';

@Processor(CONFIRMATION_QUEUE)
export class ConfirmationProcessor extends WorkerHost {
  private readonly logger = new Logger(ConfirmationProcessor.name);

  constructor(
    private readonly settlementsRepository: SettlementsRepository,
    private readonly alchemyService: AlchemyService,
  ) {
    super();
  }

  async process(job: Job<{ settlementId: string; chainId: number; txHash: string }>) {
    this.logger.log(`Processing confirmation job ${job.id}`);
    const receipt = await this.alchemyService.getTransactionStatus(
      job.data.chainId,
      job.data.txHash,
    );

    if (receipt) {
      await this.settlementsRepository.updateStatus(job.data.settlementId, 'confirmed', {
        confirmedAt: new Date(),
      });
    }
  }
}
