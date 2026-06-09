import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAINTENANCE_QUEUE } from '../../common/constants/queues.constant';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class MandateExpiryJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MandateExpiryJob.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.run(), 60 * 60 * 1000);
  }

  async run() {
    this.logger.log('Running mandate expiry job');
    await this.db.query(
      `UPDATE mandates SET status = 'expired', updated_at = now()
       WHERE status = 'active' AND valid_until < now()`,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

@Injectable()
export class SettlementReconciliationJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SettlementReconciliationJob.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.run(), 5 * 60 * 1000);
  }

  async run() {
    this.logger.log('Running settlement reconciliation job');
    await this.db.query(
      `SELECT id FROM settlements WHERE status = 'submitted' AND submitted_at < now() - interval '30 minutes' LIMIT 100`,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

@Injectable()
export class StylusKeepaliveJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StylusKeepaliveJob.name);
  private timer?: NodeJS.Timeout;

  onModuleInit() {
    this.timer = setInterval(() => this.logger.debug('Stylus keepalive check'), 24 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

@Injectable()
export class DlqMonitorJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DlqMonitorJob.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.run(), 10 * 60 * 1000);
  }

  async run() {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM dead_letter_jobs WHERE status = 'open'`,
    );
    const count = parseInt(result.rows[0]?.count ?? '0', 10);
    if (count > 0) this.logger.warn(`Open dead letter jobs: ${count}`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

@Injectable()
export class VendorCacheExpiryJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VendorCacheExpiryJob.name);
  private timer?: NodeJS.Timeout;

  constructor(@InjectQueue(MAINTENANCE_QUEUE) private readonly maintenanceQueue: Queue) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.run(), 60 * 60 * 1000);
  }

  async run() {
    this.logger.log('Enqueueing vendor cache expiry maintenance');
    await this.maintenanceQueue.add('expire-idempotency', {
      task: 'expire_idempotency_keys',
    });
    await this.maintenanceQueue.add('expire-nonce-locks', {
      task: 'expire_nonce_locks',
    });
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
