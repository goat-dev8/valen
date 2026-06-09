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
import { TeamService } from './team.service';
import {
  InviteMemberDto,
  TeamMemberResponseDto,
  UpdateTeamMemberDto,
} from './dto/team.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('organizations')
@Controller('v1/organizations/:organizationId/team')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @Roles('organization_owner', 'auditor')
  @ApiOperation({ summary: 'List team members' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.teamService.list(
      organizationId,
      pagination.page ?? 1,
      pagination.limit ?? 25,
    );
  }

  @Post('invitations')
  @Roles('organization_owner')
  @ApiOperation({ summary: 'Invite team member' })
  invite(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamService.invite(organizationId, dto, user);
  }

  @Patch(':memberId')
  @Roles('organization_owner')
  @ApiOperation({ summary: 'Update team member' })
  updateMember(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamService.updateMember(organizationId, memberId, dto, user);
  }
}
