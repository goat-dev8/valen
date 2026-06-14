import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentsRepository } from '../../database/repositories/agents.repository';
import { PoliciesRepository } from '../../database/repositories/policies.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { hashPayload } from '../../common/utils/hash.util';
import {
  AgentResponseDto,
  CreateAgentDto,
  UpdateAgentDto,
} from './dto/agent.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class AgentsService {
  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly policiesRepository: PoliciesRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
  ) {}

  async create(
    organizationId: string,
    dto: CreateAgentDto,
    user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    if (dto.defaultPolicyId) {
      const policy = await this.policiesRepository.findByOrgAndId(
        organizationId,
        dto.defaultPolicyId,
      );
      if (!policy) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Policy does not belong to organization',
        });
      }
    }

    const agent = await this.agentsRepository.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      agentType: dto.agentType,
      defaultPolicyId: dto.defaultPolicyId,
      metadata: {
        capabilities: dto.capabilities ?? [],
        supportedNetworks: dto.supportedNetworks ?? [421614, 46630],
        supportedAssets: dto.supportedAssets ?? ['USDC', 'USDG', 'TSLA', 'AMZN', 'NFLX', 'PLTR', 'AMD'],
        supportedActions: dto.supportedActions ?? ['transfer'],
      },
      createdByUserId: user.id,
    });

    const active = await this.agentsRepository.update(agent.id, { status: 'active' });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'agent.created',
      entityType: 'agent',
      entityId: agent.id,
      eventHash: hashPayload({ agentId: agent.id }),
    });

    return this.toDto(active ?? agent);
  }

  async list(
    organizationId: string,
    filters: { status?: string; type?: string },
    page: number,
    limit: number,
  ) {
    const { items, total } = await this.agentsRepository.list(
      organizationId,
      filters,
      page,
      limit,
    );
    return {
      items: items.map((a) => this.toDto(a)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async get(organizationId: string, agentId: string): Promise<AgentResponseDto> {
    const agent = await this.agentsRepository.findByOrgAndId(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }
    return this.toDto(agent);
  }

  async update(
    organizationId: string,
    agentId: string,
    dto: UpdateAgentDto,
    user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    const agent = await this.agentsRepository.findByOrgAndId(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }

    if (agent.status === 'revoked') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Cannot update revoked agent',
      });
    }

    if (dto.defaultPolicyId) {
      const policy = await this.policiesRepository.findByOrgAndId(
        organizationId,
        dto.defaultPolicyId,
      );
      if (!policy) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Policy does not belong to organization',
        });
      }
    }

    const metadata = { ...agent.metadata };
    if (dto.capabilities) {
      metadata.capabilities = dto.capabilities;
    }
    if (dto.supportedNetworks) {
      metadata.supportedNetworks = dto.supportedNetworks;
    }
    if (dto.supportedAssets) {
      metadata.supportedAssets = dto.supportedAssets;
    }
    if (dto.supportedActions) {
      metadata.supportedActions = dto.supportedActions;
    }

    const updated = await this.agentsRepository.update(agentId, {
      name: dto.name,
      description: dto.description,
      defaultPolicyId: dto.defaultPolicyId,
      metadata,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'agent.updated',
      entityType: 'agent',
      entityId: agentId,
      eventHash: hashPayload({ agentId, dto }),
    });

    return this.toDto(updated!);
  }

  async activate(
    organizationId: string,
    agentId: string,
    user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    const agent = await this.agentsRepository.findByOrgAndId(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }
    if (agent.status === 'active') {
      return this.toDto(agent);
    }
    if (agent.status === 'revoked') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Cannot activate revoked agent',
      });
    }

    const updated = await this.agentsRepository.update(agentId, { status: 'active' });
    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'agent.activated',
      entityType: 'agent',
      entityId: agentId,
      eventHash: hashPayload({ agentId }),
    });
    return this.toDto(updated!);
  }

  async suspend(
    organizationId: string,
    agentId: string,
    reason: string,
    user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    const agent = await this.agentsRepository.findByOrgAndId(organizationId, agentId);
    if (!agent || agent.status !== 'active') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Agent must be active to suspend',
      });
    }

    const updated = await this.agentsRepository.update(agentId, { status: 'suspended' });
    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'agent.suspended',
      entityType: 'agent',
      entityId: agentId,
      eventHash: hashPayload({ agentId, reason }),
    });
    return this.toDto(updated!);
  }

  async revoke(
    organizationId: string,
    agentId: string,
    reason: string,
    user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    const agent = await this.agentsRepository.findByOrgAndId(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Agent not found',
      });
    }
    if (agent.status === 'revoked') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Agent already revoked',
      });
    }

    const updated = await this.agentsRepository.update(agentId, { status: 'revoked' });
    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'agent.revoked',
      entityType: 'agent',
      entityId: agentId,
      eventHash: hashPayload({ agentId, reason }),
    });
    return this.toDto(updated!);
  }

  toDto(agent: {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    status: string;
    agent_type: string;
    default_policy_id: string | null;
    public_slug?: string | null;
    metadata: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
  }): AgentResponseDto {
    return {
      id: agent.id,
      organizationId: agent.organization_id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      agentType: agent.agent_type,
      defaultPolicyId: agent.default_policy_id,
      publicSlug: agent.public_slug ?? null,
      metadata: agent.metadata,
      createdAt: agent.created_at.toISOString(),
      updatedAt: agent.updated_at.toISOString(),
    };
  }
}
