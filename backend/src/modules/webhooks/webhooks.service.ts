import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WebhooksRepository } from '../../database/repositories/webhooks.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { sha256 } from '../../common/utils/hash.util';
import { randomBytes } from 'crypto';
import {
  ALLOWED_EVENTS,
  CreateWebhookDto,
  TestWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookTestResponseDto,
} from './dto/webhook.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class WebhooksService {
  constructor(private readonly webhooksRepository: WebhooksRepository) {}

  async create(
    organizationId: string,
    dto: CreateWebhookDto,
    user: AuthenticatedUser,
  ): Promise<WebhookResponseDto> {
    this.validateWebhook(dto.url, dto.subscribedEvents);

    const secret = randomBytes(32).toString('hex');
    const webhook = await this.webhooksRepository.create({
      organizationId,
      name: dto.name,
      url: dto.url,
      secretHash: sha256(secret),
      subscribedEvents: dto.subscribedEvents,
      createdByUserId: user.id,
    });

    return this.toDto(webhook);
  }

  async list(organizationId: string): Promise<WebhookResponseDto[]> {
    const webhooks = await this.webhooksRepository.list(organizationId);
    return webhooks.map((w) => this.toDto(w));
  }

  async update(
    organizationId: string,
    webhookId: string,
    dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.webhooksRepository.findById(webhookId);
    if (!webhook || webhook.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Webhook not found',
      });
    }

    if (dto.url || dto.subscribedEvents) {
      this.validateWebhook(
        dto.url ?? webhook.url,
        dto.subscribedEvents ?? webhook.subscribed_events,
      );
    }

    const updated = await this.webhooksRepository.update(webhookId, {
      name: dto.name,
      url: dto.url,
      subscribedEvents: dto.subscribedEvents,
      status: dto.status,
    });

    return this.toDto(updated!);
  }

  async disable(
    organizationId: string,
    webhookId: string,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.webhooksRepository.findById(webhookId);
    if (!webhook || webhook.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Webhook not found',
      });
    }

    const updated = await this.webhooksRepository.update(webhookId, {
      status: 'disabled',
    });
    return this.toDto(updated!);
  }

  async test(
    organizationId: string,
    webhookId: string,
    dto: TestWebhookDto,
  ): Promise<WebhookTestResponseDto> {
    const webhook = await this.webhooksRepository.findById(webhookId);
    if (!webhook || webhook.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Webhook not found',
      });
    }

    if (webhook.status !== 'active') {
      throw new BadRequestException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Webhook must be active',
      });
    }

    const eventName = dto.eventName ?? 'webhook.test';
    const delivery = await this.webhooksRepository.createDelivery({
      organizationId,
      webhookId,
      eventName,
    });

    let statusCode: number | null = null;
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, test: true }),
      });
      statusCode = response.status;
    } catch {
      statusCode = null;
    }

    return {
      deliveryId: delivery.id,
      status: statusCode && statusCode < 400 ? 'delivered' : 'failed',
      statusCode,
    };
  }

  private validateWebhook(url: string, events: string[]) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      throw new BadRequestException({
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Local URLs are not allowed',
      });
    }

    for (const event of events) {
      if (!ALLOWED_EVENTS.includes(event)) {
        throw new BadRequestException({
          code: ErrorCodes.VALIDATION_ERROR,
          message: `Event not in allowlist: ${event}`,
        });
      }
    }
  }

  toDto(webhook: {
    id: string;
    name: string;
    url: string;
    subscribed_events: string[];
    status: string;
    created_at: Date;
  }): WebhookResponseDto {
    return {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      subscribedEvents: webhook.subscribed_events,
      status: webhook.status,
      createdAt: webhook.created_at.toISOString(),
    };
  }
}
