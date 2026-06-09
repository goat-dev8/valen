import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PlatformRole } from '../constants/roles.constant';
import {
  AUTH_USER_KEY,
  SECURITY_CONTEXT_KEY,
} from '../constants/auth.constants';
import { ErrorCodes } from '../constants/error-codes.constant';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { SecurityContext } from '../interfaces/security-context.interface';
import { TeamMembersRepository } from '../../database/repositories/team-members.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly teamMembersRepository: TeamMembersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      params: { organizationId?: string };
      [AUTH_USER_KEY]?: AuthenticatedUser;
      [SECURITY_CONTEXT_KEY]?: SecurityContext;
    }>();

    const security = request[SECURITY_CONTEXT_KEY];
    const organizationId =
      request.params.organizationId ?? security?.organizationId;

    if (security?.authMethod === 'api_key' && security.apiKey) {
      const apiRoles = security.roles;
      if (requiredRoles.some((r) => apiRoles.includes(r))) {
        return true;
      }
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Insufficient permissions',
      });
    }

    const user = request[AUTH_USER_KEY];
    if (!user) {
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Authentication required',
      });
    }

    if (user.isPlatformAdmin && requiredRoles.includes('platform_admin')) {
      return true;
    }

    if (!organizationId) {
      if (requiredRoles.includes('platform_admin') && user.isPlatformAdmin) {
        return true;
      }
      throw new ForbiddenException({
        code: ErrorCodes.FORBIDDEN,
        message: 'Organization context required',
      });
    }

    const membership = user.memberships.find(
      (m) =>
        m.organizationId === organizationId &&
        m.status === 'active' &&
        requiredRoles.includes(m.role),
    );

    if (membership) {
      if (security) {
        security.organizationId = organizationId;
        security.roles = [membership.role];
      }
      return true;
    }

    throw new ForbiddenException({
      code: ErrorCodes.FORBIDDEN,
      message: 'Insufficient permissions',
    });
  }
}
