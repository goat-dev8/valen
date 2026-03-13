import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  INTENT_QUEUE,
  COMPLIANCE_QUEUE,
  RISK_QUEUE,
  POLICY_QUEUE,
  SETTLEMENT_QUEUE,
  AUDIT_QUEUE,
  NOTIFICATION_QUEUE,
} from '../../common/constants/queues.constant';
import { DEFAULT_JOB_OPTIONS } from '../bullmq.config';

@Injectable()
export class IntentProducer {
  constructor(@InjectQueue(INTENT_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await this.queue.add('process-intent', data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `intent-${data.executionId}`,
    });
  }
}

@Injectable()
export class ComplianceProducer {
  constructor(@InjectQueue(COMPLIANCE_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await this.queue.add('process-compliance', data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `compliance-${data.executionId}`,
    });
  }
}

@Injectable()
export class RiskProducer {
  constructor(@InjectQueue(RISK_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await this.queue.add('process-risk', data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `risk-${data.executionId}`,
    });
  }
}

@Injectable()
export class PolicyProducer {
  constructor(@InjectQueue(POLICY_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await this.queue.add('process-policy', data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `policy-${data.executionId}`,
    });
  }
}

@Injectable()
export class SettlementProducer {
  constructor(@InjectQueue(SETTLEMENT_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: {
    organizationId: string;
    executionId: string;
    settlementId: string;
    idempotencyKey: string;
  }) {
    await this.queue.add('process-settlement', data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `settlement-${data.idempotencyKey}`,
    });
  }
}

@Injectable()
export class AuditProducer {
  constructor(@InjectQueue(AUDIT_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: {
    organizationId?: string;
    eventName: string;
    relatedEntityType: string;
    relatedEntityId: string;
  }) {
    await this.queue.add('process-audit', data, DEFAULT_JOB_OPTIONS);
  }
}

@Injectable()
export class NotificationProducer {
  constructor(@InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: {
    organizationId: string;
    recipientType: string;
    recipientRef: string;
    channel: string;
    template: string;
  }) {
    await this.queue.add('process-notification', data, DEFAULT_JOB_OPTIONS);
  }
}
