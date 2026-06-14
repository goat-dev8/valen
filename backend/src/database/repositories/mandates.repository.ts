import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface MandateRow {
  id: string;
  organization_id: string;
  agent_id: string;
  principal_user_id: string | null;
  policy_id: string | null;
  chain_id: number;
  onchain_mandate_id: string | null;
  scope_hash: string;
  status: string;
  valid_from: Date;
  valid_until: Date;
  max_per_transaction: string | null;
  max_total: string | null;
  used_total: string;
  signer_address: string | null;
  signature: string | null;
  typed_data_hash: string | null;
  typed_data: Record<string, unknown> | null;
  allowed_chains: number[];
  allowed_actions: string[];
  allowed_assets: string[];
  allowed_targets: string[];
  approval_threshold: string | null;
  scope_snapshot: Record<string, unknown> | null;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class MandatesRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async createSigned(input: {
    organizationId: string;
    agentId: string;
    userId: string;
    policyId?: string;
    chainId: number;
    scopeHash: string;
    validFrom: Date;
    validUntil: Date;
    maxPerTransaction?: string;
    maxTotal?: string;
    signerAddress: string;
    signature: string;
    typedDataHash: string;
    typedData: Record<string, unknown>;
    allowedChains: number[];
    allowedActions: string[];
    allowedAssets: string[];
    allowedTargets: string[];
    approvalThreshold?: string;
    scopeSnapshot: Record<string, unknown>;
  }): Promise<MandateRow> {
    const row = await this.queryOne<MandateRow>(
      `INSERT INTO mandates (
         organization_id,
         agent_id,
         principal_user_id,
         policy_id,
         chain_id,
         scope_hash,
         status,
         valid_from,
         valid_until,
         max_per_transaction,
         max_total,
         signer_address,
         signature,
         typed_data_hash,
         typed_data,
         allowed_chains,
         allowed_actions,
         allowed_assets,
         allowed_targets,
         approval_threshold,
         scope_snapshot,
         created_by_user_id
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,'active',$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,$18,$19,$20,$21
       )
       RETURNING *`,
      [
        input.organizationId,
        input.agentId,
        input.userId,
        input.policyId ?? null,
        input.chainId,
        input.scopeHash,
        input.validFrom,
        input.validUntil,
        input.maxPerTransaction ?? null,
        input.maxTotal ?? null,
        input.signerAddress,
        input.signature,
        input.typedDataHash,
        JSON.stringify(input.typedData),
        input.allowedChains,
        input.allowedActions,
        input.allowedAssets,
        input.allowedTargets,
        input.approvalThreshold ?? null,
        JSON.stringify(input.scopeSnapshot),
        input.userId,
      ],
    );
    if (!row) throw new Error('Failed to create mandate');
    return row;
  }

  async listByOrganization(organizationId: string): Promise<MandateRow[]> {
    return this.queryMany<MandateRow>(
      `SELECT * FROM mandates WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
  }

  async findByOrgAndId(organizationId: string, mandateId: string): Promise<MandateRow | null> {
    return this.queryOne<MandateRow>(
      `SELECT * FROM mandates WHERE organization_id = $1 AND id = $2`,
      [organizationId, mandateId],
    );
  }

  async revoke(organizationId: string, mandateId: string): Promise<MandateRow | null> {
    return this.queryOne<MandateRow>(
      `UPDATE mandates
       SET status = 'revoked', revoked_at = now(), updated_at = now()
       WHERE organization_id = $1 AND id = $2 AND status <> 'revoked'
       RETURNING *`,
      [organizationId, mandateId],
    );
  }

  async updateScopeSnapshot(mandateId: string, snapshot: Record<string, unknown>): Promise<void> {
    await this.queryOne(
      `UPDATE mandates SET scope_snapshot = $2::jsonb, updated_at = now() WHERE id = $1 RETURNING id`,
      [mandateId, JSON.stringify(snapshot)],
    );
  }

  async markStaleForAgent(organizationId: string, agentId: string): Promise<number> {
    const rows = await this.queryMany<{ id: string }>(
      `UPDATE mandates
       SET status = 'stale', updated_at = now()
       WHERE organization_id = $1 AND agent_id = $2 AND status = 'active'
       RETURNING id`,
      [organizationId, agentId],
    );
    return rows.length;
  }
}
