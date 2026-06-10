import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RepositoriesModule } from './database/repositories/repositories.module';
import { RedisModule } from './redis/redis.module';
import { QueuesModule } from './queues/queues.module';
import { GuardsModule } from './common/guards/guards.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { RiskModule } from './modules/risk/risk.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { OperatorModule } from './modules/operator/operator.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RepositoriesModule,
    RedisModule,
    QueuesModule,
    GuardsModule,
    ObservabilityModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    AgentsModule,
    PoliciesModule,
    ComplianceModule,
    RiskModule,
    SettlementModule,
    AuditModule,
    NotificationsModule,
    WebhooksModule,
    AdminModule,
    OperatorModule,
  ],
})
export class AppModule {}
