import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { getAddress, verifyMessage } from 'viem';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { WalletVerificationRow, WalletVerificationsRepository } from '../../database/repositories/wallet-verifications.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  WalletChallengeDto,
  WalletChallengeResponseDto,
  WalletVerificationResponseDto,
  WalletVerifyDto,
} from './dto/wallet-verification.dto';

const CHALLENGE_TTL_MS = 10 * 60 * 1000;

function normalizeWalletAddress(address: string): `0x${string}` {
  try {
    return getAddress(address.trim()) as `0x${string}`;
  } catch {
    throw new BadRequestException({
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Invalid EVM wallet address',
    });
  }
}

@Injectable()
export class WalletVerificationsService {
  constructor(
    private readonly walletVerificationsRepository: WalletVerificationsRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async createChallenge(
    organizationId: string,
    dto: WalletChallengeDto,
    user: AuthenticatedUser,
  ): Promise<WalletChallengeResponseDto> {
    await this.assertSupportedChain(dto.chainId);
    const walletAddress = normalizeWalletAddress(dto.walletAddress);
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    const message = this.buildChallengeMessage({
      organizationId,
      chainId: dto.chainId,
      walletAddress,
      nonce,
      expiresAt,
    });

    const row = await this.walletVerificationsRepository.upsertChallenge({
      organizationId,
      userId: user.id,
      chainId: dto.chainId,
      walletAddress: walletAddress.toLowerCase(),
      nonce,
      message,
      expiresAt,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'wallet.challenge.created',
      entityType: 'wallet_verification',
      entityId: row.id,
      eventHash: hashPayload({ walletAddress, chainId: dto.chainId, nonce }),
    });

    return this.toChallengeDto(row);
  }

  async verify(
    organizationId: string,
    dto: WalletVerifyDto,
    user: AuthenticatedUser,
  ): Promise<WalletVerificationResponseDto> {
    await this.assertSupportedChain(dto.chainId);
    const walletAddress = normalizeWalletAddress(dto.walletAddress);
    const row = await this.walletVerificationsRepository.findByWallet({
      organizationId,
      chainId: dto.chainId,
      walletAddress: walletAddress.toLowerCase(),
    });

    if (!row) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Create a wallet verification challenge before verifying this wallet',
      });
    }

    if (row.challenge_expires_at.getTime() < Date.now()) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Wallet verification challenge expired. Create a new challenge.',
      });
    }

    const valid = await verifyMessage({
      address: walletAddress,
      message: row.challenge_message,
      signature: dto.signature as `0x${string}`,
    });

    if (!valid) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Wallet signature did not match the challenge address',
      });
    }

    const verified = await this.walletVerificationsRepository.markVerified({
      organizationId,
      chainId: dto.chainId,
      walletAddress: walletAddress.toLowerCase(),
      userId: user.id,
      signature: dto.signature,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'wallet.verified',
      entityType: 'wallet_verification',
      entityId: verified.id,
      eventHash: hashPayload({ walletAddress, chainId: dto.chainId, signature: dto.signature }),
    });

    return this.toVerificationDto(verified);
  }

  async list(organizationId: string): Promise<WalletVerificationResponseDto[]> {
    const rows = await this.walletVerificationsRepository.listByOrganization(organizationId);
    return rows.map((row) => this.toVerificationDto(row));
  }

  private async assertSupportedChain(chainId: number) {
    const exists = await this.organizationsRepository.chainExists(chainId);
    if (!exists) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Unsupported chain',
      });
    }
  }

  private buildChallengeMessage(input: {
    organizationId: string;
    chainId: number;
    walletAddress: string;
    nonce: string;
    expiresAt: Date;
  }) {
    return [
      'VALEN Wallet Ownership Verification',
      '',
      'Sign this message to prove wallet ownership. This does not authorize a transaction or spend funds.',
      `Organization: ${input.organizationId}`,
      `Chain ID: ${input.chainId}`,
      `Wallet: ${input.walletAddress}`,
      `Nonce: ${input.nonce}`,
      `Expires At: ${input.expiresAt.toISOString()}`,
    ].join('\n');
  }

  private toChallengeDto(row: WalletVerificationRow): WalletChallengeResponseDto {
    return {
      id: row.id,
      chainId: row.chain_id,
      walletAddress: row.wallet_address,
      nonce: row.challenge_nonce,
      message: row.challenge_message,
      expiresAt: row.challenge_expires_at.toISOString(),
    };
  }

  private toVerificationDto(row: WalletVerificationRow): WalletVerificationResponseDto {
    return {
      id: row.id,
      chainId: row.chain_id,
      walletAddress: row.wallet_address,
      status: row.status,
      signature: row.signature,
      verifiedAt: row.verified_at?.toISOString() ?? null,
      challengeExpiresAt: row.challenge_expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
    };
  }
}
