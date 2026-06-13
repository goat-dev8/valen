import { Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';

type SummaryRow = QueryResultRow & {
  organization_id: string;
  organization_name: string;
  default_chain_id: number | null;
  agent_id: string | null;
  agent_name: string | null;
  agent_status: string | null;
  default_policy_id: string | null;
  agent_wallet_address: string | null;
  agent_wallet_chain_id: number | null;
  policy_count: number;
  active_mandate_count: number;
  owner_wallet_verified: boolean;
  verified_wallet_count: number;
  total_executions: number;
  executed_executions: number;
  approval_required_executions: number;
  failed_or_refused_executions: number;
  last_execution_id: string | null;
  last_execution_status: string | null;
  last_execution_action_type: string | null;
  last_execution_chain_id: number | null;
  last_execution_asset_address: string | null;
  last_execution_created_at: Date | null;
  last_executed_execution_id: string | null;
  last_executed_action_type: string | null;
  last_executed_chain_id: number | null;
  last_executed_asset_address: string | null;
  last_executed_created_at: Date | null;
  last_executed_tx_hash: string | null;
  last_executed_block_number: string | null;
  last_refusal_execution_id: string | null;
  last_refusal_status: string | null;
  last_refusal_action_type: string | null;
  last_refusal_chain_id: number | null;
  last_refusal_asset_address: string | null;
  last_refusal_created_at: Date | null;
  last_robinhood_execution_id: string | null;
  last_robinhood_status: string | null;
  last_robinhood_action_type: string | null;
  last_robinhood_asset_address: string | null;
  last_robinhood_created_at: Date | null;
  last_robinhood_tx_hash: string | null;
  last_payment_id: string | null;
  last_payment_status: string | null;
  last_payment_amount: string | null;
  last_payment_created_at: Date | null;
  last_payment_settlement_tx: string | null;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function proofUrl(executionId: string | null): string | null {
  return executionId ? `/dashboard/executions/${executionId}/proof` : null;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async summary(organizationId: string) {
    const cacheKey = `dashboard:summary:${organizationId}`;
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as unknown;
    }

    const row = await this.loadSummaryRow(organizationId);
    const budgetRow = row.agent_id ? await this.loadBudgetRow(row.agent_id) : null;
    const paymentRow = await this.loadLatestPayment(organizationId);
    const payload = this.toPayload(row, budgetRow, paymentRow);
    await this.redis.set(cacheKey, JSON.stringify(payload), 5).catch(() => undefined);
    return payload;
  }

  private async loadSummaryRow(organizationId: string): Promise<SummaryRow> {
    try {
      const result = await this.db.query<SummaryRow>(
        `SELECT * FROM agent_summary_v WHERE organization_id = $1 LIMIT 1`,
        [organizationId],
      );
      if (result.rows[0]) return result.rows[0];
    } catch {
      // The Phase B migration may not be applied in local dev yet. Keep the endpoint usable.
    }

    const result = await this.db.query<SummaryRow>(
      `
      WITH primary_agent AS (
        SELECT *
        FROM agents
        WHERE organization_id = $1
        ORDER BY (status = 'active') DESC, created_at DESC
        LIMIT 1
      ),
      primary_wallet AS (
        SELECT *
        FROM agent_wallets
        WHERE organization_id = $1
          AND agent_id = (SELECT id FROM primary_agent)
          AND status = 'active'
        ORDER BY is_primary DESC, created_at DESC
        LIMIT 1
      ),
      latest_execution AS (
        SELECT *
        FROM executions
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      ),
      latest_executed AS (
        SELECT e.*, s.tx_hash, s.block_number
        FROM executions e
        LEFT JOIN settlements s ON s.execution_id = e.id
        WHERE e.organization_id = $1 AND e.status = 'executed'
        ORDER BY e.created_at DESC
        LIMIT 1
      ),
      latest_refusal_like AS (
        SELECT *
        FROM executions
        WHERE organization_id = $1
          AND status IN ('compliance_failed', 'risk_failed', 'policy_rejected', 'failed', 'cancelled')
        ORDER BY created_at DESC
        LIMIT 1
      ),
      latest_robinhood AS (
        SELECT e.*, s.tx_hash
        FROM executions e
        LEFT JOIN settlements s ON s.execution_id = e.id
        WHERE e.organization_id = $1 AND e.target_chain_id = 46630
        ORDER BY e.created_at DESC
        LIMIT 1
      )
      SELECT
        o.id AS organization_id,
        o.name AS organization_name,
        o.default_chain_id,
        pa.id AS agent_id,
        pa.name AS agent_name,
        pa.status AS agent_status,
        pa.default_policy_id,
        pw.wallet_address AS agent_wallet_address,
        pw.chain_id AS agent_wallet_chain_id,
        (SELECT COUNT(*)::integer FROM policies WHERE organization_id = $1) AS policy_count,
        (SELECT COUNT(*)::integer FROM mandates WHERE organization_id = $1 AND status = 'active') AS active_mandate_count,
        COALESCE((SELECT BOOL_OR(status = 'verified') FROM wallet_verifications WHERE organization_id = $1), false) AS owner_wallet_verified,
        (SELECT COUNT(*)::integer FROM wallet_verifications WHERE organization_id = $1 AND status = 'verified') AS verified_wallet_count,
        (SELECT COUNT(*)::integer FROM executions WHERE organization_id = $1) AS total_executions,
        (SELECT COUNT(*)::integer FROM executions WHERE organization_id = $1 AND status = 'executed') AS executed_executions,
        (SELECT COUNT(*)::integer FROM executions WHERE organization_id = $1 AND status = 'approval_required') AS approval_required_executions,
        (SELECT COUNT(*)::integer FROM executions WHERE organization_id = $1 AND status IN ('failed', 'cancelled', 'compliance_failed', 'risk_failed', 'policy_rejected')) AS failed_or_refused_executions,
        le.id AS last_execution_id,
        le.status AS last_execution_status,
        le.action_type AS last_execution_action_type,
        le.target_chain_id AS last_execution_chain_id,
        le.asset_address AS last_execution_asset_address,
        le.created_at AS last_execution_created_at,
        lx.id AS last_executed_execution_id,
        lx.action_type AS last_executed_action_type,
        lx.target_chain_id AS last_executed_chain_id,
        lx.asset_address AS last_executed_asset_address,
        lx.created_at AS last_executed_created_at,
        lx.tx_hash AS last_executed_tx_hash,
        lx.block_number AS last_executed_block_number,
        lr.id AS last_refusal_execution_id,
        lr.status AS last_refusal_status,
        lr.action_type AS last_refusal_action_type,
        lr.target_chain_id AS last_refusal_chain_id,
        lr.asset_address AS last_refusal_asset_address,
        lr.created_at AS last_refusal_created_at,
        rh.id AS last_robinhood_execution_id,
        rh.status AS last_robinhood_status,
        rh.action_type AS last_robinhood_action_type,
        rh.asset_address AS last_robinhood_asset_address,
        rh.created_at AS last_robinhood_created_at,
        rh.tx_hash AS last_robinhood_tx_hash
      FROM organizations o
      LEFT JOIN primary_agent pa ON true
      LEFT JOIN primary_wallet pw ON true
      LEFT JOIN latest_execution le ON true
      LEFT JOIN latest_executed lx ON true
      LEFT JOIN latest_refusal_like lr ON true
      LEFT JOIN latest_robinhood rh ON true
      WHERE o.id = $1
      `,
      [organizationId],
    );

    return result.rows[0];
  }

  private async loadBudgetRow(agentId: string) {
    try {
      const result = await this.db.query<QueryResultRow>(
        `SELECT * FROM agent_budget_status_v WHERE agent_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [agentId],
      );
      return result.rows[0] ?? null;
    } catch {
      return null;
    }
  }

  private async loadLatestPayment(organizationId: string) {
    try {
      const result = await this.db.query<QueryResultRow>(
        `SELECT id, status, amount, settlement_tx, created_at
         FROM x402_payments
         WHERE organization_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [organizationId],
      );
      return result.rows[0] ?? null;
    } catch {
      return null;
    }
  }

  private toPayload(row: SummaryRow, budgetRow: QueryResultRow | null, paymentRow: QueryResultRow | null) {
    const readiness = {
      walletConnected: row.verified_wallet_count > 0,
      agentActive: row.agent_status === 'active',
      rulesActive: row.policy_count > 0,
      walletVerified: row.owner_wallet_verified,
      mandateSigned: row.active_mandate_count > 0,
      usdcBudgetFunded: Boolean(budgetRow && budgetRow.status === 'active' && Number(budgetRow.cap) > 0),
      firstExecutionComplete: row.executed_executions > 0,
      proofAvailable: Boolean(row.last_executed_execution_id),
    };
    const completed = Object.values(readiness).filter(Boolean).length;

    return {
      organization: {
        id: row.organization_id,
        name: row.organization_name,
        defaultChainId: row.default_chain_id,
      },
      agent: row.agent_id
        ? {
            id: row.agent_id,
            name: row.agent_name,
            status: row.agent_status,
            defaultPolicyId: row.default_policy_id,
            walletAddress: row.agent_wallet_address,
            walletChainId: row.agent_wallet_chain_id,
          }
        : null,
      readiness: {
        ...readiness,
        completed,
        total: Object.keys(readiness).length,
        percent: Math.round((completed / Object.keys(readiness).length) * 100),
      },
      budget: budgetRow
        ? {
            assetSymbol: budgetRow.asset_symbol ?? 'USDC',
            status: budgetRow.status ?? 'active',
            cap: budgetRow.cap?.toString?.() ?? budgetRow.cap,
            spent: budgetRow.spent?.toString?.() ?? budgetRow.spent,
            remaining: budgetRow.remaining?.toString?.() ?? budgetRow.remaining,
            evidenceHash: budgetRow.evidence_hash ?? null,
            resetsAt: toIso(budgetRow.resets_at),
          }
        : {
            assetSymbol: 'USDC',
            status: 'not_configured',
            remaining: null,
            note: 'Configure a USDC budget via Treasury or the budget top-up API.',
          },
      counts: {
        policies: row.policy_count,
        activeMandates: row.active_mandate_count,
        totalExecutions: row.total_executions,
        executedExecutions: row.executed_executions,
        pendingApprovals: row.approval_required_executions,
        failedOrRefusedExecutions: row.failed_or_refused_executions,
      },
      latest: {
        execution: row.last_execution_id
          ? {
              id: row.last_execution_id,
              status: row.last_execution_status,
              actionType: row.last_execution_action_type,
              chainId: row.last_execution_chain_id,
              asset: row.last_execution_asset_address,
              createdAt: toIso(row.last_execution_created_at),
              href: `/dashboard/executions/${row.last_execution_id}`,
            }
          : null,
        proof: row.last_executed_execution_id
          ? {
              executionId: row.last_executed_execution_id,
              actionType: row.last_executed_action_type,
              chainId: row.last_executed_chain_id,
              asset: row.last_executed_asset_address,
              txHash: row.last_executed_tx_hash,
              blockNumber: row.last_executed_block_number,
              createdAt: toIso(row.last_executed_created_at),
              href: `/proofs/executions/${row.last_executed_execution_id}`,
              dashboardHref: proofUrl(row.last_executed_execution_id),
            }
          : null,
        refusal: row.last_refusal_execution_id
          ? {
              executionId: row.last_refusal_execution_id,
              status: row.last_refusal_status,
              actionType: row.last_refusal_action_type,
              chainId: row.last_refusal_chain_id,
              asset: row.last_refusal_asset_address,
              createdAt: toIso(row.last_refusal_created_at),
              href: `/proofs/refusals/${row.last_refusal_execution_id}`,
              dashboardHref: `/dashboard/executions/${row.last_refusal_execution_id}`,
            }
          : null,
        robinhood: row.last_robinhood_execution_id
          ? {
              executionId: row.last_robinhood_execution_id,
              status: row.last_robinhood_status,
              actionType: row.last_robinhood_action_type,
              asset: row.last_robinhood_asset_address,
              txHash: row.last_robinhood_tx_hash,
              createdAt: toIso(row.last_robinhood_created_at),
              href: proofUrl(row.last_robinhood_execution_id),
              dashboardHref: proofUrl(row.last_robinhood_execution_id),
            }
          : null,
        payment: paymentRow
          ? {
              paymentId: paymentRow.id,
              status: paymentRow.status,
              amount: paymentRow.amount?.toString?.() ?? paymentRow.amount,
              settlementTx: paymentRow.settlement_tx,
              createdAt: toIso(paymentRow.created_at),
              href: `/proofs/payments/${paymentRow.id}`,
            }
          : null,
      },
    };
  }
}
