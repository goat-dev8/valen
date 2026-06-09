import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RepositoriesModule } from './database/repositories/repositories.module';
import { RedisModule } from './redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { GuardsModule } from './common/guards/guards.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { RiskModule } from './modules/risk/risk.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntentProcessor } from './queues/processors/intent.processor';
import { ComplianceProcessor } from './queues/processors/compliance.processor';
import { RiskProcessor } from './queues/processors/risk.processor';
import { PolicyProcessor } from './queues/processors/policy.processor';
import { SettlementProcessor } from './queues/processors/settlement.processor';
import { ConfirmationProcessor } from './queues/processors/confirmation.processor';
import { AuditProcessor } from './queues/processors/audit.processor';
import { NotificationProcessor } from './queues/processors/notification.processor';
import { VendorProcessor } from './queues/processors/vendor.processor';
import { IndexerProcessor } from './queues/processors/indexer.processor';
import { MaintenanceProcessor } from './queues/processors/maintenance.processor';
import { DeadLetterProcessor } from './queues/processors/dead-letter.processor';
import { ChainService, AlchemyService } from './modules/settlement/chain.service';

const processors = [
  IntentProcessor,
  ComplianceProcessor,
  RiskProcessor,
  PolicyProcessor,
  SettlementProcessor,
  ConfirmationProcessor,
  AuditProcessor,
  NotificationProcessor,
  VendorProcessor,
  IndexerProcessor,
  MaintenanceProcessor,
  DeadLetterProcessor,
];

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RepositoriesModule,
    RedisModule,
    QueuesModule,
    GuardsModule,
    ObservabilityModule,
    ComplianceModule,
    RiskModule,
    SettlementModule,
    AuditModule,
    NotificationsModule,
  ],
  providers: [...processors, ChainService, AlchemyService],
})
export class WorkerModule {}
