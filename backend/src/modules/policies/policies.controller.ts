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
import { PoliciesService } from './policies.service';
import { PolicyVersionsService } from './policy-versions.service';
import {
  CreatePolicyDto,
  CreatePolicyVersionDto,
  PolicyCommentDto,
  PolicyResponseDto,
  PolicyVersionResponseDto,
} from './dto/policy.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('policies')
@Controller('v1/organizations/:organizationId/policies')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(
    private readonly policiesService: PoliciesService,
    private readonly policyVersionsService: PolicyVersionsService,
  ) {}

  @Post()
  @Roles('policy_manager', 'organization_owner')
  @ApiOperation({ summary: 'Create policy' })
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePolicyDto,
  ): Promise<PolicyResponseDto> {
    return this.policiesService.create(organizationId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List policies' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('status') status?: string,
  ): Promise<PolicyResponseDto[]> {
    return this.policiesService.list(organizationId, status);
  }

  @Get(':policyId')
  @ApiOperation({ summary: 'Get policy with versions' })
  async get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
  ) {
    const policy = await this.policiesService.get(organizationId, policyId);
    const versions = await this.policyVersionsService.listVersions(policyId);
    return { ...policy, versions };
  }

  @Post(':policyId/versions')
  @Roles('policy_manager')
  @ApiOperation({ summary: 'Create policy version' })
  createVersion(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePolicyVersionDto,
  ): Promise<PolicyVersionResponseDto> {
    return this.policyVersionsService.createVersion(
      organizationId,
      policyId,
      dto,
      user,
    );
  }

  @Post(':policyId/versions/:versionId/submit')
  @Roles('policy_manager')
  @ApiOperation({ summary: 'Submit policy version for approval' })
  submit(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() _dto: PolicyCommentDto,
  ): Promise<PolicyVersionResponseDto> {
    return this.policyVersionsService.submit(
      organizationId,
      policyId,
      versionId,
      user,
    );
  }

  @Post(':policyId/versions/:versionId/publish')
  @Roles('policy_manager', 'organization_owner')
  @ApiOperation({ summary: 'Publish policy version' })
  publish(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PolicyCommentDto,
  ): Promise<PolicyVersionResponseDto> {
    return this.policyVersionsService.publish(
      organizationId,
      policyId,
      versionId,
      dto,
      user,
    );
  }

  @Post(':policyId/versions/:versionId/activate')
  @Roles('organization_owner')
  @ApiOperation({ summary: 'Activate policy version' })
  activate(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('policyId', ParseUUIDPipe) policyId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PolicyCommentDto,
  ): Promise<PolicyResponseDto> {
    return this.policyVersionsService.activate(
      organizationId,
      policyId,
      versionId,
      dto,
      user,
    );
  }
}
