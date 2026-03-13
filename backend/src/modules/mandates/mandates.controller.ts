import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  CreateSignedMandateDto,
  MandateResponseDto,
  MandateTypedDataRequestDto,
  MandateTypedDataResponseDto,
  RevokeMandateDto,
} from './dto/mandate.dto';
import { MandatesService } from './mandates.service';

@ApiTags('mandates')
@Controller('v1/organizations/:organizationId/mandates')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  @Get()
  @ApiOperation({ summary: 'List signed mandates' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<MandateResponseDto[]> {
    return this.mandatesService.list(organizationId);
  }

  @Post('typed-data')
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Build mandate EIP-712 typed data' })
  typedData(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: MandateTypedDataRequestDto,
  ): Promise<MandateTypedDataResponseDto> {
    return this.mandatesService.typedData(organizationId, dto);
  }

  @Post()
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Create signed mandate' })
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSignedMandateDto,
  ): Promise<MandateResponseDto> {
    return this.mandatesService.create(organizationId, dto, user);
  }

  @Post(':mandateId/revoke')
  @Roles('organization_owner')
  @ApiOperation({ summary: 'Revoke signed mandate' })
  revoke(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('mandateId', ParseUUIDPipe) mandateId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RevokeMandateDto,
  ): Promise<MandateResponseDto> {
    return this.mandatesService.revoke(organizationId, mandateId, dto, user);
  }
}
