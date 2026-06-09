import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/config.types';
import {
  AUTH_USER_KEY,
  SECURITY_CONTEXT_KEY,
} from '../constants/auth.constants';
import { ErrorCodes } from '../constants/error-codes.constant';
import { UsersRepository } from '../../database/repositories/users.repository';
import { SecurityContext } from '../interfaces/security-context.interface';

type PrivyAuthClient = {
  verifyAuthToken(token: string): Promise<{ userId: string }>;
};

@Injectable()
export class PrivyAuthGuard implements CanActivate {
  private privy: PrivyAuthClient | null = null;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      [AUTH_USER_KEY]?: unknown;
      [SECURITY_CONTEXT_KEY]?: SecurityContext;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Missing Bearer token',
      });
    }

    const token = authHeader.slice(7);
    let claims: { userId: string };
    try {
      claims = await (await this.getPrivy()).verifyAuthToken(token);
    } catch {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Invalid or expired token',
      });
    }

    const userRow = await this.usersRepository.findByPrivyUserId(claims.userId);
    if (!userRow || userRow.status !== 'active') {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'User not found or inactive',
      });
    }

    const memberships = await this.usersRepository.getMemberships(userRow.id);
    const isPlatformAdmin = await this.usersRepository.isPlatformAdmin(userRow.id);
    const user = this.usersRepository.toAuthenticatedUser(
      userRow,
      memberships,
      isPlatformAdmin,
    );

    request[AUTH_USER_KEY] = user;
    request[SECURITY_CONTEXT_KEY] = {
      authMethod: 'privy',
      user,
      roles: memberships.map((m) => m.role),
    };

    return true;
  }

  private async getPrivy(): Promise<PrivyAuthClient> {
    if (!this.privy) {
      const { PrivyClient } = await import('@privy-io/server-auth');
      this.privy = new PrivyClient(
        this.configService.get('privyAppId', { infer: true }),
        this.configService.get('privyAppSecret', { infer: true }),
      );
    }

    return this.privy;
  }
}
