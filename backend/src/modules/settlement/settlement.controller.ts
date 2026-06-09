import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExecutionsService } from './executions.service';
import { SettlementService } from './settlement.service';
import {
  ApprovalRequestDto,
  AuditTimelineEventDto,
  CancelExecutionDto,
  CreateExecutionDto,
  ExecutionResponseDto,
  RetrySettlementDto,
  SettlementResponseDto,
  SettleRequestDto,
} from './dto/settlement.dto';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-api-key.guard';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('executions')
@Controller('v1/organizations/:organizationId/executions')
@UseGuards(JwtOrApiKeyGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Post()
  @Roles('agent', 'developer', 'service_account')
  @ApiOperation({ summary: 'Create execution' })
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateExecutionDto,
  ): Promise<ExecutionResponseDto> {
    return this.executionsService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List executions' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.executionsService.list(
      organizationId,
      { status, agentId, from, to },
      Number(page),
      Number(limit),
    );
  }

  @Get(':executionId')
  @ApiOperation({ summary: 'Get execution' })
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ): Promise<ExecutionResponseDto> {
    return this.executionsService.get(organizationId, executionId);
  }

  @Post(':executionId/cancel')
  @Roles('agent', 'settlement_operator', 'organization_owner')
  @ApiOperation({ summary: 'Cancel execution' })
  cancel(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @Body() dto: CancelExecutionDto,
  ): Promise<ExecutionResponseDto> {
    return this.executionsService.cancel(organizationId, executionId, dto);
  }

  @Get(':executionId/timeline')
  @UseGuards(PrivyAuthGuard)
  @Roles('auditor', 'organization_owner', 'compliance_officer', 'risk_officer')
  @ApiOperation({ summary: 'Get execution audit timeline' })
  timeline(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ): Promise<AuditTimelineEventDto[]> {
    return this.executionsService.timeline(organizationId, executionId);
  }
}

@ApiTags('settlement')
@Controller('v1/organizations/:organizationId')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('executions/:executionId/settlement')
  @Roles('settlement_operator', 'auditor', 'organization_owner')
  @ApiOperation({ summary: 'Get execution settlement' })
  getSettlement(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ): Promise<SettlementResponseDto> {
    return this.settlementService.getSettlement(organizationId, executionId);
  }

  @Post('executions/:executionId/approve')
  @Roles('settlement_operator', 'organization_owner')
  @ApiOperation({ summary: 'Approve or reject execution' })
  approve(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApprovalRequestDto,
  ) {
    return this.settlementService.approve(organizationId, executionId, dto, user);
  }

  @Post('executions/:executionId/settle')
  @Roles('settlement_operator', 'service_account')
  @ApiOperation({ summary: 'Trigger settlement' })
  settle(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @Body() dto: SettleRequestDto,
  ): Promise<SettlementResponseDto> {
    return this.settlementService.settle(organizationId, executionId, dto);
  }

  @Post('settlements/:settlementId/retry')
  @Roles('settlement_operator')
  @ApiOperation({ summary: 'Retry failed settlement' })
  retry(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('settlementId', ParseUUIDPipe) settlementId: string,
    @Body() dto: RetrySettlementDto,
  ): Promise<SettlementResponseDto> {
    return this.settlementService.retry(organizationId, settlementId, dto);
  }
}
