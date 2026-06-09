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
import { AuditService } from './audit.service';
import {
  AuditExportDto,
  AuditExportResponseDto,
  AuditLogResponseDto,
} from './dto/audit.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('audit')
@Controller('v1/organizations/:organizationId/audit-logs')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('auditor', 'organization_owner', 'compliance_officer')
  @ApiOperation({ summary: 'List audit logs' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() pagination: PaginationQueryDto,
    @Query('entityType') entityType?: string,
    @Query('actor') actor?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.list(
      organizationId,
      { entityType, actor, from, to },
      pagination.page ?? 1,
      pagination.limit ?? 25,
    );
  }

  @Get(':auditLogId')
  @Roles('auditor', 'organization_owner', 'compliance_officer')
  @ApiOperation({ summary: 'Get audit log' })
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('auditLogId', ParseUUIDPipe) auditLogId: string,
  ): Promise<AuditLogResponseDto> {
    return this.auditService.get(organizationId, auditLogId);
  }
}

@ApiTags('audit')
@Controller('v1/organizations/:organizationId/audit-exports')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class AuditExportController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @Roles('auditor', 'organization_owner')
  @ApiOperation({ summary: 'Request audit export' })
  export(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AuditExportDto,
  ): Promise<AuditExportResponseDto> {
    return this.auditService.export(organizationId, dto, user);
  }
}
