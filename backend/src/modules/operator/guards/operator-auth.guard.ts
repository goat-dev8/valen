import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/config.types';

export const OPERATOR_KEY_HEADER = 'x-operator-key';

@Injectable()
export class OperatorAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get('operatorDashboardSecret', {
      infer: true,
    });
    if (!secret) {
      throw new UnauthorizedException(
        'OPERATOR_DASHBOARD_SECRET is not configured on the backend',
      );
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const provided = request.headers[OPERATOR_KEY_HEADER];
    if (!provided || provided !== secret) {
      throw new UnauthorizedException('Invalid operator dashboard key');
    }

    return true;
  }
}
