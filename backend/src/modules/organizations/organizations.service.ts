import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { TeamMembersRepository } from '../../database/repositories/team-members.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly teamMembersRepository: TeamMembersRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const existing = await this.organizationsRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'Organization slug already exists',
      });
    }

    if (dto.defaultChainId) {
      const valid = await this.organizationsRepository.chainExists(dto.defaultChainId);
      if (!valid) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Unsupported chain',
        });
      }
    }

    const org = await this.organizationsRepository.create({
      name: dto.name,
      slug: dto.slug,
      defaultChainId: dto.defaultChainId,
    });

    await this.teamMembersRepository.addOwnerMembership(org.id, user.id);

    await this.auditLogsRepository.append({
      organizationId: org.id,
      actorType: 'user',
      actorId: user.id,
      action: 'organization.created',
      entityType: 'organization',
      entityId: org.id,
      eventHash: hashPayload({ orgId: org.id, action: 'created' }),
    });

    return this.toDto(org);
  }

  async get(organizationId: string): Promise<OrganizationResponseDto> {
    const org = await this.organizationsRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Organization not found',
      });
    }
    return this.toDto(org);
  }

  async update(
    organizationId: string,
    dto: UpdateOrganizationDto,
    user: AuthenticatedUser,
  ): Promise<OrganizationResponseDto> {
    if (dto.defaultChainId) {
      const valid = await this.organizationsRepository.chainExists(dto.defaultChainId);
      if (!valid) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Unsupported chain',
        });
      }
    }

    const org = await this.organizationsRepository.update(organizationId, {
      name: dto.name,
      defaultChainId: dto.defaultChainId,
      riskMode: dto.riskMode,
      complianceMode: dto.complianceMode,
    });

    if (!org) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Organization not found',
      });
    }

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'organization.updated',
      entityType: 'organization',
      entityId: organizationId,
      eventHash: hashPayload({ organizationId, dto }),
    });

    return this.toDto(org);
  }

  toDto(org: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    default_chain_id: number | null;
    risk_mode: string;
    compliance_mode: string;
    created_at: Date;
    updated_at: Date;
  }): OrganizationResponseDto {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      plan: org.plan,
      defaultChainId: org.default_chain_id,
      riskMode: org.risk_mode,
      complianceMode: org.compliance_mode,
      createdAt: org.created_at.toISOString(),
      updatedAt: org.updated_at.toISOString(),
    };
  }
}
