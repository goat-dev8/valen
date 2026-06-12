import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RepositoriesModule } from './database/repositories/repositories.module';
import { RedisModule } from './redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import {
  DlqMonitorJob,
  MandateExpiryJob,
  SchedulerRunner,
  SettlementReconciliationJob,
  StylusKeepaliveJob,
  VendorCacheExpiryJob,
} from './scheduler/jobs/scheduler.jobs';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RepositoriesModule,
    RedisModule,
    QueuesModule,
    ObservabilityModule,
  ],
  providers: [
    MandateExpiryJob,
    SettlementReconciliationJob,
    StylusKeepaliveJob,
    DlqMonitorJob,
    VendorCacheExpiryJob,
    SchedulerRunner,
  ],
})
export class SchedulerModule {}
