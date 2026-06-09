import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { DeadLetterJobsRepository } from '../../database/repositories/dead-letter-jobs.repository';
import { EmergencyActionsRepository } from '../../database/repositories/emergency-actions.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import {
  AdminOrganizationResponseDto,
  DeadLetterJobResponseDto,
  EmergencyActionDto,
  EmergencyActionResponseDto,
  ReplayDeadLetterDto,
  SuspendOrganizationDto,
} from './dto/admin.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OrganizationResponseDto } from '../organizations/dto/organization.dto';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async listOrganizations(filters: {
    status?: string;
    plan?: string;
    page: number;
    limit: number;
  }) {
    const { items, total } = await this.organizationsRepository.listAdmin(filters);
    return {
      items: items.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        status: o.status,
        plan: o.plan,
      })) as AdminOrganizationResponseDto[],
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async suspendOrganization(
    organizationId: string,
    dto: SuspendOrganizationDto,
    user: AuthenticatedUser,
  ): Promise<OrganizationResponseDto> {
    const org = await this.organizationsRepository.findById(organizationId);
    if (!org || org.status !== 'active') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Organization must be active',
      });
    }

    const updated = await this.organizationsRepository.update(organizationId, {
      status: 'suspended',
    });

    await this.auditLogsRepository.append({
      actorType: 'user',
      actorId: user.id,
      action: 'admin.organization.suspended',
      entityType: 'organization',
      entityId: organizationId,
      eventHash: hashPayload({ organizationId, reason: dto.reason }),
    });

    return this.organizationsService.toDto(updated!);
  }
}

@Injectable()
export class DeadLetterService {
  constructor(
    private readonly deadLetterJobsRepository: DeadLetterJobsRepository,
  ) {}

  async list(filters: {
    queue?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { items, total } = await this.deadLetterJobsRepository.list(filters);
    return {
      items: items.map((j) => this.toDto(j)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async replay(
    jobId: string,
    dto: ReplayDeadLetterDto,
  ): Promise<DeadLetterJobResponseDto> {
    const job = await this.deadLetterJobsRepository.findById(jobId);
    if (!job || job.status !== 'open') {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Dead letter job not found or not open',
      });
    }

    const updated = await this.deadLetterJobsRepository.resolve(jobId);
    return this.toDto(updated!);
  }

  toDto(job: {
    id: string;
    queue_name: string;
    job_id: string;
    status: string;
    failure_reason: string;
    retry_count: number;
    created_at: Date;
  }): DeadLetterJobResponseDto {
    return {
      id: job.id,
      queueName: job.queue_name,
      jobId: job.job_id,
      status: job.status,
      failureReason: job.failure_reason,
      retryCount: job.retry_count,
      createdAt: job.created_at.toISOString(),
    };
  }
}

@Injectable()
export class EmergencyService {
  constructor(
    private readonly emergencyActionsRepository: EmergencyActionsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async pause(
    dto: EmergencyActionDto,
    user: AuthenticatedUser,
  ): Promise<EmergencyActionResponseDto> {
    this.validateScope(dto.scope);

    const action = await this.emergencyActionsRepository.create({
      actorUserId: user.id,
      scope: dto.scope,
      scopeRef: dto.scopeRef,
      action: 'pause',
      reason: dto.reason,
    });

    await this.auditLogsRepository.append({
      actorType: 'user',
      actorId: user.id,
      action: 'emergency.pause',
      entityType: 'emergency_action',
      entityId: action.id,
      eventHash: hashPayload({ actionId: action.id }),
    });

    return this.toDto(action);
  }

  async unpause(
    dto: EmergencyActionDto,
    user: AuthenticatedUser,
  ): Promise<EmergencyActionResponseDto> {
    this.validateScope(dto.scope);

    if (dto.scope === 'global' && !dto.governanceApprovalRef) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Governance approval required for global unpause',
      });
    }

    const active = await this.emergencyActionsRepository.findActivePause(
      dto.scope,
      dto.scopeRef,
    );
    if (active) {
      await this.emergencyActionsRepository.liftPause(active.id);
    }

    const action = await this.emergencyActionsRepository.create({
      actorUserId: user.id,
      scope: dto.scope,
      scopeRef: dto.scopeRef,
      action: 'unpause',
      reason: dto.reason,
    });

    return this.toDto(action);
  }

  private validateScope(scope: string) {
    if (!['global', 'organization', 'chain'].includes(scope)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid emergency scope',
      });
    }
  }

  toDto(action: {
    id: string;
    scope: string;
    scope_ref: string | null;
    action: string;
    reason: string;
    created_at: Date;
  }): EmergencyActionResponseDto {
    return {
      id: action.id,
      scope: action.scope,
      scopeRef: action.scope_ref,
      action: action.action,
      reason: action.reason,
      createdAt: action.created_at.toISOString(),
    };
  }
}
