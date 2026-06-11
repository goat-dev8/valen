import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AgentWalletsService } from './agent-wallets.service';
import { AgentApiKeysService } from './agent-api-keys.service';
import {
  AgentResponseDto,
  AgentWalletResponseDto,
  ApiKeyResponseDto,
  CreateAgentDto,
  CreateApiKeyDto,
  LinkWalletDto,
  ReasonDto,
  UpdateAgentDto,
} from './dto/agent.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-api-key.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('agents')
@Controller('v1/organizations/:organizationId/agents')
@UseGuards(JwtOrApiKeyGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly agentWalletsService: AgentWalletsService,
    private readonly agentApiKeysService: AgentApiKeysService,
  ) {}

  @Post()
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Create agent' })
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAgentDto,
  ): Promise<AgentResponseDto> {
    return this.agentsService.create(organizationId, dto, user);
  }

  @Get()
  @UseGuards(PrivyAuthGuard)
  @ApiOperation({ summary: 'List agents' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.agentsService.list(
      organizationId,
      { status, type },
      Number(page),
      Number(limit),
    );
  }

  @Get(':agentId')
  @ApiOperation({ summary: 'Get agent' })
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
  ): Promise<AgentResponseDto> {
    return this.agentsService.get(organizationId, agentId);
  }

  @Patch(':agentId')
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Update agent' })
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    return this.agentsService.update(organizationId, agentId, dto, user);
  }

  @Post(':agentId/wallets')
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Link agent wallet' })
  linkWallet(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @Body() dto: LinkWalletDto,
  ): Promise<AgentWalletResponseDto> {
    return this.agentWalletsService.linkWallet(organizationId, agentId, dto);
  }

  @Post(':agentId/activate')
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Activate agent' })
  activate(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    return this.agentsService.activate(organizationId, agentId, user);
  }

  @Post(':agentId/suspend')
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner', 'compliance_officer')
  @ApiOperation({ summary: 'Suspend agent' })
  suspend(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReasonDto,
  ): Promise<AgentResponseDto> {
    return this.agentsService.suspend(organizationId, agentId, dto.reason, user);
  }

  @Post(':agentId/revoke')
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner')
  @ApiOperation({ summary: 'Revoke agent' })
  revoke(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReasonDto,
  ): Promise<AgentResponseDto> {
    return this.agentsService.revoke(organizationId, agentId, dto.reason, user);
  }

  @Post(':agentId/api-keys')
  @UseGuards(PrivyAuthGuard)
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Create agent API key' })
  createApiKey(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.agentApiKeysService.create(organizationId, agentId, dto, user);
  }
}
