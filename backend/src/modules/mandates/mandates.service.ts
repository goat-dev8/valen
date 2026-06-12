import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { getAddress, hashTypedData, recoverTypedDataAddress, verifyTypedData } from 'viem';
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

const EIP712_DOMAIN_TYPES = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
] as const;

const FULL_MANDATE_TYPES = {
  EIP712Domain: EIP712_DOMAIN_TYPES,
  Mandate: MANDATE_TYPES.Mandate,
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

export type MandateExecutionContext = {
  agentId: string;
  targetChainId: number;
  actionType: string;
  targetAddress?: string | null;
  assetAddress?: string | null;
  amount?: string | null;
};

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

function actionAllowed(allowedActions: string[], actionType: string): boolean {
  if (!allowedActions.length) return true;
  if (allowedActions.includes(actionType)) return true;
  if (actionType === 'custom' && allowedActions.includes('demo_trade')) return true;
  return false;
}

function targetAllowed(allowedTargets: string[], targetAddress?: string | null): boolean {
  if (!allowedTargets.length || allowedTargets.includes('*')) return true;
  const normalizedTarget = targetAddress?.toLowerCase() ?? '';
  const normalizedAllowed = allowedTargets.map((target) => target.toLowerCase());
  if (normalizedAllowed.includes(normalizedTarget)) return true;
  if (
    normalizedAllowed.includes('robinhood-demo') &&
    normalizedTarget === '0x0000000000000000000000000000000000000000'
  ) {
    return true;
  }
  return false;
}

function assetAllowed(allowedAssets: string[], assetAddress?: string | null): boolean {
  if (!allowedAssets.length || allowedAssets.includes('*')) return true;
  const asset = assetAddress?.trim();
  if (!asset) return allowedAssets.includes('native');
  return allowedAssets.includes(asset) || allowedAssets.includes('native');
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
      typedData: this.serializeTypedDataForApi(typedData),
      typedDataHash: this.computeTypedDataHash(typedData),
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
    const typedDataHash = this.computeTypedDataHash(typedData);
    if (typedDataHash !== dto.typedDataHash) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Mandate typed data hash does not match request payload',
      });
    }

    const verificationPayload = dto.signedTypedData
      ? this.parseSignedTypedData(dto.signedTypedData)
      : this.toVerificationPayload(typedData);

    const valid = await verifyTypedData({
      address: signer,
      domain: {
        ...verificationPayload.domain,
        chainId: BigInt(verificationPayload.domain.chainId),
      },
      types: FULL_MANDATE_TYPES,
      primaryType: 'Mandate',
      message: verificationPayload.message,
      signature: dto.signature as `0x${string}`,
    });
    if (!valid) {
      let recovered: string | null = null;
      try {
        recovered = await recoverTypedDataAddress({
          domain: {
            ...verificationPayload.domain,
            chainId: BigInt(verificationPayload.domain.chainId),
          },
          types: FULL_MANDATE_TYPES,
          primaryType: 'Mandate',
          message: verificationPayload.message,
          signature: dto.signature as `0x${string}`,
        });
      } catch {
        recovered = null;
      }
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: recovered
          ? `Mandate signature was created by ${recovered}, but expected ${signer}. Reconnect the verified wallet and sign again.`
          : 'Mandate signature did not match signer or typed data. Request a fresh signature and try again.',
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
        typedData: this.serializeTypedDataForApi(typedData),
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
      if (
        isPostgresUniqueViolation(err) ||
        (err instanceof Error && err.message.includes('idx_mandates_typed_data_hash_unique'))
      ) {
        throw new ConflictException({
          code: ErrorCodes.CONFLICT,
          message: 'This signed mandate has already been stored',
        });
      }
      throw err;
    }
  }

  async get(organizationId: string, mandateId: string): Promise<MandateResponseDto> {
    const row = await this.mandatesRepository.findByOrgAndId(organizationId, mandateId);
    if (!row) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Mandate not found',
      });
    }
    return this.toDto(row);
  }

  async assertActiveForExecution(
    organizationId: string,
    mandateId: string,
    context: MandateExecutionContext,
  ): Promise<MandateRow> {
    const mandate = await this.mandatesRepository.findByOrgAndId(organizationId, mandateId);
    if (!mandate) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Active signed mandate is required',
      });
    }
    if (mandate.status !== 'active') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate is not active',
      });
    }
    if (mandate.agent_id !== context.agentId) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate does not authorize this agent',
      });
    }

    const now = Date.now();
    if (mandate.valid_from.getTime() > now || mandate.valid_until.getTime() <= now) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate is expired or not yet valid',
      });
    }
    if (mandate.allowed_chains?.length && !mandate.allowed_chains.includes(context.targetChainId)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate does not allow this chain',
      });
    }
    if (!actionAllowed(mandate.allowed_actions ?? [], context.actionType)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate does not allow this action type',
      });
    }
    if (!targetAllowed(mandate.allowed_targets ?? [], context.targetAddress)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate does not allow this target',
      });
    }
    if (!assetAllowed(mandate.allowed_assets ?? [], context.assetAddress)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Mandate does not allow this asset',
      });
    }

    return mandate;
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
      types: FULL_MANDATE_TYPES,
      primaryType: 'Mandate' as const,
      message: this.buildMessage(organizationId, dto, signer),
    };
  }

  private buildMessage(
    organizationId: string,
    dto: MandateTypedDataRequestDto & { nonce: string },
    signer: `0x${string}`,
  ) {
    return {
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
    };
  }

  private computeTypedDataHash(typedData: ReturnType<typeof this.buildTypedData>) {
    return hashTypedData({
      domain: {
        ...typedData.domain,
        chainId: BigInt(typedData.domain.chainId),
      },
      types: FULL_MANDATE_TYPES,
      primaryType: 'Mandate',
      message: typedData.message,
    });
  }

  private serializeTypedDataForApi(typedData: ReturnType<typeof this.buildTypedData>) {
    return {
      domain: typedData.domain,
      types: {
        Mandate: MANDATE_TYPES.Mandate,
      },
      primaryType: typedData.primaryType,
      message: {
        ...typedData.message,
        chainId: typedData.message.chainId.toString(),
      },
    };
  }

  private toVerificationPayload(typedData: ReturnType<typeof this.buildTypedData>) {
    return {
      domain: typedData.domain,
      message: typedData.message,
    };
  }

  private parseSignedTypedData(raw: Record<string, unknown>) {
    const domain = raw.domain as Record<string, unknown>;
    const message = raw.message as Record<string, unknown>;
    if (!domain || !message) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Signed mandate typed data is missing domain or message',
      });
    }

    return {
      domain: {
        name: String(domain.name ?? ''),
        version: String(domain.version ?? ''),
        chainId: Number(domain.chainId),
      },
      message: {
        organizationId: String(message.organizationId ?? ''),
        agentId: String(message.agentId ?? ''),
        policyId: String(message.policyId ?? ''),
        signer: normalizeAddress(String(message.signer ?? '')),
        chainId: BigInt(String(message.chainId ?? '0')),
        allowedChains: String(message.allowedChains ?? ''),
        allowedActions: String(message.allowedActions ?? ''),
        allowedAssets: String(message.allowedAssets ?? ''),
        allowedTargets: String(message.allowedTargets ?? ''),
        maxPerTransaction: String(message.maxPerTransaction ?? ''),
        maxTotal: String(message.maxTotal ?? ''),
        approvalThreshold: String(message.approvalThreshold ?? ''),
        validUntil: String(message.validUntil ?? ''),
        nonce: String(message.nonce ?? ''),
      },
    };
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
