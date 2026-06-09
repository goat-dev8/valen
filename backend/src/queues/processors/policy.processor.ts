import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { POLICY_QUEUE } from '../../common/constants/queues.constant';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { NotificationProducer } from '../producers/index';

@Processor(POLICY_QUEUE)
export class PolicyProcessor extends WorkerHost {
  private readonly logger = new Logger(PolicyProcessor.name);

  constructor(
    private readonly executionsRepository: ExecutionsRepository,
    private readonly notificationProducer: NotificationProducer,
  ) {
    super();
  }

  async process(job: Job<{ organizationId: string; executionId: string }>) {
    this.logger.log(`Processing policy job ${job.id}`);
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
  }
}
