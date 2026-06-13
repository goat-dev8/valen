import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { ExecutionsRepository, ExecutionRow } from '../../database/repositories/executions.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';

type BudgetRow = QueryResultRow & {
  id: string;
  organization_id: string;
  agent_id: string;
  chain_id: number;
  asset_address: string;
  asset_symbol: string;
  period: string;
  period_started_at: Date;
  cap: string;
  spent: string;
  remaining: string;
  evidence_hash: string;
  status: string;
  resets_at: Date;
  updated_at: Date;
};

type BudgetEventRow = QueryResultRow & {
  id: string;
  kind: string;
  amount: string;
  before_spent: string;
  after_spent: string;
  remaining: string;
  evidence_hash: string;
  metadata: Record<string, unknown>;
  created_at: Date;
};

export type BudgetEvaluation = {
  allow: boolean;
  reasonCode: 'budget_ok' | 'budget_missing' | 'budget_exceeded' | 'budget_paused';
  evidenceHash: string;
  budget?: BudgetRow;
  beforeSpent: bigint;
  afterSpent: bigint;
  remaining: bigint;
  amount: bigint;
};

@Injectable()
export class BudgetService {
  constructor(
    private readonly db: DatabaseService,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async getBudget(agentId: string): Promise<BudgetRow | null> {
    const result = await this.db.query<BudgetRow>(
      `SELECT *, GREATEST(cap - spent, 0)::text AS remaining
       FROM agent_budgets
       WHERE agent_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [agentId],
    );
    return result.rows[0] ?? null;
  }

  async getEvents(agentId: string): Promise<BudgetEventRow[]> {
    const result = await this.db.query<BudgetEventRow>(
      `SELECT * FROM budget_events WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [agentId],
    );
    return result.rows;
  }

  async topUp(input: {
    organizationId: string;
    agentId: string;
    chainId: number;
    assetAddress: string;
    assetSymbol: string;
    cap: string;
  }): Promise<BudgetRow> {
    const cap = BigInt(input.cap);
    if (cap <= 0n) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Budget cap must be positive base units',
      });
    }
    const now = new Date();
    const resetsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const evidenceHash = hashPayload({
      agentId: input.agentId,
      chainId: input.chainId,
      assetAddress: input.assetAddress,
      cap: input.cap,
      resetsAt: resetsAt.toISOString(),
    });

    const result = await this.db.query<BudgetRow>(
      `INSERT INTO agent_budgets (
         organization_id, agent_id, chain_id, asset_address, asset_symbol,
         cap, spent, evidence_hash, resets_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8)
       ON CONFLICT (agent_id, chain_id, asset_address) DO UPDATE SET
         cap = EXCLUDED.cap,
         spent = 0,
         status = 'active',
         evidence_hash = EXCLUDED.evidence_hash,
         period_started_at = now(),
         resets_at = EXCLUDED.resets_at,
         updated_at = now()
       RETURNING *, GREATEST(cap - spent, 0)::text AS remaining`,
      [
        input.organizationId,
        input.agentId,
        input.chainId,
        input.assetAddress,
        input.assetSymbol,
        input.cap,
        evidenceHash,
        resetsAt,
      ],
    );
    const budget = result.rows[0];
    if (!budget) throw new Error('Failed to top up budget');
    await this.recordEvent({
      budget,
      executionId: null,
      kind: 'topup',
      amount: cap,
      beforeSpent: 0n,
      afterSpent: 0n,
      remaining: cap,
      evidenceHash,
      metadata: { source: 'budget.topup' },
    });
    return budget;
  }

  async evaluateExecution(execution: ExecutionRow): Promise<BudgetEvaluation> {
    const budget = await this.findBudgetForExecution(execution);
    const amount = BigInt(execution.value_amount ?? '0');
    if (!budget) {
      const evidenceHash = hashPayload({ executionId: execution.id, reasonCode: 'budget_missing' });
      return {
        allow: false,
        reasonCode: 'budget_missing',
        evidenceHash,
        beforeSpent: 0n,
        afterSpent: amount,
        remaining: 0n,
        amount,
      };
    }

    const beforeSpent = BigInt(budget.spent);
    const cap = BigInt(budget.cap);
    const afterSpent = beforeSpent + amount;
    const remaining = cap > afterSpent ? cap - afterSpent : 0n;
    const reasonCode =
      budget.status !== 'active'
        ? 'budget_paused'
        : afterSpent > cap
          ? 'budget_exceeded'
          : 'budget_ok';
    const evidenceHash = hashPayload({
      executionId: execution.id,
      budgetId: budget.id,
      cap: budget.cap,
      beforeSpent: beforeSpent.toString(),
      amount: amount.toString(),
      afterSpent: afterSpent.toString(),
      reasonCode,
    });

    await this.recordEvent({
      budget,
      executionId: execution.id,
      kind: reasonCode === 'budget_ok' ? 'pass' : 'refusal',
      amount,
      beforeSpent,
      afterSpent,
      remaining,
      evidenceHash,
      metadata: { reasonCode },
    });

    if (reasonCode !== 'budget_ok') {
      await this.auditLogsRepository.append({
        organizationId: execution.organization_id,
        actorType: 'system',
        actorId: 'budget-engine',
        action: 'budget.refused',
        entityType: 'execution',
        entityId: execution.id,
        eventHash: evidenceHash,
        chainId: execution.target_chain_id,
      });
    }

    return {
      allow: reasonCode === 'budget_ok',
      reasonCode,
      evidenceHash,
      budget,
      beforeSpent,
      afterSpent,
      remaining,
      amount,
    };
  }

  async commitSpend(executionId: string): Promise<void> {
    const execution = await this.executionsRepository.findById(executionId);
    if (!execution) return;
    const budget = await this.findBudgetForExecution(execution);
    if (!budget) return;
    const amount = BigInt(execution.value_amount ?? '0');
    const beforeSpent = BigInt(budget.spent);
    const afterSpent = beforeSpent + amount;
    const cap = BigInt(budget.cap);
    const remaining = cap > afterSpent ? cap - afterSpent : 0n;
    const evidenceHash = hashPayload({ executionId, budgetId: budget.id, kind: 'spend_commit', afterSpent: afterSpent.toString() });

    await this.db.query(
      `UPDATE agent_budgets
       SET spent = $1,
           status = CASE WHEN $1::numeric >= cap THEN 'exhausted' ELSE status END,
           evidence_hash = $2,
           updated_at = now()
       WHERE id = $3`,
      [afterSpent.toString(), evidenceHash, budget.id],
    );
    await this.recordEvent({
      budget,
      executionId,
      kind: 'spend_commit',
      amount,
      beforeSpent,
      afterSpent,
      remaining,
      evidenceHash,
      metadata: { source: 'settlement.executed' },
    });
  }

  private async findBudgetForExecution(execution: ExecutionRow): Promise<BudgetRow | null> {
    const result = await this.db.query<BudgetRow>(
      `SELECT *, GREATEST(cap - spent, 0)::text AS remaining
       FROM agent_budgets
       WHERE agent_id = $1
         AND chain_id = $2
         AND lower(asset_address) = lower($3)
         AND status IN ('active', 'paused', 'exhausted')
       ORDER BY updated_at DESC
       LIMIT 1`,
      [execution.agent_id, execution.target_chain_id, execution.asset_address ?? 'native'],
    );
    return result.rows[0] ?? null;
  }

  private async recordEvent(input: {
    budget: BudgetRow;
    executionId: string | null;
    kind: 'topup' | 'pass' | 'refusal' | 'spend_commit';
    amount: bigint;
    beforeSpent: bigint;
    afterSpent: bigint;
    remaining: bigint;
    evidenceHash: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO budget_events (
         organization_id, agent_id, execution_id, budget_id, kind, amount,
         before_spent, after_spent, remaining, evidence_hash, metadata
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,
      [
        input.budget.organization_id,
        input.budget.agent_id,
        input.executionId,
        input.budget.id,
        input.kind,
        input.amount.toString(),
        input.beforeSpent.toString(),
        input.afterSpent.toString(),
        input.remaining.toString(),
        input.evidenceHash,
        JSON.stringify(input.metadata),
      ],
    );
  }
}
