import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import {
  CreateWebhookDto,
  TestWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookTestResponseDto,
} from './dto/webhook.dto';
import { PrivyAuthGuard } from '../../common/guards/privy-auth.guard';
import { OrganizationScopeGuard } from '../../common/guards/organization-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('webhooks')
@Controller('v1/organizations/:organizationId/webhooks')
@UseGuards(PrivyAuthGuard, OrganizationScopeGuard, RolesGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Create webhook' })
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.create(organizationId, dto, user);
  }

  @Get()
  @Roles('organization_owner', 'developer', 'auditor')
  @ApiOperation({ summary: 'List webhooks' })
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<WebhookResponseDto[]> {
    return this.webhooksService.list(organizationId);
  }

  @Patch(':webhookId')
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Update webhook' })
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.update(organizationId, webhookId, dto);
  }

  @Delete(':webhookId')
  @Roles('organization_owner')
  @ApiOperation({ summary: 'Disable webhook' })
  remove(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.disable(organizationId, webhookId);
  }

  @Post(':webhookId/test')
  @Roles('organization_owner', 'developer')
  @ApiOperation({ summary: 'Test webhook delivery' })
  test(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
    @Body() dto: TestWebhookDto,
  ): Promise<WebhookTestResponseDto> {
    return this.webhooksService.test(organizationId, webhookId, dto);
  }
}
