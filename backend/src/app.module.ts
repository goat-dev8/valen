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
import { MandatesModule } from './modules/mandates/mandates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { OperatorModule } from './modules/operator/operator.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AssetsModule } from './modules/assets/assets.module';
import { RobinhoodModule } from './modules/robinhood/robinhood.module';
import { Erc8004Module } from './modules/erc8004/erc8004.module';
import { BudgetModule } from './modules/budget/budget.module';
import { X402Module } from './modules/x402/x402.module';
import { ProofsModule } from './modules/proofs/proofs.module';

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
    MandatesModule,
    NotificationsModule,
    WebhooksModule,
    AdminModule,
    OperatorModule,
    DashboardModule,
    AssetsModule,
    RobinhoodModule,
    Erc8004Module,
    BudgetModule,
    X402Module,
    ProofsModule,
  ],
})
export class AppModule {}
