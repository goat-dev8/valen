import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { formatBaseUnitsForDisplay } from '../../common/utils/amount.util';

export type PublicProofIdentity = {
  status: string;
  registryAddress: string | null;
  resolverAddress: string | null;
  tokenId: string | null;
  chainId: number;
  ownerAddress: string | null;
  metadataHash: string | null;
  publicSlug: string | null;
};

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
  identity?: PublicProofIdentity | null;
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
    return this.enrich(await this.toExecutionProof(row));
  }

  async getRefusalProof(id: string): Promise<PublicProof> {
    try {
      const row = await this.fetchOne(
        `SELECT * FROM public_refusals_v WHERE id = $1`,
        id,
        'Refusal proof not found',
      );
      return this.enrich(await this.toRefusalProof(row));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      const payment = await this.db.query(
        `SELECT * FROM public_payments_v WHERE id = $1 AND status = 'refused'`,
        [id],
      );
      if (!payment.rows[0]) {
        throw new NotFoundException({ code: ErrorCodes.NOT_FOUND, message: 'Refusal proof not found' });
      }
      return this.enrich(this.toPaymentProof(payment.rows[0]));
    }
  }

  async getPaymentProof(id: string): Promise<PublicProof> {
    const row = await this.fetchOne(
      `SELECT * FROM public_payments_v WHERE id = $1`,
      id,
      'Payment proof not found',
    );
    return this.enrich(this.toPaymentProof(row));
  }

  async getProofPack(): Promise<{ proofVersion: '1.0'; executions: PublicProof[]; refusals: PublicProof[]; payments: PublicProof[] }> {
    const [executions, refusals, payments] = await Promise.all([
      this.db.query(`SELECT * FROM public_executions_v ORDER BY published_at DESC LIMIT 1`),
      this.db.query(`SELECT * FROM public_refusals_v ORDER BY published_at DESC LIMIT 1`),
      this.db.query(`SELECT * FROM public_payments_v ORDER BY published_at DESC LIMIT 1`),
    ]);
    return {
      proofVersion: '1.0',
      executions: await Promise.all(executions.rows.map((row) => this.enrich(this.toExecutionProof(row)))),
      refusals: await Promise.all(refusals.rows.map((row) => this.enrich(this.toRefusalProof(row)))),
      payments: await Promise.all(payments.rows.map((row) => this.enrich(this.toPaymentProof(row)))),
    };
  }

  private async fetchOne(sql: string, id: string, message: string): Promise<QueryResultRow> {
    const result = await this.db.query(sql, [id]);
    if (!result.rows[0]) {
      throw new NotFoundException({ code: ErrorCodes.NOT_FOUND, message });
    }
    return result.rows[0];
  }

  private async enrich(proof: PublicProof): Promise<PublicProof> {
    if (!proof.agentId) return { ...proof, identity: null };
    const identity = await this.loadIdentity(proof.agentId);
    return { ...proof, identity };
  }

  private async loadIdentity(agentId: string): Promise<PublicProofIdentity | null> {
    const result = await this.db.query<
      QueryResultRow & {
        status: string;
        registry_address: string | null;
        resolver_address: string | null;
        token_id: string | null;
        chain_id: number;
        owner_address: string | null;
        metadata_hash: string | null;
        public_slug: string | null;
      }
    >(
      `SELECT ai.*, a.public_slug
       FROM agent_identity ai
       JOIN agents a ON a.id = ai.agent_id
       WHERE ai.agent_id = $1
       LIMIT 1`,
      [agentId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      status: row.status,
      registryAddress: row.registry_address,
      resolverAddress: row.resolver_address,
      tokenId: row.token_id,
      chainId: row.chain_id,
      ownerAddress: row.owner_address,
      metadataHash: row.metadata_hash,
      publicSlug: row.public_slug,
    };
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
      amount: formatBaseUnitsForDisplay(row.value_amount?.toString?.() ?? row.value_amount, row.asset_address),
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
      amount: formatBaseUnitsForDisplay(row.value_amount?.toString?.() ?? row.value_amount, row.asset_address),
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
      amount: formatBaseUnitsForDisplay(row.amount?.toString?.() ?? row.amount, row.asset_address),
      status: row.status,
      settlementTx: row.settlement_tx,
      evidenceHash: row.evidence_hash,
      refusalFactors:
        row.status === 'refused'
          ? {
              source: 'x402',
              refusalReason: row.refusal_reason,
            }
          : null,
      agentId: row.agent_id,
    };
  }
}
