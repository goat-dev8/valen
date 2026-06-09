import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../../database/repositories/notifications.repository';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import {
  NotificationResponseDto,
  UpdateNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async list(
    organizationId: string,
    filters: { status?: string; channel?: string },
    page: number,
    limit: number,
  ) {
    const { items, total } = await this.notificationsRepository.list(
      organizationId,
      filters,
      page,
      limit,
    );
    return {
      items: items.map((n) => this.toDto(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async updateStatus(
    organizationId: string,
    notificationId: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.findById(
      notificationId,
    );
    if (!notification || notification.organization_id !== organizationId) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Notification not found',
      });
    }

    const allowed: Record<string, string[]> = {
      queued: ['sent', 'suppressed'],
      sent: ['delivered', 'failed'],
      delivered: [],
      failed: ['queued'],
      suppressed: [],
    };

    const transitions = allowed[notification.status] ?? [];
    if (!transitions.includes(dto.status)) {
      throw new NotFoundException({
        code: ErrorCodes.DOMAIN_REJECTED,
        message: 'Invalid status transition',
      });
    }

    const updated = await this.notificationsRepository.updateStatus(
      notificationId,
      dto.status,
    );
    return this.toDto(updated!);
  }

  toDto(n: {
    id: string;
    channel: string;
    template: string;
    status: string;
    priority: string;
    created_at: Date;
  }): NotificationResponseDto {
    return {
      id: n.id,
      channel: n.channel,
      template: n.template,
      status: n.status,
      priority: n.priority,
      createdAt: n.created_at.toISOString(),
    };
  }
}

@Injectable()
export class NotificationWorkerService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async deliver(payload: {
    organizationId: string;
    recipientType: string;
    recipientRef: string;
    channel: string;
    template: string;
  }): Promise<void> {
    const notification = await this.notificationsRepository.create({
      organizationId: payload.organizationId,
      recipientType: payload.recipientType,
      recipientRef: payload.recipientRef,
      channel: payload.channel,
      template: payload.template,
    });
    await this.notificationsRepository.updateStatus(notification.id, 'sent');
  }
}
