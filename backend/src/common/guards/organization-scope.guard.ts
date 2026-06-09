import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AUTH_USER_KEY,
  SECURITY_CONTEXT_KEY,
} from '../constants/auth.constants';
import { ErrorCodes } from '../constants/error-codes.constant';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { SecurityContext } from '../interfaces/security-context.interface';
import { OrganizationsRepository } from '../../database/repositories/organizations.repository';
import { AgentsRepository } from '../../database/repositories/agents.repository';

@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly agentsRepository: AgentsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { organizationId?: string; agentId?: string };
      [AUTH_USER_KEY]?: AuthenticatedUser;
      [SECURITY_CONTEXT_KEY]?: SecurityContext;
    }>();

    const organizationId = request.params.organizationId;
    if (!organizationId) {
      return true;
    }

    const org = await this.organizationsRepository.findById(organizationId);
    if (!org) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Organization not found',
      });
    }

    const security = request[SECURITY_CONTEXT_KEY];

    if (security?.authMethod === 'api_key' && security.apiKey) {
      if (security.apiKey.organizationId !== organizationId) {
        throw new ForbiddenException({
          code: ErrorCodes.FORBIDDEN,
          message: 'API key not scoped to this organization',
        });
      }
      if (request.params.agentId && security.apiKey.agentId) {
        if (security.apiKey.agentId !== request.params.agentId) {
          throw new ForbiddenException({
            code: ErrorCodes.FORBIDDEN,
            message: 'API key not scoped to this agent',
          });
        }
      }
      if (security) security.organizationId = organizationId;
      return true;
    }

    const user = request[AUTH_USER_KEY];
    if (!user) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Authentication required',
      });
    }

    if (user.isPlatformAdmin) {
      if (security) security.organizationId = organizationId;
      return true;
    }

    const membership = user.memberships.find(
      (m) => m.organizationId === organizationId && m.status === 'active',
    );

    if (!membership) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Not a member of this organization',
      });
    }

    if (request.params.agentId) {
      const agent = await this.agentsRepository.findByOrgAndId(
        organizationId,
        request.params.agentId,
      );
      if (!agent) {
        throw new NotFoundException({
          code: ErrorCodes.NOT_FOUND,
          message: 'Agent not found',
        });
      }
    }

    if (security) {
      security.organizationId = organizationId;
      security.roles = [membership.role];
    }

    return true;
  }
}
