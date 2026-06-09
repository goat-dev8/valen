import { Global, Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { OrganizationsRepository } from './organizations.repository';
import { TeamMembersRepository } from './team-members.repository';
import { AgentsRepository } from './agents.repository';
import { AgentWalletsRepository } from './agent-wallets.repository';
import { ApiKeysRepository } from './api-keys.repository';
import { PoliciesRepository } from './policies.repository';
import { PolicyVersionsRepository } from './policy-versions.repository';
import { ExecutionsRepository } from './executions.repository';
import { ComplianceChecksRepository } from './compliance-checks.repository';
import { RiskScoresRepository } from './risk-scores.repository';
import { SettlementsRepository } from './settlements.repository';
import { AuditLogsRepository } from './audit-logs.repository';
import { NotificationsRepository } from './notifications.repository';
import { WebhooksRepository } from './webhooks.repository';
import { DeadLetterJobsRepository } from './dead-letter-jobs.repository';
import { EmergencyActionsRepository } from './emergency-actions.repository';

const repositories = [
  UsersRepository,
  OrganizationsRepository,
  TeamMembersRepository,
  AgentsRepository,
  AgentWalletsRepository,
  ApiKeysRepository,
  PoliciesRepository,
  PolicyVersionsRepository,
  ExecutionsRepository,
  ComplianceChecksRepository,
  RiskScoresRepository,
  SettlementsRepository,
  AuditLogsRepository,
  NotificationsRepository,
  WebhooksRepository,
  DeadLetterJobsRepository,
  EmergencyActionsRepository,
];

@Global()
@Module({
  providers: repositories,
  exports: repositories,
})
export class RepositoriesModule {}
