import { Module } from '@nestjs/common';
import { AuditController, AuditExportController } from './audit.controller';
import { AuditService, AuditWorkerService } from './audit.service';

@Module({
  controllers: [AuditController, AuditExportController],
  providers: [AuditService, AuditWorkerService],
  exports: [AuditService, AuditWorkerService],
})
export class AuditModule {}
