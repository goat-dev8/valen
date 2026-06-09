import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RiskService } from './risk.service';
import {
  RecalculateRiskDto,
  RiskModelResponseDto,
  RiskScoreResponseDto,
} from './dto/risk.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('risk')
@Controller('v1/organizations/:organizationId')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('executions/:executionId/risk')
  @Roles('risk_officer', 'auditor', 'organization_owner')
  @ApiOperation({ summary: 'Get execution risk score' })
  getScore(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ): Promise<RiskScoreResponseDto> {
    return this.riskService.getScore(organizationId, executionId);
  }

  @Post('executions/:executionId/risk/recalculate')
  @Roles('risk_officer')
  @ApiOperation({ summary: 'Recalculate execution risk' })
  recalculate(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
    @Body() dto: RecalculateRiskDto,
  ): Promise<RiskScoreResponseDto> {
    return this.riskService.recalculate(organizationId, executionId, dto);
  }

  @Get('risk/models')
  @Roles('risk_officer', 'auditor', 'organization_owner')
  @ApiOperation({ summary: 'List risk models' })
  listModels(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<RiskModelResponseDto[]> {
    return this.riskService.listModels(organizationId);
  }
}
