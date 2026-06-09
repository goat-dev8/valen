import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExecutionsRepository } from '../../database/repositories/executions.repository';
import { AgentsRepository } from '../../database/repositories/agents.repository';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import {
  CancelExecutionDto,
  CreateExecutionDto,
  ExecutionResponseDto,
  AuditTimelineEventDto,
} from './dto/settlement.dto';
import { IntentProducer } from '../../queues/producers/index';

const TERMINAL_STATUSES = [
  'executed',
  'failed',
  'cancelled',
  'compliance_failed',
  'risk_failed',
  'policy_rejected',
];

@Injectable()
export class ExecutionsService {
  constructor(
    private readonly executionsRepository: ExecutionsRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly intentProducer: IntentProducer,
  ) {}

  async create(
    organizationId: string,
    dto: CreateExecutionDto,
  ): Promise<ExecutionResponseDto> {
    const existing = await this.executionsRepository.findByIdempotencyKey(
      organizationId,
      dto.idempotencyKey,
    );
    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.IDEMPOTENCY_CONFLICT,
        message: 'Idempotency key already used',
      });
    }

    const agent = await this.agentsRepository.findByOrgAndId(
      organizationId,
      dto.agentId,
    );
    if (!agent || agent.status !== 'active') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Agent must be active',
      });
    }

    const chainSupported = await this.organizationsRepository.chainExists(
      dto.targetChainId,
    );
    if (!chainSupported) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Unsupported chain',
      });
    }

    const execution = await this.executionsRepository.create({
      organizationId,
      agentId: dto.agentId,
      idempotencyKey: dto.idempotencyKey,
      actionType: dto.actionType,
      targetChainId: dto.targetChainId,
      targetAddress: dto.targetAddress,
      assetAddress: dto.assetAddress,
      valueAmount: dto.amount,
      mandateId: dto.mandateId,
      policyId: agent.default_policy_id ?? undefined,
      payloadHash: dto.payloadHash,
      payloadRef: dto.payloadRef,
      metadata: dto.metadata,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.executionsRepository.recordIdempotencyKey(
      organizationId,
      dto.idempotencyKey,
      execution.id,
      expiresAt,
    );

    await this.auditLogsRepository.appendEvent({
      organizationId,
      eventName: 'execution.created',
      eventHash: hashPayload({ executionId: execution.id }),
      relatedEntityType: 'execution',
      relatedEntityId: execution.id,
    });

    await this.intentProducer.enqueue({
      organizationId,
      executionId: execution.id,
    });

    return this.toDto(execution);
  }

  async list(
    organizationId: string,
    filters: {
      status?: string;
      agentId?: string;
      from?: string;
      to?: string;
    },
    page: number,
    limit: number,
  ) {
    const { items, total } = await this.executionsRepository.list(
      organizationId,
      {
        status: filters.status,
        agentId: filters.agentId,
        from: filters.from ? new Date(filters.from) : undefined,
        to: filters.to ? new Date(filters.to) : undefined,
      },
      page,
      limit,
    );
    return {
      items: items.map((e) => this.toDto(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async get(
    organizationId: string,
    executionId: string,
  ): Promise<ExecutionResponseDto> {
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
    return this.toDto(execution);
  }

  async cancel(
    organizationId: string,
    executionId: string,
    dto: CancelExecutionDto,
  ): Promise<ExecutionResponseDto> {
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

    if (TERMINAL_STATUSES.includes(execution.status)) {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Cannot cancel terminal execution',
      });
    }

    const updated = await this.executionsRepository.updateStatus(
      executionId,
      'cancelled',
    );

    await this.auditLogsRepository.appendEvent({
      organizationId,
      eventName: 'execution.cancelled',
      eventHash: hashPayload({ executionId, reason: dto.reason }),
      relatedEntityType: 'execution',
      relatedEntityId: executionId,
    });

    return this.toDto(updated!);
  }

  async timeline(
    organizationId: string,
    executionId: string,
  ): Promise<AuditTimelineEventDto[]> {
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

    const events = await this.auditLogsRepository.timelineForEntity(
      organizationId,
      'execution',
      executionId,
    );

    return events.map((e) => ({
      id: e.id,
      eventName: e.event_name,
      eventHash: e.event_hash,
      createdAt: e.created_at.toISOString(),
    }));
  }

  toDto(execution: {
    id: string;
    organization_id: string;
    agent_id: string;
    idempotency_key: string;
    action_type: string;
    status: string;
    target_chain_id: number;
    target_address: string | null;
    request_payload_hash: string;
    created_at: Date;
    updated_at: Date;
  }): ExecutionResponseDto {
    return {
      id: execution.id,
      organizationId: execution.organization_id,
      agentId: execution.agent_id,
      idempotencyKey: execution.idempotency_key,
      actionType: execution.action_type,
      status: execution.status,
      targetChainId: execution.target_chain_id,
      targetAddress: execution.target_address,
      requestPayloadHash: execution.request_payload_hash,
      createdAt: execution.created_at.toISOString(),
      updatedAt: execution.updated_at.toISOString(),
    };
  }
}
