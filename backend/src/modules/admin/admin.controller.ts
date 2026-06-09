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
import {
  AdminService,
  DeadLetterService,
  EmergencyService,
} from './admin.service';
import {
  AdminOrganizationResponseDto,
  DeadLetterJobResponseDto,
  EmergencyActionDto,
  EmergencyActionResponseDto,
  ReplayDeadLetterDto,
  SuspendOrganizationDto,
} from './dto/admin.dto';
import { OrganizationResponseDto } from '../organizations/dto/organization.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('admin')
@Controller('v1/admin')
@UseGuards(PrivyAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly deadLetterService: DeadLetterService,
    private readonly emergencyService: EmergencyService,
  ) {}

  @Get('organizations')
  @Roles('platform_admin')
  @ApiOperation({ summary: 'List all organizations' })
  listOrganizations(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.adminService.listOrganizations({
      status,
      plan,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post('organizations/:organizationId/suspend')
  @Roles('platform_admin')
  @ApiOperation({ summary: 'Suspend organization' })
  suspend(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SuspendOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.adminService.suspendOrganization(organizationId, dto, user);
  }

  @Get('dead-letter-jobs')
  @Roles('platform_admin')
  @ApiOperation({ summary: 'List dead letter jobs' })
  listDeadLetter(
    @Query('queue') queue?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.deadLetterService.list({
      queue,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post('dead-letter-jobs/:jobId/replay')
  @Roles('platform_admin')
  @ApiOperation({ summary: 'Replay dead letter job' })
  replayDeadLetter(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: ReplayDeadLetterDto,
  ): Promise<DeadLetterJobResponseDto> {
    return this.deadLetterService.replay(jobId, dto);
  }

  @Post('emergency/pause')
  @Roles('platform_admin')
  @ApiOperation({ summary: 'Emergency pause' })
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EmergencyActionDto,
  ): Promise<EmergencyActionResponseDto> {
    return this.emergencyService.pause(dto, user);
  }

  @Post('emergency/unpause')
  @Roles('platform_admin')
  @ApiOperation({ summary: 'Emergency unpause' })
  unpause(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EmergencyActionDto,
  ): Promise<EmergencyActionResponseDto> {
    return this.emergencyService.unpause(dto, user);
  }
}
