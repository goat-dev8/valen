import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SECURITY_CONTEXT_KEY } from '../constants/auth.constants';
import { SecurityContext } from '../interfaces/security-context.interface';

export const CurrentOrganization = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    const security = request[SECURITY_CONTEXT_KEY] as SecurityContext;
    if (security?.organizationId) {
      return security.organizationId;
    }
    const params = request.params as Record<string, string>;
    return params.organizationId;
  },
);
