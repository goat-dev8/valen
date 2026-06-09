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
import { ComplianceService } from './compliance.service';
import {
  ComplianceAttestationResponseDto,
  ComplianceCheckResponseDto,
  ComplianceSubjectResponseDto,
  CreateAttestationDto,
} from './dto/compliance.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('compliance')
@Controller('v1/organizations/:organizationId')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('executions/:executionId/compliance')
  @Roles('compliance_officer', 'auditor', 'organization_owner')
  @ApiOperation({ summary: 'Get execution compliance checks' })
  getChecks(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('executionId', ParseUUIDPipe) executionId: string,
  ): Promise<ComplianceCheckResponseDto[]> {
    return this.complianceService.getExecutionChecks(organizationId, executionId);
  }

  @Post('compliance/attestations')
  @Roles('compliance_officer')
  @ApiOperation({ summary: 'Create compliance attestation' })
  createAttestation(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttestationDto,
  ): Promise<ComplianceAttestationResponseDto> {
    return this.complianceService.createAttestation(organizationId, dto, user);
  }

  @Get('compliance/subjects/:subjectRef')
  @Roles('compliance_officer', 'auditor', 'organization_owner')
  @ApiOperation({ summary: 'Get compliance subject profile' })
  getSubject(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('subjectRef') subjectRef: string,
  ): Promise<ComplianceSubjectResponseDto> {
    return this.complianceService.getSubject(organizationId, subjectRef);
  }
}
