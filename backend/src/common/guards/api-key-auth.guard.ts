import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  API_KEY_HEADER,
  SECURITY_CONTEXT_KEY,
} from '../constants/auth.constants';
import { ErrorCodes } from '../constants/error-codes.constant';
import { ApiKeysRepository } from '../../database/repositories/api-keys.repository';
import { sha256 } from '../utils/hash.util';
import { SecurityContext } from '../interfaces/security-context.interface';
import { PlatformRole } from '../constants/roles.constant';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeysRepository: ApiKeysRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      [SECURITY_CONTEXT_KEY]?: SecurityContext;
    }>();

    const rawKey = request.headers[API_KEY_HEADER];
    if (!rawKey) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Missing API key',
      });
    }

    const prefix = rawKey.slice(0, 12);
    const keyRow = await this.apiKeysRepository.findByPrefix(prefix);
    if (!keyRow) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid API key',
      });
    }

    if (sha256(rawKey) !== keyRow.key_hash) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid API key',
      });
    }

    if (keyRow.expires_at && keyRow.expires_at < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'API key expired',
      });
    }

    await this.apiKeysRepository.touchLastUsed(keyRow.id);

    const roles: PlatformRole[] = keyRow.agent_id
      ? ['agent']
      : ['service_account'];

    request[SECURITY_CONTEXT_KEY] = {
      authMethod: 'api_key',
      apiKey: {
        apiKeyId: keyRow.id,
        organizationId: keyRow.organization_id,
        agentId: keyRow.agent_id,
        scopes: keyRow.scopes,
      },
      organizationId: keyRow.organization_id,
      roles,
    };

    return true;
  }
}
