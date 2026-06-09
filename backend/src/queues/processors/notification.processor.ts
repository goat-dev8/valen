import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../../common/constants/queues.constant';
import { NotificationWorkerService } from '../../modules/notifications/notifications.service';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationWorker: NotificationWorkerService) {
    super();
  }

  async process(
    job: Job<{
      organizationId: string;
      recipientType: string;
      recipientRef: string;
      channel: string;
      template: string;
    }>,
  ) {
    this.logger.log(`Processing notification job ${job.id}`);
    await this.notificationWorker.deliver(job.data);
  }
}
