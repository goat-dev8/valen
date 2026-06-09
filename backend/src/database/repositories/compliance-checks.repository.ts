import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface ComplianceCheckRow {
  id: string;
  organization_id: string;
  execution_id: string;
  status: string;
  reason_code: string;
  provider: string;
  provider_ref: string | null;
  subject_type: string;
  subject_ref: string;
  attestation_hash: string | null;
  result_hash: string | null;
  expires_at: Date | null;
  checked_at: Date | null;
  created_at: Date;
}

export interface ComplianceAttestationRow {
  id: string;
  organization_id: string;
  provider: string;
  subject_type: string;
  subject_ref: string;
  attestation_hash: string;
  reason_code: string;
  status: string;
  expires_at: Date;
  issued_at: Date;
  created_at: Date;
}

@Injectable()
export class ComplianceChecksRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async listByExecution(executionId: string): Promise<ComplianceCheckRow[]> {
    return this.queryMany<ComplianceCheckRow>(
      `SELECT * FROM compliance_checks WHERE execution_id = $1 ORDER BY created_at DESC`,
      [executionId],
    );
  }

  async createCheck(input: {
    organizationId: string;
    executionId: string;
    reasonCode: string;
    provider: string;
    subjectType: string;
    subjectRef: string;
    status?: string;
    attestationHash?: string;
    resultHash?: string;
    expiresAt?: Date;
    checkedAt?: Date;
  }): Promise<ComplianceCheckRow> {
    const row = await this.queryOne<ComplianceCheckRow>(
      `INSERT INTO compliance_checks (
         organization_id, execution_id, reason_code, provider, subject_type,
         subject_ref, status, attestation_hash, result_hash, expires_at, checked_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.organizationId,
        input.executionId,
        input.reasonCode,
        input.provider,
        input.subjectType,
        input.subjectRef,
        input.status ?? 'pending',
        input.attestationHash ?? null,
        input.resultHash ?? null,
        input.expiresAt ?? null,
        input.checkedAt ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create compliance check');
    return row;
  }

  async createAttestation(input: {
    organizationId: string;
    provider: string;
    subjectType: string;
    subjectRef: string;
    attestationHash: string;
    reasonCode: string;
    expiresAt: Date;
  }): Promise<ComplianceAttestationRow> {
    const row = await this.queryOne<ComplianceAttestationRow>(
      `INSERT INTO compliance_attestations (
         organization_id, provider, subject_type, subject_ref,
         attestation_hash, reason_code, expires_at, issued_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, now()) RETURNING *`,
      [
        input.organizationId,
        input.provider,
        input.subjectType,
        input.subjectRef,
        input.attestationHash,
        input.reasonCode,
        input.expiresAt,
      ],
    );
    if (!row) throw new Error('Failed to create attestation');
    return row;
  }

  async findAttestationsBySubject(
    organizationId: string,
    subjectRef: string,
  ): Promise<ComplianceAttestationRow[]> {
    return this.queryMany<ComplianceAttestationRow>(
      `SELECT * FROM compliance_attestations
       WHERE organization_id = $1 AND subject_ref = $2
       ORDER BY issued_at DESC`,
      [organizationId, subjectRef],
    );
  }
}
