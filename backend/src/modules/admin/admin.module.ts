import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import {
  AdminService,
  DeadLetterService,
  EmergencyService,
} from './admin.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [AdminController],
  providers: [AdminService, DeadLetterService, EmergencyService],
})
export class AdminModule {}
