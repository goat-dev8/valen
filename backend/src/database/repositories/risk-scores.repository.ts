import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface RiskScoreRow {
  id: string;
  organization_id: string;
  execution_id: string;
  risk_model_id: string | null;
  score: number;
  tier: string;
  factor_summary: Record<string, unknown>;
  score_hash: string;
  requires_approval: boolean;
  calculated_at: Date;
  created_at: Date;
}

export interface RiskModelRow {
  id: string;
  organization_id: string | null;
  name: string;
  version: string;
  model_hash: string;
  status: string;
  created_at: Date;
}

@Injectable()
export class RiskScoresRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findLatestByExecution(executionId: string): Promise<RiskScoreRow | null> {
    return this.queryOne<RiskScoreRow>(
      `SELECT * FROM risk_scores WHERE execution_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
      [executionId],
    );
  }

  async create(input: {
    organizationId: string;
    executionId: string;
    riskModelId?: string;
    score: number;
    tier: string;
    factorSummary: Record<string, unknown>;
    scoreHash: string;
    requiresApproval: boolean;
  }): Promise<RiskScoreRow> {
    const row = await this.queryOne<RiskScoreRow>(
      `INSERT INTO risk_scores (
         organization_id, execution_id, risk_model_id, score, tier,
         factor_summary, score_hash, requires_approval, calculated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now()) RETURNING *`,
      [
        input.organizationId,
        input.executionId,
        input.riskModelId ?? null,
        input.score,
        input.tier,
        JSON.stringify(input.factorSummary),
        input.scoreHash,
        input.requiresApproval,
      ],
    );
    if (!row) throw new Error('Failed to create risk score');
    return row;
  }

  async listModels(organizationId: string): Promise<RiskModelRow[]> {
    return this.queryMany<RiskModelRow>(
      `SELECT * FROM risk_models
       WHERE organization_id IS NULL OR organization_id = $1
       ORDER BY created_at DESC`,
      [organizationId],
    );
  }
}
