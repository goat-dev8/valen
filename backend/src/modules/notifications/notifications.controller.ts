import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  NotificationResponseDto,
  UpdateNotificationDto,
} from './dto/notification.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('notifications')
@Controller('v1/organizations/:organizationId/notifications')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
  ) {
    return this.notificationsService.list(
      organizationId,
      { status, channel },
      pagination.page ?? 1,
      pagination.limit ?? 25,
    );
  }

  @Patch(':notificationId')
  @ApiOperation({ summary: 'Update notification status' })
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
    @Body() dto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.updateStatus(
      organizationId,
      notificationId,
      dto,
    );
  }
}
