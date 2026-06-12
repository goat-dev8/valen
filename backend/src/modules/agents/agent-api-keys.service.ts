import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiKeysRepository } from '../../database/repositories/api-keys.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
import { MandatesRepository } from '../../database/repositories/mandates.repository';
import {
  apiKeyPrefix,
  generateApiKeySecret,
  sha256,
} from '../../common/utils/hash.util';
import { hashPayload } from '../../common/utils/hash.util';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { ApiKeyResponseDto, CreateApiKeyDto } from './dto/agent.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

const VALID_SCOPES = [
  'executions:read',
  'executions:write',
  'agents:read',
  'settlements:read',
];

@Injectable()
export class AgentApiKeysService {
  constructor(
    private readonly apiKeysRepository: ApiKeysRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly mandatesRepository: MandatesRepository,
  ) {}

  async create(
    organizationId: string,
    agentId: string,
    dto: CreateApiKeyDto,
    user: AuthenticatedUser,
  ): Promise<ApiKeyResponseDto> {
    for (const scope of dto.scopes) {
      if (!VALID_SCOPES.includes(scope)) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: `Invalid scope: ${scope}`,
        });
      }
    }

    if (dto.scopes.includes('executions:write') && !dto.mandateId) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'API keys with executions:write scope require an active mandate',
      });
    }

    if (dto.mandateId) {
      const mandate = await this.mandatesRepository.findByOrgAndId(organizationId, dto.mandateId);
      if (!mandate || mandate.agent_id !== agentId || mandate.status !== 'active') {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'API key mandate must be active and belong to this agent',
        });
      }
    }

    const secret = generateApiKeySecret();
    const prefix = apiKeyPrefix(secret);
    const keyRow = await this.apiKeysRepository.create({
      organizationId,
      agentId,
      mandateId: dto.mandateId,
      name: dto.name,
      keyPrefix: prefix,
      keyHash: sha256(secret),
      scopes: dto.scopes,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      createdByUserId: user.id,
    });

    await this.auditLogsRepository.append({
      organizationId,
      actorType: 'user',
      actorId: user.id,
      action: 'api_key.created',
      entityType: 'api_key',
      entityId: keyRow.id,
      eventHash: hashPayload({ apiKeyId: keyRow.id }),
    });

    return {
      id: keyRow.id,
      name: keyRow.name,
      keyPrefix: keyRow.key_prefix,
      mandateId: keyRow.mandate_id,
      scopes: keyRow.scopes,
      status: keyRow.status,
      expiresAt: keyRow.expires_at?.toISOString() ?? null,
      createdAt: keyRow.created_at.toISOString(),
      oneTimeSecret: secret,
    };
  }

  async list(agentId: string): Promise<ApiKeyResponseDto[]> {
    const rows = await this.apiKeysRepository.listByAgent(agentId);
    return rows.map((keyRow) => ({
      id: keyRow.id,
      name: keyRow.name,
      keyPrefix: keyRow.key_prefix,
      mandateId: keyRow.mandate_id,
      scopes: keyRow.scopes,
      status: keyRow.status,
      expiresAt: keyRow.expires_at?.toISOString() ?? null,
      createdAt: keyRow.created_at.toISOString(),
    }));
  }
}
