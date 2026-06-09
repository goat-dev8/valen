import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService, ComplianceWorkerService } from './compliance.service';
import { QueuesModule } from '../../queues/queues.module';

@Module({
  imports: [QueuesModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceWorkerService],
  exports: [ComplianceService, ComplianceWorkerService],
})
export class ComplianceModule {}
