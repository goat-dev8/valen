import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiKeysRepository } from '../../database/repositories/api-keys.repository';
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository';
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

    const secret = generateApiKeySecret();
    const prefix = apiKeyPrefix(secret);
    const keyRow = await this.apiKeysRepository.create({
      organizationId,
      agentId,
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
      scopes: keyRow.scopes,
      status: keyRow.status,
      expiresAt: keyRow.expires_at?.toISOString() ?? null,
      createdAt: keyRow.created_at.toISOString(),
      oneTimeSecret: secret,
    };
  }
}
