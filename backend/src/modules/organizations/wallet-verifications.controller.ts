import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  WalletChallengeDto,
  WalletChallengeResponseDto,
  WalletVerificationResponseDto,
  WalletVerifyDto,
} from './dto/wallet-verification.dto';
import { WalletVerificationsService } from './wallet-verifications.service';

@ApiTags('wallets')
@Controller('v1/organizations/:organizationId/wallets')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class WalletVerificationsController {
  constructor(private readonly walletVerificationsService: WalletVerificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List verified organization wallets' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<WalletVerificationResponseDto[]> {
    return this.walletVerificationsService.list(organizationId);
  }

  @Post('challenge')
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Create wallet ownership challenge' })
  createChallenge(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WalletChallengeDto,
  ): Promise<WalletChallengeResponseDto> {
    return this.walletVerificationsService.createChallenge(organizationId, dto, user);
  }

  @Post('verify')
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Verify wallet ownership signature' })
  verify(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WalletVerifyDto,
  ): Promise<WalletVerificationResponseDto> {
    return this.walletVerificationsService.verify(organizationId, dto, user);
  }
}
