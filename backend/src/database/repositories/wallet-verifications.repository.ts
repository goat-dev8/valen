import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface WalletVerificationRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  chain_id: number;
  wallet_address: string;
  status: string;
  challenge_nonce: string;
  challenge_message: string;
  challenge_expires_at: Date;
  signature: string | null;
  verified_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class WalletVerificationsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async upsertChallenge(input: {
    organizationId: string;
    userId: string;
    chainId: number;
    walletAddress: string;
    nonce: string;
    message: string;
    expiresAt: Date;
  }): Promise<WalletVerificationRow> {
    const row = await this.queryOne<WalletVerificationRow>(
      `INSERT INTO wallet_verifications (
         organization_id,
         user_id,
         chain_id,
         wallet_address,
         status,
         challenge_nonce,
         challenge_message,
         challenge_expires_at
       )
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
       ON CONFLICT (organization_id, chain_id, wallet_address)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         status = 'pending',
         challenge_nonce = EXCLUDED.challenge_nonce,
         challenge_message = EXCLUDED.challenge_message,
         challenge_expires_at = EXCLUDED.challenge_expires_at,
         signature = NULL,
         verified_at = NULL,
         revoked_at = NULL,
         updated_at = now()
       RETURNING *`,
      [
        input.organizationId,
        input.userId,
        input.chainId,
        input.walletAddress,
        input.nonce,
        input.message,
        input.expiresAt,
      ],
    );
    if (!row) throw new Error('Failed to create wallet verification challenge');
    return row;
  }

  async findByWallet(input: {
    organizationId: string;
    chainId: number;
    walletAddress: string;
  }): Promise<WalletVerificationRow | null> {
    return this.queryOne<WalletVerificationRow>(
      `SELECT * FROM wallet_verifications
       WHERE organization_id = $1 AND chain_id = $2 AND wallet_address = $3`,
      [input.organizationId, input.chainId, input.walletAddress],
    );
  }

  async markVerified(input: {
    organizationId: string;
    chainId: number;
    walletAddress: string;
    userId: string;
    signature: string;
  }): Promise<WalletVerificationRow> {
    const row = await this.queryOne<WalletVerificationRow>(
      `UPDATE wallet_verifications
       SET status = 'verified',
           user_id = $4,
           signature = $5,
           verified_at = now(),
           revoked_at = NULL,
           updated_at = now()
       WHERE organization_id = $1 AND chain_id = $2 AND wallet_address = $3
       RETURNING *`,
      [input.organizationId, input.chainId, input.walletAddress, input.userId, input.signature],
    );
    if (!row) throw new Error('Failed to verify wallet');
    return row;
  }

  async listByOrganization(organizationId: string): Promise<WalletVerificationRow[]> {
    return this.queryMany<WalletVerificationRow>(
      `SELECT * FROM wallet_verifications
       WHERE organization_id = $1
       ORDER BY verified_at DESC NULLS LAST, created_at DESC`,
      [organizationId],
    );
  }
}
