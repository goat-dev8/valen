import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';

export type PublicProof = {
  proofVersion: '1.0';
  id: string;
  kind: 'execution' | 'refusal' | 'payment';
  chainId: number;
  publishedAt: string;
  action?: string;
  asset?: string | null;
  amount?: string | null;
  status: string;
  mandateSigner?: string | null;
  mandateHash?: string | null;
  settlementTx?: string | null;
  evidenceHash?: string | null;
  refusalFactors?: Record<string, unknown> | null;
  agentId?: string;
};

@Injectable()
export class ProofsService {
  constructor(private readonly db: DatabaseService) {}

  async getExecutionProof(id: string): Promise<PublicProof> {
    const row = await this.fetchOne(
      `SELECT * FROM public_executions_v WHERE id = $1`,
      id,
      'Execution proof not found',
    );
    return this.toExecutionProof(row);
  }

  async getRefusalProof(id: string): Promise<PublicProof> {
    const row = await this.fetchOne(
      `SELECT * FROM public_refusals_v WHERE id = $1`,
      id,
      'Refusal proof not found',
    );
    return this.toRefusalProof(row);
  }

  async getPaymentProof(id: string): Promise<PublicProof> {
    const row = await this.fetchOne(
      `SELECT * FROM public_payments_v WHERE id = $1`,
      id,
      'Payment proof not found',
    );
    return this.toPaymentProof(row);
  }

  async getProofPack(): Promise<{ proofVersion: '1.0'; executions: PublicProof[]; refusals: PublicProof[]; payments: PublicProof[] }> {
    const [executions, refusals, payments] = await Promise.all([
      this.db.query(`SELECT * FROM public_executions_v ORDER BY published_at DESC LIMIT 1`),
      this.db.query(`SELECT * FROM public_refusals_v ORDER BY published_at DESC LIMIT 1`),
      this.db.query(`SELECT * FROM public_payments_v ORDER BY published_at DESC LIMIT 1`),
    ]);
    return {
      proofVersion: '1.0',
      executions: executions.rows.map((row) => this.toExecutionProof(row)),
      refusals: refusals.rows.map((row) => this.toRefusalProof(row)),
      payments: payments.rows.map((row) => this.toPaymentProof(row)),
    };
  }

  private async fetchOne(sql: string, id: string, message: string): Promise<QueryResultRow> {
    const result = await this.db.query(sql, [id]);
    if (!result.rows[0]) {
      throw new NotFoundException({ code: ErrorCodes.NOT_FOUND, message });
    }
    return result.rows[0];
  }

  private toExecutionProof(row: QueryResultRow): PublicProof {
    return {
      proofVersion: '1.0',
      id: row.id,
      kind: 'execution',
      chainId: row.chain_id,
      publishedAt: new Date(row.published_at).toISOString(),
      action: row.action_type,
      asset: row.asset_address,
      amount: row.value_amount?.toString?.() ?? row.value_amount,
      status: row.status,
      mandateSigner: row.mandate_signer,
      mandateHash: row.mandate_hash,
      settlementTx: row.settlement_tx,
      evidenceHash: row.payload_hash,
      agentId: row.agent_id,
    };
  }

  private toRefusalProof(row: QueryResultRow): PublicProof {
    return {
      proofVersion: '1.0',
      id: row.id,
      kind: 'refusal',
      chainId: row.chain_id,
      publishedAt: new Date(row.published_at).toISOString(),
      action: row.action_type,
      asset: row.asset_address,
      amount: row.value_amount?.toString?.() ?? row.value_amount,
      status: row.status,
      mandateSigner: row.mandate_signer,
      mandateHash: row.mandate_hash,
      evidenceHash: row.evidence_hash ?? row.payload_hash ?? row.request_payload_hash,
      refusalFactors: row.refusal_factors ?? null,
      agentId: row.agent_id,
    };
  }

  private toPaymentProof(row: QueryResultRow): PublicProof {
    return {
      proofVersion: '1.0',
      id: row.id,
      kind: 'payment',
      chainId: row.chain_id,
      publishedAt: new Date(row.published_at).toISOString(),
      action: 'x402_payment',
      asset: row.asset_address,
      amount: row.amount?.toString?.() ?? row.amount,
      status: row.status,
      settlementTx: row.settlement_tx,
      evidenceHash: row.evidence_hash,
      agentId: row.agent_id,
    };
  }
}
