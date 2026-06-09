import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrivyAuthGuard } from './privy-auth.guard';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { API_KEY_HEADER } from '../constants/auth.constants';
import { ErrorCodes } from '../constants/error-codes.constant';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly privyAuthGuard: PrivyAuthGuard,
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();

    if (request.headers.authorization?.startsWith('Bearer ')) {
      return this.privyAuthGuard.canActivate(context);
    }
    if (request.headers[API_KEY_HEADER]) {
      return this.apiKeyAuthGuard.canActivate(context);
    }

    throw new UnauthorizedException({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Authentication required',
    });
  }
}
