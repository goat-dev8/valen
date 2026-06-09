import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplianceChecksRepository } from '../../database/repositories/compliance-checks.repository';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import {
  ComplianceAttestationResponseDto,
  ComplianceCheckResponseDto,
  ComplianceSubjectResponseDto,
  CreateAttestationDto,
} from './dto/compliance.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RiskProducer } from '../../queues/producers/index';

const ALLOWED_PROVIDERS = ['trm', 'webacy', 'internal'];

function getOnChainMetadata(execution: { metadata: Record<string, unknown> }) {
  const metadata = execution.metadata?.onchain;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Execution metadata.onchain is required for compliance processing');
  }
  return metadata as Record<string, unknown>;
}

function requireHex(value: unknown, key: string, bytes = 32): string {
  if (
    typeof value !== 'string' ||
    !new RegExp(`^0x[0-9a-fA-F]{${bytes * 2}}$`).test(value)
  ) {
    throw new Error(`metadata.onchain.${key} must be ${bytes} bytes`);
  }
  return value;
}

@Injectable()
export class ComplianceService {
  constructor(
    private readonly complianceChecksRepository: ComplianceChecksRepository,
    private readonly executionsRepository: ExecutionsRepository,
  ) {}

  async getExecutionChecks(
    organizationId: string,
    executionId: string,
  ): Promise<ComplianceCheckResponseDto[]> {
    const execution = await this.executionsRepository.findByOrgAndId(
      organizationId,
      executionId,
    );
    if (!execution) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Execution not found',
      });
    }

    const checks =
      await this.complianceChecksRepository.listByExecution(executionId);
    return checks.map((c) => this.checkToDto(c));
  }

  async createAttestation(
    organizationId: string,
    dto: CreateAttestationDto,
    _user: AuthenticatedUser,
  ): Promise<ComplianceAttestationResponseDto> {
    if (!ALLOWED_PROVIDERS.includes(dto.provider)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Provider not allowed',
      });
    }

    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt <= new Date()) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Expiry must be in the future',
      });
    }

    const attestation =
      await this.complianceChecksRepository.createAttestation({
        organizationId,
        provider: dto.provider,
        subjectType: dto.subjectType,
        subjectRef: dto.subjectRef,
        attestationHash: dto.attestationHash,
        reasonCode: dto.reasonCode,
        expiresAt,
      });

    return {
      id: attestation.id,
      provider: attestation.provider,
      subjectType: attestation.subject_type,
      subjectRef: attestation.subject_ref,
      attestationHash: attestation.attestation_hash,
      status: attestation.status,
      expiresAt: attestation.expires_at.toISOString(),
    };
  }

  async getSubject(
    organizationId: string,
    subjectRef: string,
  ): Promise<ComplianceSubjectResponseDto> {
    const attestations =
      await this.complianceChecksRepository.findAttestationsBySubject(
        organizationId,
        subjectRef,
      );

    return {
      subjectRef,
      attestations: attestations.map((a) => ({
        id: a.id,
        provider: a.provider,
        subjectType: a.subject_type,
        subjectRef: a.subject_ref,
        attestationHash: a.attestation_hash,
        status: a.status,
        expiresAt: a.expires_at.toISOString(),
      })),
      recentChecks: [],
    };
  }

  private checkToDto(check: {
    id: string;
    execution_id: string;
    status: string;
    provider: string;
    reason_code: string;
    subject_type: string;
    subject_ref: string;
    checked_at: Date | null;
  }): ComplianceCheckResponseDto {
    return {
      id: check.id,
      executionId: check.execution_id,
      status: check.status,
      provider: check.provider,
      reasonCode: check.reason_code,
      subjectType: check.subject_type,
      subjectRef: check.subject_ref,
      checkedAt: check.checked_at?.toISOString() ?? null,
    };
  }
}

@Injectable()
export class ComplianceWorkerService {
  constructor(
    private readonly complianceChecksRepository: ComplianceChecksRepository,
    private readonly executionsRepository: ExecutionsRepository,
    private readonly riskProducer: RiskProducer,
  ) {}

  async processExecution(executionId: string): Promise<void> {
    const execution = await this.executionsRepository.findById(executionId);
    if (!execution) return;

    try {
      const onchain = getOnChainMetadata(execution);
      await this.complianceChecksRepository.createCheck({
        organizationId: execution.organization_id,
        executionId,
        reasonCode: 'ONCHAIN_ENGINE_DEFERRED',
        provider: 'onchain-stylus',
        subjectType: 'transaction',
        subjectRef: executionId,
        status: 'pending',
        resultHash: requireHex(onchain.complianceHash, 'complianceHash'),
        attestationHash: Array.isArray(onchain.attestationHashes) && onchain.attestationHashes.length > 0
          ? requireHex(onchain.attestationHashes[0], 'attestationHashes[0]')
          : undefined,
        checkedAt: new Date(),
      });
    } catch (error) {
      await this.executionsRepository.updateStatus(executionId, 'compliance_failed');
      throw error;
    }

    await this.executionsRepository.updateStatus(executionId, 'validated');
    await this.riskProducer.enqueue({
      organizationId: execution.organization_id,
      executionId,
    });
  }
}
