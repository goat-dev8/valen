import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ComplianceProducer,
  IntentProducer,
  PolicyProducer,
  RiskProducer,
  SettlementProducer,
} from './producers/index';
import { ExecutionsRepository } from '../database/repositories/executions.repository';
import { RiskScoresRepository } from '../database/repositories/risk-scores.repository';
import { SettlementsRepository } from '../database/repositories/settlements.repository';
import { ChainService } from '../modules/settlement/chain.service';

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
    private readonly complianceProducer: ComplianceProducer,
    private readonly intentProducer: IntentProducer,
    private readonly riskProducer: RiskProducer,
    private readonly policyProducer: PolicyProducer,
    private readonly settlementProducer: SettlementProducer,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly riskScoresRepository: RiskScoresRepository,
    private readonly settlementsRepository: SettlementsRepository,
    private readonly chainService: ChainService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.recoverStuckExecutions().catch((error) => {
        this.logger.error(`Pipeline recovery failed: ${(error as Error).message}`);
      });
    }, 30_000);
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
       WHERE status IN ('created', 'validated', 'approved', 'settlement_submitted', 'failed')
         AND updated_at < now() - interval '45 seconds'
         AND (
           metadata->'onchain'->>'complianceHash' IS NOT NULL
           OR status = 'created'
         )
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
        const hasOnchain = await this.databaseService.query(
          `SELECT metadata->'onchain'->>'complianceHash' AS hash FROM executions WHERE id = $1`,
          [execution.id],
        );
        if (!hasOnchain.rows[0]?.hash) {
          await this.intentProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued intent for ${execution.id}`);
          return;
        }
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
        const score = await this.riskScoresRepository.findLatestByExecution(
          execution.id,
        );
        if (!score) {
          await this.riskProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued risk for ${execution.id}`);
          return;
        }
        if (score.requires_approval) {
          await this.policyProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued approval policy for ${execution.id}`);
          return;
        }
        await this.createSettlementAndEnqueue(payload);
        this.logger.warn(`Recovered policy stage directly for ${execution.id}`);
        return;
      }
      case 'approved': {
        await this.createSettlementAndEnqueue(payload);
        this.logger.warn(`Recovered approved execution directly for ${execution.id}`);
        return;
      }
      case 'settlement_submitted': {
        await this.enqueueExistingSettlement(payload);
        return;
      }
      case 'failed': {
        const hasOnchain = await this.databaseService.query(
          `SELECT metadata->'onchain'->>'complianceHash' AS hash FROM executions WHERE id = $1`,
          [execution.id],
        );
        if (!hasOnchain.rows[0]?.hash) {
          await this.intentProducer.enqueue(payload);
          this.logger.warn(`Re-enqueued intent for failed execution ${execution.id}`);
          return;
        }

        const compliance = await this.databaseService.query(
          `SELECT 1 FROM compliance_checks WHERE execution_id = $1 LIMIT 1`,
          [execution.id],
        );
        if (compliance.rowCount === 0) {
          await this.executionsRepository.updateStatus(execution.id, 'created');
          await this.complianceProducer.enqueue(payload);
          this.logger.warn(`Recovered failed execution ${execution.id} at compliance`);
          return;
        }

        const score = await this.riskScoresRepository.findLatestByExecution(execution.id);
        if (!score) {
          await this.executionsRepository.updateStatus(execution.id, 'validated');
          await this.riskProducer.enqueue(payload);
          this.logger.warn(`Recovered failed execution ${execution.id} at risk`);
          return;
        }

        const settlement = await this.settlementsRepository.findByExecution(execution.id);
        if (!settlement || settlement.status !== 'confirmed') {
          await this.createSettlementAndEnqueue(payload);
          this.logger.warn(`Recovered failed execution ${execution.id} at settlement`);
        }
        return;
      }
      default:
        return;
    }
  }

  private async createSettlementAndEnqueue(payload: {
    organizationId: string;
    executionId: string;
  }): Promise<void> {
    const execution = await this.executionsRepository.findById(payload.executionId);
    if (!execution) throw new Error('Execution not found for recovery');

    const existing = await this.settlementsRepository.findByExecution(
      payload.executionId,
    );
    if (existing?.status === 'confirmed') {
      return;
    }
    const settlement =
      existing ??
      (await this.settlementsRepository.create({
        organizationId: payload.organizationId,
        executionId: payload.executionId,
        chainId: execution.target_chain_id,
        contractAddress: this.chainService.getSettlementAddress(
          execution.target_chain_id,
        ),
        targetAddress: execution.target_address ?? undefined,
      }));

    await this.executionsRepository.updateStatus(
      payload.executionId,
      'settlement_submitted',
    );
    await this.settlementProducer.enqueue({
      ...payload,
      settlementId: settlement.id,
      idempotencyKey: `auto-settle-${payload.executionId}`,
    });
  }

  private async enqueueExistingSettlement(payload: {
    organizationId: string;
    executionId: string;
  }): Promise<void> {
    const settlement = await this.settlementsRepository.findByExecution(
      payload.executionId,
    );
    if (!settlement) {
      await this.createSettlementAndEnqueue(payload);
      this.logger.warn(`Created missing settlement for ${payload.executionId}`);
      return;
    }

    if (settlement.status === 'confirmed') return;

    await this.settlementProducer.enqueue({
      ...payload,
      settlementId: settlement.id,
      idempotencyKey: `auto-settle-${payload.executionId}`,
    });
    this.logger.warn(`Re-enqueued settlement for ${payload.executionId}`);
  }
}
