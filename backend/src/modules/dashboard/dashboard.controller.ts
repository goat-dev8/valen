import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-api-key.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('v1/organizations/:organizationId/dashboard')
@UseGuards(JwtOrApiKeyGuard, OrganizationScopeGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get Mission Control summary' })
  summary(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.dashboardService.summary(organizationId);
  }
}
