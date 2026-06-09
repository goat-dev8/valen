import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AUDIT_QUEUE } from '../../common/constants/queues.constant';
import { AuditWorkerService } from '../../modules/audit/audit.service';

@Processor(AUDIT_QUEUE)
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly auditWorker: AuditWorkerService) {
    super();
  }

  async process(
    job: Job<{
      organizationId?: string;
      eventName: string;
      relatedEntityType: string;
      relatedEntityId: string;
    }>,
  ) {
    this.logger.log(`Processing audit job ${job.id}`);
    await this.auditWorker.processEvent(job.data);
  }
}
