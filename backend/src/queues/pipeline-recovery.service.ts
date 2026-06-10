import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  ComplianceProducer,
  IntentProducer,
  PolicyProducer,
  RiskProducer,
  SettlementProducer,
} from './producers/index';

type StuckExecutionRow = {
  id: string;
  organization_id: string;
  status: string;
};

@Injectable()
export class PipelineRecoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PipelineRecoveryService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly intentProducer: IntentProducer,
    private readonly complianceProducer: ComplianceProducer,
    private readonly riskProducer: RiskProducer,
    private readonly policyProducer: PolicyProducer,
    private readonly settlementProducer: SettlementProducer,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.recoverStuckExecutions().catch((error) => {
        this.logger.error(`Pipeline recovery failed: ${(error as Error).message}`);
      });
    }, 60_000);
    void this.recoverStuckExecutions().catch((error) => {
      this.logger.error(`Initial pipeline recovery failed: ${(error as Error).message}`);
    });
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async recoverStuckExecutions(): Promise<number> {
    const stuck = await this.databaseService.query<StuckExecutionRow>(
      `SELECT id, organization_id, status
       FROM executions
       WHERE status IN ('created', 'validated', 'approved', 'settlement_submitted')
         AND metadata->'onchain'->>'complianceHash' IS NOT NULL
         AND updated_at < now() - interval '2 minutes'
       ORDER BY updated_at ASC
       LIMIT 20`,
    );

    let recovered = 0;
    for (const execution of stuck.rows) {
      try {
        await this.recoverExecution(execution);
        recovered += 1;
      } catch (error) {
        this.logger.warn(
          `Recovery skipped for ${execution.id} (${execution.status}): ${(error as Error).message}`,
        );
      }
    }

    if (recovered > 0) {
      this.logger.log(`Recovered ${recovered} stuck execution(s)`);
    }
    return recovered;
  }

  private async recoverExecution(execution: StuckExecutionRow): Promise<void> {
    const payload = {
      organizationId: execution.organization_id,
      executionId: execution.id,
    };

    switch (execution.status) {
      case 'created': {
        const compliance = await this.databaseService.query(
          `SELECT 1 FROM compliance_checks WHERE execution_id = $1 LIMIT 1`,
          [execution.id],
        );
        if (compliance.rowCount === 0) {
          await this.complianceProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued compliance for ${execution.id}`);
          return;
        }
        await this.riskProducer.enqueue(payload);
        this.logger.warn(`Re-enqueued risk for ${execution.id}`);
        return;
      }
      case 'validated': {
        const risk = await this.databaseService.query(
          `SELECT 1 FROM risk_scores WHERE execution_id = $1 LIMIT 1`,
          [execution.id],
        );
        if (risk.rowCount === 0) {
          await this.riskProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued risk for ${execution.id}`);
          return;
        }
        await this.policyProducer.enqueue(payload);
        this.logger.warn(`Re-enqueued policy for ${execution.id}`);
        return;
      }
      case 'approved': {
        await this.policyProducer.enqueue(payload);
        this.logger.warn(`Re-enqueued policy for ${execution.id}`);
        return;
      }
      case 'settlement_submitted': {
        const settlement = await this.databaseService.query<{
          id: string;
        }>(
          `SELECT id FROM settlements
           WHERE execution_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [execution.id],
        );
        const settlementId = settlement.rows[0]?.id;
        if (!settlementId) {
          await this.policyProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued policy for settlement-less ${execution.id}`);
          return;
        }
        await this.settlementProducer.enqueue({
          ...payload,
          settlementId,
          idempotencyKey: `auto-settle-${execution.id}`,
        });
        this.logger.warn(`Re-enqueued settlement for ${execution.id}`);
        return;
      }
      default:
        return;
    }
  }
}
