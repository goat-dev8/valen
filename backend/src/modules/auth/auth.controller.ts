import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthSyncDto } from './dto/auth-sync.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ErrorCodes } from '../../common/constants/error-codes.constant';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Privy user profile (creates user on first login)' })
  async sync(
    @Headers('authorization') authorization: string,
    @Body() dto: AuthSyncDto,
  ): Promise<MeResponseDto> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Missing Bearer token',
      });
    }
    const token = authorization.slice(7);
    return this.authService.sync(token, dto);
  }
}

@ApiTags('auth')
@Controller('v1')
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(PrivyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return this.authService.getMe(user);
  }
}
