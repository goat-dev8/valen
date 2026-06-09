import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PolicyVersionsRepository } from '../../database/repositories/policy-versions.repository';
import { PoliciesRepository } from '../../database/repositories/policies.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload, sha256 } from '../../common/utils/hash.util';
import {
  CreatePolicyVersionDto,
  PolicyCommentDto,
  PolicyResponseDto,
  PolicyVersionResponseDto,
} from './dto/policy.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PoliciesService } from './policies.service';

@Injectable()
export class PolicyVersionsService {
  constructor(
    private readonly policyVersionsRepository: PolicyVersionsRepository,
    private readonly policiesRepository: PoliciesRepository,
    private readonly policiesService: PoliciesService,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async listVersions(policyId: string): Promise<PolicyVersionResponseDto[]> {
    const versions = await this.policyVersionsRepository.listByPolicy(policyId);
    return versions.map((v) => this.toDto(v));
  }

  async createVersion(
    organizationId: string,
    policyId: string,
    dto: CreatePolicyVersionDto,
    user: AuthenticatedUser,
  ): Promise<PolicyVersionResponseDto> {
    const policy = await this.policiesRepository.findByOrgAndId(
      organizationId,
      policyId,
    );
    if (!policy) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Policy not found',
      });
    }

    const ruleCount = Array.isArray(dto.rules.rules)
      ? (dto.rules.rules as unknown[]).length
      : Object.keys(dto.rules).length;
    if (ruleCount > 100) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Rule count exceeds maximum of 100',
      });
    }

    const versionNumber = await this.policyVersionsRepository.nextVersionNumber(
      policyId,
    );

    const version = await this.policyVersionsRepository.create({
      organizationId,
      policyId,
      versionNumber,
      rules: dto.rules,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'policy_version.created',
      entityType: 'policy_version',
      entityId: version.id,
      eventHash: hashPayload({ versionId: version.id }),
    });

    return this.toDto(version);
  }

  async submit(
    organizationId: string,
    policyId: string,
    versionId: string,
    user: AuthenticatedUser,
  ): Promise<PolicyVersionResponseDto> {
    const version = await this.getVersionOrThrow(organizationId, policyId, versionId);
    if (version.status !== 'draft') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Only draft versions can be submitted',
      });
    }

    const updated = await this.policyVersionsRepository.updateStatus(
      versionId,
      'pending_approval',
    );
    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'policy_version.submitted',
      entityType: 'policy_version',
      entityId: versionId,
      eventHash: hashPayload({ versionId }),
    });
    return this.toDto(updated!);
  }

  async publish(
    organizationId: string,
    policyId: string,
    versionId: string,
    dto: PolicyCommentDto,
    user: AuthenticatedUser,
  ): Promise<PolicyVersionResponseDto> {
    const version = await this.getVersionOrThrow(organizationId, policyId, versionId);
    if (version.status !== 'pending_approval') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Only pending approval versions can be published',
      });
    }

    const rulesHash = sha256(JSON.stringify(version.rules));
    const updated = await this.policyVersionsRepository.updateStatus(
      versionId,
      'published',
      { rulesHash, publishedByUserId: user.id },
    );

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'policy_version.published',
      entityType: 'policy_version',
      entityId: versionId,
      eventHash: hashPayload({ versionId, approvalRef: dto.approvalRef }),
    });

    return this.toDto(updated!);
  }

  async activate(
    organizationId: string,
    policyId: string,
    versionId: string,
    dto: PolicyCommentDto,
    user: AuthenticatedUser,
  ): Promise<PolicyResponseDto> {
    const version = await this.getVersionOrThrow(organizationId, policyId, versionId);
    if (version.status !== 'published') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Only published versions can be activated',
      });
    }

    const activatedAt = dto.activationTime
      ? new Date(dto.activationTime)
      : new Date();

    await this.policyVersionsRepository.updateStatus(versionId, 'active', {
      activatedAt,
    });

    const policy = await this.policiesRepository.setActiveVersion(
      policyId,
      versionId,
      'active',
    );

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'policy_version.activated',
      entityType: 'policy',
      entityId: policyId,
      eventHash: hashPayload({ versionId }),
    });

    return this.policiesService.toDto(policy!);
  }

  private async getVersionOrThrow(
    organizationId: string,
    policyId: string,
    versionId: string,
  ) {
    const version = await this.policyVersionsRepository.findById(versionId);
    if (
      !version ||
      version.policy_id !== policyId ||
      version.organization_id !== organizationId
    ) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Policy version not found',
      });
    }
    return version;
  }

  toDto(version: {
    id: string;
    policy_id: string;
    version_number: number;
    status: string;
    rules: Record<string, unknown>;
    rules_hash: string | null;
    published_at: Date | null;
    activated_at: Date | null;
    created_at: Date;
  }): PolicyVersionResponseDto {
    return {
      id: version.id,
      policyId: version.policy_id,
      versionNumber: version.version_number,
      status: version.status,
      rules: version.rules,
      rulesHash: version.rules_hash,
      publishedAt: version.published_at?.toISOString() ?? null,
      activatedAt: version.activated_at?.toISOString() ?? null,
      createdAt: version.created_at.toISOString(),
    };
  }
}
