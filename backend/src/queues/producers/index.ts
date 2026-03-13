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
import { enqueueDeterministicJob } from '../queue-enqueue.util';

@Injectable()
export class IntentProducer {
  constructor(@InjectQueue(INTENT_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await enqueueDeterministicJob(
      this.queue,
      'process-intent',
      data,
      `intent-${data.executionId}`,
    );
  }
}

@Injectable()
export class ComplianceProducer {
  constructor(@InjectQueue(COMPLIANCE_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await enqueueDeterministicJob(
      this.queue,
      'process-compliance',
      data,
      `compliance-${data.executionId}`,
    );
  }
}

@Injectable()
export class RiskProducer {
  constructor(@InjectQueue(RISK_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await enqueueDeterministicJob(
      this.queue,
      'process-risk',
      data,
      `risk-${data.executionId}`,
    );
  }
}

@Injectable()
export class PolicyProducer {
  constructor(@InjectQueue(POLICY_QUEUE) private readonly queue: Queue) {}

  async enqueue(data: { organizationId: string; executionId: string }) {
    await enqueueDeterministicJob(
      this.queue,
      'process-policy',
      data,
      `policy-${data.executionId}`,
    );
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
    await enqueueDeterministicJob(
      this.queue,
      'process-settlement',
      data,
      `settlement-${data.idempotencyKey}`,
    );
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
