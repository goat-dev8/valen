import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import {
  NotificationsService,
  NotificationWorkerService,
} from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationWorkerService],
  exports: [NotificationsService, NotificationWorkerService],
})
export class NotificationsModule {}
