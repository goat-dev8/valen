import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import { newId } from '../../common/utils/id.util';
import {
  AuditExportDto,
  AuditExportResponseDto,
  AuditLogResponseDto,
} from './dto/audit.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

const MAX_RANGE_DAYS = 90;

@Injectable()
export class AuditService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async list(
    organizationId: string,
    filters: {
      entityType?: string;
      actor?: string;
      from?: string;
      to?: string;
    },
    page: number,
    limit: number,
  ) {
    this.validateDateRange(filters.from, filters.to);

    const { items, total } = await this.auditLogsRepository.list(
      organizationId,
      {
        entityType: filters.entityType,
        actor: filters.actor,
        from: filters.from ? new Date(filters.from) : undefined,
        to: filters.to ? new Date(filters.to) : undefined,
      },
      page,
      limit,
    );

    return {
      items: items.map((l) => this.toDto(l)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async get(organizationId: string, auditLogId: string): Promise<AuditLogResponseDto> {
    const log = await this.auditLogsRepository.findById(auditLogId);
    if (!log || log.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Audit log not found',
      });
    }
    return this.toDto(log);
  }

  async export(
    organizationId: string,
    dto: AuditExportDto,
    user: AuthenticatedUser,
  ): Promise<AuditExportResponseDto> {
    this.validateDateRange(dto.startDate, dto.endDate);

    if (!['json', 'csv'].includes(dto.format)) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid export format',
      });
    }

    const { total } = await this.auditLogsRepository.list(
      organizationId,
      {
        from: new Date(dto.startDate),
        to: new Date(dto.endDate),
      },
      1,
      1,
    );

    const exportId = newId();
    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'audit.export.requested',
      entityType: 'audit_export',
      entityId: exportId,
      eventHash: hashPayload({ exportId, dto }),
    });

    return {
      exportId,
      status: 'queued',
      format: dto.format,
      recordCount: total,
    };
  }

  private validateDateRange(from?: string, to?: string) {
    if (!from || !to) return;
    const start = new Date(from);
    const end = new Date(to);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: `Date range cannot exceed ${MAX_RANGE_DAYS} days`,
      });
    }
  }

  toDto(log: {
    id: string;
    actor_type: string;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    event_hash: string;
    created_at: Date;
  }): AuditLogResponseDto {
    return {
      id: log.id,
      actorType: log.actor_type,
      actorId: log.actor_id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      eventHash: log.event_hash,
      createdAt: log.created_at.toISOString(),
    };
  }
}

@Injectable()
export class AuditWorkerService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async processEvent(payload: {
    organizationId?: string;
    eventName: string;
    relatedEntityType: string;
    relatedEntityId: string;
    chainId?: number;
    txHash?: string;
    actorType?: string;
    actorId?: string;
  }): Promise<void> {
    await this.auditLogsRepository.appendEvent({
      organizationId: payload.organizationId,
      eventName: payload.eventName,
      eventHash: hashPayload(payload),
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId,
    });

    await this.auditLogsRepository.append({
      organizationId: payload.organizationId,
      actorType: payload.actorType ?? 'system',
      actorId: payload.actorId,
      action: payload.eventName,
      entityType: payload.relatedEntityType,
      entityId: payload.relatedEntityId,
      eventHash: hashPayload(payload),
      chainId: payload.chainId,
      txHash: payload.txHash,
    });
  }
}
