import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoliciesRepository } from '../../database/repositories/policies.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import {
  CreatePolicyDto,
  PolicyResponseDto,
} from './dto/policy.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly policiesRepository: PoliciesRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async create(
    organizationId: string,
    dto: CreatePolicyDto,
    user: AuthenticatedUser,
  ): Promise<PolicyResponseDto> {
    const existing = (await this.policiesRepository.list(organizationId)).find(
      (p) => p.name === dto.name,
    );
    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'Policy name must be unique per organization',
      });
    }

    const policy = await this.policiesRepository.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      createdByUserId: user.id,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'policy.created',
      entityType: 'policy',
      entityId: policy.id,
      eventHash: hashPayload({ policyId: policy.id }),
    });

    return this.toDto(policy);
  }

  async list(organizationId: string, status?: string): Promise<PolicyResponseDto[]> {
    const policies = await this.policiesRepository.list(organizationId, status);
    return policies.map((p) => this.toDto(p));
  }

  async get(organizationId: string, policyId: string) {
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
    return this.toDto(policy);
  }

  toDto(policy: {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    status: string;
    active_version_id: string | null;
    created_at: Date;
  }): PolicyResponseDto {
    return {
      id: policy.id,
      organizationId: policy.organization_id,
      name: policy.name,
      description: policy.description,
      status: policy.status,
      activeVersionId: policy.active_version_id,
      createdAt: policy.created_at.toISOString(),
    };
  }
}
