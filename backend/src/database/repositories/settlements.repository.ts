import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface SettlementRow {
  id: string;
  organization_id: string;
  execution_id: string;
  chain_id: number;
  contract_address: string;
  target_address: string | null;
  status: string;
  tx_hash: string | null;
  user_operation_hash: string | null;
  block_number: string | null;
  on_chain_settlement_id: string | null;
  submit_tx_hash: string | null;
  approve_tx_hash: string | null;
  failure_reason: string | null;
  submitted_at: Date | null;
  confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SettlementsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findByExecution(executionId: string): Promise<SettlementRow | null> {
    return this.queryOne<SettlementRow>(
      `SELECT * FROM settlements
       WHERE execution_id = $1
       ORDER BY
         CASE status
           WHEN 'confirmed' THEN 0
           WHEN 'prepared' THEN 1
           WHEN 'pending' THEN 2
           ELSE 3
         END,
         created_at DESC
       LIMIT 1`,
      [executionId],
    );
  }

  async findById(id: string): Promise<SettlementRow | null> {
    return this.queryOne<SettlementRow>(
      `SELECT * FROM settlements WHERE id = $1`,
      [id],
    );
  }

  async create(input: {
    organizationId: string;
    executionId: string;
    chainId: number;
    contractAddress: string;
    targetAddress?: string;
  }): Promise<SettlementRow> {
    const row = await this.queryOne<SettlementRow>(
      `INSERT INTO settlements (organization_id, execution_id, chain_id, contract_address, target_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        input.organizationId,
        input.executionId,
        input.chainId,
        input.contractAddress,
        input.targetAddress ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create settlement');
    return row;
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: {
      txHash?: string;
      submitTxHash?: string;
      approveTxHash?: string;
      onChainSettlementId?: string;
      failureReason?: string;
      submittedAt?: Date;
      confirmedAt?: Date;
      blockNumber?: bigint;
    },
  ): Promise<SettlementRow | null> {
    const sets = [`status = $1`, `updated_at = now()`];
    const params: unknown[] = [status];
    let idx = 2;

    if (extras?.txHash) {
      sets.push(`tx_hash = $${idx++}`);
      params.push(extras.txHash);
    }
    if (extras?.submitTxHash) {
      sets.push(`submit_tx_hash = $${idx++}`);
      params.push(extras.submitTxHash);
    }
    if (extras?.approveTxHash) {
      sets.push(`approve_tx_hash = $${idx++}`);
      params.push(extras.approveTxHash);
    }
    if (extras?.onChainSettlementId) {
      sets.push(`on_chain_settlement_id = $${idx++}`);
      params.push(extras.onChainSettlementId);
    }
    if (extras?.failureReason) {
      sets.push(`failure_reason = $${idx++}`);
      params.push(extras.failureReason);
    }
    if (extras?.submittedAt) {
      sets.push(`submitted_at = $${idx++}`);
      params.push(extras.submittedAt);
    }
    if (extras?.confirmedAt) {
      sets.push(`confirmed_at = $${idx++}`);
      params.push(extras.confirmedAt);
    }
    if (extras?.blockNumber !== undefined) {
      sets.push(`block_number = $${idx++}`);
      params.push(extras.blockNumber.toString());
    }

    params.push(id);
    return this.queryOne<SettlementRow>(
      `UPDATE settlements SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
  }
}
