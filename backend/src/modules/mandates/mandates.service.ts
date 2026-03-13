import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { getAddress, keccak256, stringToHex, verifyTypedData } from 'viem';
import { AgentsRepository } from '../../database/repositories/agents.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { MandateRow, MandatesRepository } from '../../database/repositories/mandates.repository';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { PoliciesRepository } from '../../database/repositories/policies.repository';
import { WalletVerificationsRepository } from '../../database/repositories/wallet-verifications.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  CreateSignedMandateDto,
  MandateResponseDto,
  MandateTypedDataRequestDto,
  MandateTypedDataResponseDto,
  RevokeMandateDto,
} from './dto/mandate.dto';

const MANDATE_TYPES = {
  Mandate: [
    { name: 'organizationId', type: 'string' },
    { name: 'agentId', type: 'string' },
    { name: 'policyId', type: 'string' },
    { name: 'signer', type: 'address' },
    { name: 'chainId', type: 'uint256' },
    { name: 'allowedChains', type: 'string' },
    { name: 'allowedActions', type: 'string' },
    { name: 'allowedAssets', type: 'string' },
    { name: 'allowedTargets', type: 'string' },
    { name: 'maxPerTransaction', type: 'string' },
    { name: 'maxTotal', type: 'string' },
    { name: 'approvalThreshold', type: 'string' },
    { name: 'validUntil', type: 'string' },
    { name: 'nonce', type: 'string' },
  ],
} as const;

function normalizeAddress(address: string): `0x${string}` {
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
export class MandatesService {
  constructor(
    private readonly mandatesRepository: MandatesRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly policiesRepository: PoliciesRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly walletVerificationsRepository: WalletVerificationsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async typedData(
    organizationId: string,
    dto: MandateTypedDataRequestDto,
  ): Promise<MandateTypedDataResponseDto> {
    await this.validateReferences(organizationId, dto);
    const nonce = dto.nonce ?? randomBytes(16).toString('hex');
    const typedData = this.buildTypedData(organizationId, { ...dto, nonce });
    return {
      typedData,
      typedDataHash: this.hashTypedData(typedData),
      nonce,
    };
  }

  async create(
    organizationId: string,
    dto: CreateSignedMandateDto,
    user: AuthenticatedUser,
  ): Promise<MandateResponseDto> {
    await this.validateReferences(organizationId, dto);
    const signer = normalizeAddress(dto.signerAddress);
    const verifiedWallet = await this.walletVerificationsRepository.findByWallet({
      organizationId,
      chainId: dto.chainId,
      walletAddress: signer.toLowerCase(),
    });
    if (!verifiedWallet || verifiedWallet.status !== 'verified') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Verify the signer wallet before creating a mandate',
      });
    }
    if (!dto.nonce) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Mandate nonce is required. Request typed data before signing.',
      });
    }

    const typedData = this.buildTypedData(organizationId, { ...dto, nonce: dto.nonce });
    const typedDataHash = this.hashTypedData(typedData);
    if (typedDataHash !== dto.typedDataHash) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Mandate typed data hash does not match request payload',
      });
    }

    const valid = await verifyTypedData({
      address: signer,
      domain: typedData.domain,
      types: MANDATE_TYPES,
      primaryType: 'Mandate',
      message: typedData.message,
      signature: dto.signature as `0x${string}`,
    });
    if (!valid) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Mandate signature did not match signer or typed data',
      });
    }

    try {
      const row = await this.mandatesRepository.createSigned({
        organizationId,
        agentId: dto.agentId,
        userId: user.id,
        policyId: dto.policyId,
        chainId: dto.chainId,
        scopeHash: typedDataHash,
        validFrom: new Date(),
        validUntil: new Date(dto.validUntil),
        maxPerTransaction: dto.maxPerTransaction,
        maxTotal: dto.maxTotal,
        signerAddress: signer.toLowerCase(),
        signature: dto.signature,
        typedDataHash,
        typedData,
        allowedChains: dto.allowedChains,
        allowedActions: dto.allowedActions,
        allowedAssets: dto.allowedAssets,
        allowedTargets: dto.allowedTargets,
        approvalThreshold: dto.approvalThreshold,
      });

      await this.auditLogsRepository.append({
        organizationId,
        actorType: 'user',
        actorId: user.id,
        action: 'mandate.signed',
        entityType: 'mandate',
        entityId: row.id,
        eventHash: hashPayload({ mandateId: row.id, typedDataHash }),
      });

      return this.toDto(row);
    } catch (err) {
      if (err instanceof Error && err.message.includes('idx_mandates_typed_data_hash_unique')) {
        throw new ConflictException({
          code: ErrorCodes.CONFLICT,
          message: 'This signed mandate has already been stored',
        });
      }
      throw err;
    }
  }

  async list(organizationId: string): Promise<MandateResponseDto[]> {
    const rows = await this.mandatesRepository.listByOrganization(organizationId);
    return rows.map((row) => this.toDto(row));
  }

  async revoke(
    organizationId: string,
    mandateId: string,
    dto: RevokeMandateDto,
    user: AuthenticatedUser,
  ): Promise<MandateResponseDto> {
    const existing = await this.mandatesRepository.findByOrgAndId(organizationId, mandateId);
    if (!existing) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Mandate not found',
      });
    }

    const revoked = await this.mandatesRepository.revoke(organizationId, mandateId);
    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'mandate.revoked',
      entityType: 'mandate',
      entityId: mandateId,
      eventHash: hashPayload({ mandateId, reason: dto.reason }),
    });
    return this.toDto(revoked ?? existing);
  }

  private async validateReferences(organizationId: string, dto: MandateTypedDataRequestDto) {
    const chainSupported = await this.organizationsRepository.chainExists(dto.chainId);
    if (!chainSupported) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Unsupported chain',
      });
    }
    if (!dto.allowedChains.includes(dto.chainId)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Allowed chains must include the signing chain',
      });
    }
    const validUntil = new Date(dto.validUntil);
    if (!Number.isFinite(validUntil.getTime()) || validUntil.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Mandate expiry must be in the future',
      });
    }

    const agent = await this.agentsRepository.findByOrgAndId(organizationId, dto.agentId);
    if (!agent || agent.status !== 'active') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate requires an active agent',
      });
    }

    if (dto.policyId) {
      const policy = await this.policiesRepository.findByOrgAndId(organizationId, dto.policyId);
      if (!policy) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Policy does not belong to organization',
        });
      }
    }
  }

  private buildTypedData(organizationId: string, dto: MandateTypedDataRequestDto & { nonce: string }) {
    const signer = normalizeAddress(dto.signerAddress);
    return {
      domain: {
        name: 'VALEN Agent Mandate',
        version: '1',
        chainId: dto.chainId,
      },
      types: MANDATE_TYPES,
      primaryType: 'Mandate',
      message: {
        organizationId,
        agentId: dto.agentId,
        policyId: dto.policyId ?? '',
        signer,
        chainId: BigInt(dto.chainId),
        allowedChains: dto.allowedChains.join(','),
        allowedActions: dto.allowedActions.join(','),
        allowedAssets: dto.allowedAssets.join(','),
        allowedTargets: dto.allowedTargets.join(','),
        maxPerTransaction: dto.maxPerTransaction ?? '',
        maxTotal: dto.maxTotal ?? '',
        approvalThreshold: dto.approvalThreshold ?? '',
        validUntil: new Date(dto.validUntil).toISOString(),
        nonce: dto.nonce,
      },
    };
  }

  private hashTypedData(typedData: Record<string, unknown>) {
    return keccak256(stringToHex(JSON.stringify(typedData, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    )));
  }

  private toDto(row: MandateRow): MandateResponseDto {
    return {
      id: row.id,
      organizationId: row.organization_id,
      agentId: row.agent_id,
      policyId: row.policy_id,
      chainId: row.chain_id,
      signerAddress: row.signer_address ?? '',
      status: row.status,
      allowedChains: row.allowed_chains ?? [],
      allowedActions: row.allowed_actions ?? [],
      allowedAssets: row.allowed_assets ?? [],
      allowedTargets: row.allowed_targets ?? [],
      maxPerTransaction: row.max_per_transaction,
      maxTotal: row.max_total,
      approvalThreshold: row.approval_threshold,
      typedDataHash: row.typed_data_hash ?? '',
      signature: row.signature ?? '',
      validUntil: row.valid_until.toISOString(),
      createdAt: row.created_at.toISOString(),
    };
  }
}
