import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAINTENANCE_QUEUE } from '../../common/constants/queues.constant';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class MandateExpiryJob {
  private readonly logger = new Logger(MandateExpiryJob.name);

  constructor(private readonly db: DatabaseService) {}

  async run() {
    this.logger.log('Running mandate expiry job');
    await this.db.query(
      `UPDATE mandates SET status = 'expired', updated_at = now()
       WHERE status = 'active' AND valid_until < now()`,
    );
  }
}

@Injectable()
export class SettlementReconciliationJob {
  private readonly logger = new Logger(SettlementReconciliationJob.name);

  constructor(private readonly db: DatabaseService) {}

  async run() {
    this.logger.log('Running settlement reconciliation job');
    await this.db.query(
      `SELECT id FROM settlements WHERE status = 'submitted' AND submitted_at < now() - interval '30 minutes' LIMIT 100`,
    );
  }
}

@Injectable()
export class StylusKeepaliveJob {
  private readonly logger = new Logger(StylusKeepaliveJob.name);

  async run() {
    this.logger.log('Running Stylus keepalive check');
  }
}

@Injectable()
export class DlqMonitorJob {
  private readonly logger = new Logger(DlqMonitorJob.name);

  constructor(private readonly db: DatabaseService) {}

  async run() {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM dead_letter_jobs WHERE status = 'open'`,
    );
    const count = parseInt(result.rows[0]?.count ?? '0', 10);
    if (count > 0) this.logger.warn(`Open dead letter jobs: ${count}`);
    else this.logger.log('No open dead letter jobs');
  }
}

@Injectable()
export class VendorCacheExpiryJob {
  private readonly logger = new Logger(VendorCacheExpiryJob.name);

  constructor(@InjectQueue(MAINTENANCE_QUEUE) private readonly maintenanceQueue: Queue) {}

  async run() {
    this.logger.log('Enqueueing vendor cache expiry maintenance');
    await this.maintenanceQueue.add('expire-idempotency', {
      task: 'expire_idempotency_keys',
    });
    await this.maintenanceQueue.add('expire-nonce-locks', {
      task: 'expire_nonce_locks',
    });
  }
}

@Injectable()
export class SchedulerRunner {
  private readonly logger = new Logger(SchedulerRunner.name);

  constructor(
    private readonly mandateExpiryJob: MandateExpiryJob,
    private readonly settlementReconciliationJob: SettlementReconciliationJob,
    private readonly stylusKeepaliveJob: StylusKeepaliveJob,
    private readonly dlqMonitorJob: DlqMonitorJob,
    private readonly vendorCacheExpiryJob: VendorCacheExpiryJob,
  ) {}

  async runScheduledJobs(now = new Date()): Promise<void> {
    const minute = now.getUTCMinutes();
    const hour = now.getUTCHours();

    await this.settlementReconciliationJob.run();
    await this.dlqMonitorJob.run();

    if (minute === 0) {
      await this.mandateExpiryJob.run();
      await this.vendorCacheExpiryJob.run();
    }

    if (minute === 0 && hour === 0) {
      await this.stylusKeepaliveJob.run();
    }

    this.logger.log(
      `Scheduler tick complete (UTC ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')})`,
    );
  }
}
