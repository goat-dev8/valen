import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MAINTENANCE_QUEUE } from '../../common/constants/queues.constant';
import { DatabaseService } from '../../database/database.service';

@Processor(MAINTENANCE_QUEUE)
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(private readonly db: DatabaseService) {
    super();
  }

  async process(job: Job<{ task: string }>) {
    this.logger.log(`Running maintenance task: ${job.data.task}`);
    if (job.data.task === 'expire_idempotency_keys') {
      await this.db.query(
        `DELETE FROM intent_idempotency_keys WHERE expires_at < now()`,
      );
    }
    if (job.data.task === 'expire_nonce_locks') {
      await this.db.query(`DELETE FROM nonce_locks WHERE expires_at < now()`);
    }
  }
}
