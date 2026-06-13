import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-api-key.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BudgetService } from './budget.service';

@ApiTags('budget')
@Controller('v1/organizations/:organizationId/budget')
@UseGuards(JwtOrApiKeyGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get(':agentId')
  @ApiOperation({ summary: 'Get live budget meter for an agent' })
  getBudget(@Param('agentId', ParseUUIDPipe) agentId: string) {
    return this.budgetService.getBudget(agentId);
  }

  @Get(':agentId/events')
  @ApiOperation({ summary: 'Get recent budget events for an agent' })
  getEvents(@Param('agentId', ParseUUIDPipe) agentId: string) {
    return this.budgetService.getEvents(agentId);
  }

  @Post(':agentId/topup')
  @Roles('organization_owner', 'settlement_operator', 'developer')
  @ApiOperation({ summary: 'Configure or top up an agent budget in base units' })
  topUp(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @Body() body: { chainId: number; assetAddress: string; assetSymbol: string; cap: string },
  ) {
    return this.budgetService.topUp({
      organizationId,
      agentId,
      chainId: Number(body.chainId),
      assetAddress: body.assetAddress,
      assetSymbol: body.assetSymbol,
      cap: body.cap,
    });
  }
}
