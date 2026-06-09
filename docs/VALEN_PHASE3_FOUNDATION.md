# VALEN Phase 3 — Foundation Implementation

**Status:** Foundation scaffolding specification.  
**Deliverable:** This document defines every file, folder, module, pipeline, and completion criterion required to scaffold the repository.  
**Non-goals:** No business logic. No Solidity source. No Rust source. Implementation follows this document file-by-file.

---

# SECTION 1 — Repository Tree

```text
valen/
├── .editorconfig
├── .gitignore
├── .nvmrc
├── LICENSE
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── README.md
│
├── frontend/
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .gitignore
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.svg
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── globals.css
│       │   ├── login/
│       │   │   └── page.tsx
│       │   ├── dashboard/
│       │   │   └── page.tsx
│       │   └── organizations/
│       │       └── [organizationId]/
│       │           ├── layout.tsx
│       │           ├── page.tsx
│       │           ├── agents/
│       │           │   ├── page.tsx
│       │           │   ├── new/
│       │           │   │   └── page.tsx
│       │           │   └── [agentId]/
│       │           │       └── page.tsx
│       │           ├── policies/
│       │           │   ├── page.tsx
│       │           │   ├── new/
│       │           │   │   └── page.tsx
│       │           │   └── [policyId]/
│       │           │       └── page.tsx
│       │           ├── executions/
│       │           │   ├── page.tsx
│       │           │   ├── new/
│       │           │   │   └── page.tsx
│       │           │   └── [executionId]/
│       │           │       └── page.tsx
│       │           ├── approvals/
│       │           │   └── page.tsx
│       │           ├── audit/
│       │           │   └── page.tsx
│       │           ├── webhooks/
│       │           │   └── page.tsx
│       │           ├── team/
│       │           │   └── page.tsx
│       │           └── settings/
│       │               └── page.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Header.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Card.tsx
│       │       └── Badge.tsx
│       ├── lib/
│       │   ├── api-client.ts
│       │   ├── privy.ts
│       │   └── constants.ts
│       ├── hooks/
│       │   └── useAuth.ts
│       └── types/
│           └── api.ts
│
├── backend/
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── jest.config.ts
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   ├── Dockerfile.scheduler
│   └── src/
│       ├── main.ts
│       ├── worker.ts
│       ├── scheduler.ts
│       ├── app.module.ts
│       ├── worker.module.ts
│       ├── scheduler.module.ts
│       ├── common/
│       │   ├── constants/
│       │   │   ├── index.ts
│       │   │   ├── queues.constant.ts
│       │   │   ├── roles.constant.ts
│       │   │   └── error-codes.constant.ts
│       │   ├── decorators/
│       │   │   ├── current-user.decorator.ts
│       │   │   ├── current-organization.decorator.ts
│       │   │   ├── roles.decorator.ts
│       │   │   └── idempotency-key.decorator.ts
│       │   ├── dto/
│       │   │   ├── pagination.dto.ts
│       │   │   ├── api-response.dto.ts
│       │   │   └── error-response.dto.ts
│       │   ├── enums/
│       │   │   ├── execution-status.enum.ts
│       │   │   ├── risk-tier.enum.ts
│       │   │   ├── role.enum.ts
│       │   │   └── settlement-status.enum.ts
│       │   ├── exceptions/
│       │   │   ├── domain-rejected.exception.ts
│       │   │   └── vendor-unavailable.exception.ts
│       │   ├── filters/
│       │   │   ├── all-exceptions.filter.ts
│       │   │   └── http-exception.filter.ts
│       │   ├── guards/
│       │   │   ├── privy-auth.guard.ts
│       │   │   ├── api-key-auth.guard.ts
│       │   │   ├── roles.guard.ts
│       │   │   └── organization-scope.guard.ts
│       │   ├── interceptors/
│       │   │   ├── request-id.interceptor.ts
│       │   │   ├── logging.interceptor.ts
│       │   │   └── transform-response.interceptor.ts
│       │   ├── interfaces/
│       │   │   ├── authenticated-user.interface.ts
│       │   │   ├── security-context.interface.ts
│       │   │   └── paginated-result.interface.ts
│       │   └── utils/
│       │       ├── hash.util.ts
│       │       └── id.util.ts
│       ├── config/
│       │   ├── config.module.ts
│       │   ├── configuration.ts
│       │   ├── env.validation.ts
│       │   └── config.types.ts
│       ├── database/
│       │   ├── database.module.ts
│       │   ├── database.service.ts
│       │   ├── database.constants.ts
│       │   └── repositories/
│       │       ├── base.repository.ts
│       │       ├── users.repository.ts
│       │       ├── organizations.repository.ts
│       │       ├── team-members.repository.ts
│       │       ├── agents.repository.ts
│       │       ├── agent-wallets.repository.ts
│       │       ├── api-keys.repository.ts
│       │       ├── policies.repository.ts
│       │       ├── policy-versions.repository.ts
│       │       ├── executions.repository.ts
│       │       ├── compliance-checks.repository.ts
│       │       ├── risk-scores.repository.ts
│       │       ├── settlements.repository.ts
│       │       ├── audit-logs.repository.ts
│       │       ├── notifications.repository.ts
│       │       ├── webhooks.repository.ts
│       │       ├── dead-letter-jobs.repository.ts
│       │       └── emergency-actions.repository.ts
│       ├── redis/
│       │   ├── redis.module.ts
│       │   ├── redis.service.ts
│       │   └── redis.constants.ts
│       ├── queues/
│       │   ├── queues.module.ts
│       │   ├── queues.constants.ts
│       │   ├── bullmq.config.ts
│       │   ├── processors/
│       │   │   ├── intent.processor.ts
│       │   │   ├── compliance.processor.ts
│       │   │   ├── risk.processor.ts
│       │   │   ├── policy.processor.ts
│       │   │   ├── settlement.processor.ts
│       │   │   ├── confirmation.processor.ts
│       │   │   ├── audit.processor.ts
│       │   │   ├── notification.processor.ts
│       │   │   ├── vendor.processor.ts
│       │   │   ├── indexer.processor.ts
│       │   │   └── maintenance.processor.ts
│       │   └── producers/
│       │       ├── intent.producer.ts
│       │       ├── compliance.producer.ts
│       │       ├── risk.producer.ts
│       │       ├── policy.producer.ts
│       │       ├── settlement.producer.ts
│       │       ├── audit.producer.ts
│       │       └── notification.producer.ts
│       ├── modules/
│       │   ├── health/
│       │   │   ├── health.module.ts
│       │   │   ├── health.controller.ts
│       │   │   └── health.service.ts
│       │   ├── observability/
│       │   │   ├── observability.module.ts
│       │   │   ├── sentry/
│       │   │   │   ├── sentry.module.ts
│       │   │   │   └── sentry.service.ts
│       │   │   └── posthog/
│       │   │       ├── posthog.module.ts
│       │   │       └── posthog.service.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── privy.service.ts
│       │   │   └── dto/
│       │   │       ├── auth-sync.dto.ts
│       │   │       └── me-response.dto.ts
│       │   ├── organizations/
│       │   │   ├── organizations.module.ts
│       │   │   ├── organizations.controller.ts
│       │   │   ├── organizations.service.ts
│       │   │   ├── team.controller.ts
│       │   │   ├── team.service.ts
│       │   │   └── dto/
│       │   │       ├── create-organization.dto.ts
│       │   │       ├── update-organization.dto.ts
│       │   │       ├── organization-response.dto.ts
│       │   │       ├── invite-member.dto.ts
│       │   │       └── team-member-response.dto.ts
│       │   ├── agents/
│       │   │   ├── agents.module.ts
│       │   │   ├── agents.controller.ts
│       │   │   ├── agents.service.ts
│       │   │   ├── agent-wallets.service.ts
│       │   │   ├── agent-api-keys.service.ts
│       │   │   └── dto/
│       │   │       ├── create-agent.dto.ts
│       │   │       ├── update-agent.dto.ts
│       │   │       ├── agent-response.dto.ts
│       │   │       ├── link-wallet.dto.ts
│       │   │       ├── agent-wallet-response.dto.ts
│       │   │       └── create-api-key.dto.ts
│       │   ├── policies/
│       │   │   ├── policies.module.ts
│       │   │   ├── policies.controller.ts
│       │   │   ├── policies.service.ts
│       │   │   ├── policy-versions.service.ts
│       │   │   └── dto/
│       │   │       ├── create-policy.dto.ts
│       │   │       ├── create-policy-version.dto.ts
│       │   │       ├── policy-response.dto.ts
│       │   │       └── policy-version-response.dto.ts
│       │   ├── compliance/
│       │   │   ├── compliance.module.ts
│       │   │   ├── compliance.controller.ts
│       │   │   ├── compliance.service.ts
│       │   │   ├── compliance-worker.service.ts
│       │   │   ├── adapters/
│       │   │   │   ├── trm.adapter.ts
│       │   │   │   └── webacy.adapter.ts
│       │   │   └── dto/
│       │   │       ├── compliance-check-response.dto.ts
│       │   │       ├── create-attestation.dto.ts
│       │   │       └── compliance-subject-response.dto.ts
│       │   ├── risk/
│       │   │   ├── risk.module.ts
│       │   │   ├── risk.controller.ts
│       │   │   ├── risk.service.ts
│       │   │   ├── risk-worker.service.ts
│       │   │   └── dto/
│       │   │       ├── risk-score-response.dto.ts
│       │   │       └── risk-model-response.dto.ts
│       │   ├── settlement/
│       │   │   ├── settlement.module.ts
│       │   │   ├── settlement.controller.ts
│       │   │   ├── settlement.service.ts
│       │   │   ├── settlement-worker.service.ts
│       │   │   ├── alchemy.service.ts
│       │   │   ├── chain.service.ts
│       │   │   └── dto/
│       │   │       ├── settlement-response.dto.ts
│       │   │       ├── approval-request.dto.ts
│       │   │       └── settle-request.dto.ts
│       │   ├── audit/
│       │   │   ├── audit.module.ts
│       │   │   ├── audit.controller.ts
│       │   │   ├── audit.service.ts
│       │   │   ├── audit-worker.service.ts
│       │   │   └── dto/
│       │   │       ├── audit-log-response.dto.ts
│       │   │       ├── audit-timeline-response.dto.ts
│       │   │       └── audit-export-request.dto.ts
│       │   ├── notifications/
│       │   │   ├── notifications.module.ts
│       │   │   ├── notifications.controller.ts
│       │   │   ├── notifications.service.ts
│       │   │   ├── notification-worker.service.ts
│       │   │   └── dto/
│       │   │       └── notification-response.dto.ts
│       │   ├── webhooks/
│       │   │   ├── webhooks.module.ts
│       │   │   ├── webhooks.controller.ts
│       │   │   ├── webhooks.service.ts
│       │   │   └── dto/
│       │   │       ├── create-webhook.dto.ts
│       │   │       ├── update-webhook.dto.ts
│       │   │       └── webhook-response.dto.ts
│       │   ├── admin/
│       │   │   ├── admin.module.ts
│       │   │   ├── admin.controller.ts
│       │   │   ├── admin.service.ts
│       │   │   ├── emergency.service.ts
│       │   │   ├── dead-letter.service.ts
│       │   │   └── dto/
│       │   │       ├── emergency-pause.dto.ts
│       │   │       ├── dead-letter-job-response.dto.ts
│       │   │       └── admin-organization-response.dto.ts
│       │   └── integrations/
│       │       ├── integrations.module.ts
│       │       ├── envio/
│       │       │   └── envio.service.ts
│       │       └── chainlink/
│       │           └── chainlink.service.ts
│       └── scheduler/
│           ├── scheduler.module.ts
│           └── jobs/
│               ├── mandate-expiry.job.ts
│               ├── settlement-reconciliation.job.ts
│               ├── stylus-keepalive.job.ts
│               ├── dlq-monitor.job.ts
│               └── vendor-cache-expiry.job.ts
│   └── test/
│       ├── jest-e2e.json
│       ├── app.e2e-spec.ts
│       └── helpers/
│           ├── test-database.ts
│           └── test-redis.ts
│
├── contracts/
│   ├── .env.example
│   ├── .gitignore
│   ├── .solhint.json
│   ├── hardhat.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── src/
│   │   ├── interfaces/
│   │   │   ├── IValenRegistry.sol
│   │   │   ├── IValenPolicyManager.sol
│   │   │   ├── IValenMandateRegistry.sol
│   │   │   ├── IValenSettlement.sol
│   │   │   ├── IValenEscrow.sol
│   │   │   ├── IValenTreasury.sol
│   │   │   ├── IValenGovernance.sol
│   │   │   ├── IValenAuditLog.sol
│   │   │   ├── IValenEmergencyGuardian.sol
│   │   │   ├── IComplianceEngine.sol
│   │   │   ├── IRiskEngine.sol
│   │   │   ├── IEligibilityEngine.sol
│   │   │   └── IPolicyEngine.sol
│   │   ├── libraries/
│   │   │   ├── ValenErrors.sol
│   │   │   ├── ValenTypes.sol
│   │   │   └── ValenConstants.sol
│   │   ├── core/
│   │   │   └── ValenAccessControl.sol
│   │   ├── registry/
│   │   │   └── ValenRegistry.sol
│   │   ├── governance/
│   │   │   ├── ValenGovernance.sol
│   │   │   └── ValenTimelock.sol
│   │   ├── treasury/
│   │   │   └── ValenTreasury.sol
│   │   ├── settlement/
│   │   │   ├── ValenPolicyManager.sol
│   │   │   ├── ValenMandateRegistry.sol
│   │   │   └── ValenSettlement.sol
│   │   ├── escrow/
│   │   │   └── ValenEscrow.sol
│   │   ├── audit/
│   │   │   └── ValenAuditLog.sol
│   │   └── emergency/
│   │       └── ValenEmergencyGuardian.sol
│   ├── test/
│   │   ├── ValenRegistry.test.ts
│   │   ├── ValenPolicyManager.test.ts
│   │   ├── ValenMandateRegistry.test.ts
│   │   ├── ValenSettlement.test.ts
│   │   ├── ValenEscrow.test.ts
│   │   ├── ValenTreasury.test.ts
│   │   ├── ValenGovernance.test.ts
│   │   ├── ValenAuditLog.test.ts
│   │   ├── ValenEmergencyGuardian.test.ts
│   │   └── helpers/
│   │       ├── fixtures.ts
│   │       └── deploy.ts
│   ├── script/
│   │   ├── deploy-local.ts
│   │   ├── deploy-sepolia.ts
│   │   ├── deploy-robinhood-testnet.ts
│   │   ├── deploy-mainnet.ts
│   │   ├── verify.ts
│   │   └── register-engines.ts
│   └── deployments/
│       ├── localhost/
│       │   └── .gitkeep
│       ├── arbitrum-sepolia/
│       │   └── .gitkeep
│       ├── robinhood-testnet/
│       │   └── .gitkeep
│       └── arbitrum-one/
│           └── .gitkeep
│
├── stylus/
│   ├── .env.example
│   ├── .gitignore
│   ├── Cargo.toml
│   ├── rust-toolchain.toml
│   ├── Dockerfile
│   ├── crates/
│   │   └── valen-stylus-common/
│   │       ├── Cargo.toml
│   │       └── src/
│   │           ├── lib.rs
│   │           ├── types/
│   │           │   ├── mod.rs
│   │           │   ├── intent.rs
│   │           │   ├── verdict.rs
│   │           │   └── reason_code.rs
│   │           ├── traits/
│   │           │   ├── mod.rs
│   │           │   └── engine.rs
│   │           └── errors/
│   │               ├── mod.rs
│   │               └── engine_error.rs
│   ├── engines/
│   │   ├── compliance-engine/
│   │   │   ├── Cargo.toml
│   │   │   ├── Stylus.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       └── ComplianceEngine.rs
│   │   ├── risk-engine/
│   │   │   ├── Cargo.toml
│   │   │   ├── Stylus.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       └── RiskEngine.rs
│   │   ├── eligibility-engine/
│   │   │   ├── Cargo.toml
│   │   │   ├── Stylus.toml
│   │   │   └── src/
│   │   │       ├── lib.rs
│   │   │       └── EligibilityEngine.rs
│   │   └── policy-engine/
│   │       ├── Cargo.toml
│   │       ├── Stylus.toml
│   │       └── src/
│   │           ├── lib.rs
│   │           └── PolicyEngine.rs
│   ├── tests/
│   │   ├── compliance_engine_test.rs
│   │   ├── risk_engine_test.rs
│   │   ├── eligibility_engine_test.rs
│   │   └── policy_engine_test.rs
│   ├── script/
│   │   ├── build-all.sh
│   │   ├── deploy-sepolia.sh
│   │   ├── deploy-robinhood-testnet.sh
│   │   ├── activate-all.sh
│   │   └── export-abi.sh
│   └── deployments/
│       ├── arbitrum-sepolia/
│       │   └── .gitkeep
│       └── robinhood-testnet/
│           └── .gitkeep
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.override.yml.example
│   │   └── .env.docker.example
│   ├── render/
│   │   ├── render.yaml
│   │   ├── valen-api.yaml
│   │   ├── valen-worker.yaml
│   │   ├── valen-scheduler.yaml
│   │   └── valen-redis.yaml
│   ├── github/
│   │   └── CODEOWNERS
│   ├── sentry/
│   │   └── sentry.config.md
│   ├── posthog/
│   │   └── posthog.config.md
│   └── runbooks/
│       ├── local-development.md
│       ├── deployment.md
│       ├── rollback.md
│       ├── emergency-pause.md
│       └── incident-response.md
│
├── scripts/
│   ├── local/
│   │   ├── bootstrap.sh
│   │   ├── bootstrap.ps1
│   │   ├── start-all.sh
│   │   └── stop-all.sh
│   ├── deploy/
│   │   ├── deploy-backend.sh
│   │   ├── deploy-contracts.sh
│   │   └── deploy-stylus.sh
│   ├── verify/
│   │   ├── verify-contracts.sh
│   │   └── verify-stylus.sh
│   └── ops/
│       ├── health-check.sh
│       └── reconcile-settlements.sh
│
└── docs/
    ├── architecture/
    │   ├── README.md
    │   └── adr/
    │       ├── 001-monorepo-structure.md
    │       ├── 002-bullmq-over-kafka.md
    │       ├── 003-uups-upgrade-strategy.md
    │       └── 004-envio-indexing.md
    ├── api/
    │   └── openapi-placeholder.md
    ├── database/
    │   ├── schema-overview.md
    │   └── rls-policy-overview.md
    ├── contracts/
    │   ├── contract-map.md
    │   └── deployment-addresses.md
    ├── security/
    │   ├── threat-model.md
    │   └── secrets-ownership.md
    └── operations/
        ├── environments.md
        └── release-process.md
```

## Root Package Scripts

| Script | Command Target |
|---|---|
| `pnpm install` | Install all workspace packages |
| `pnpm build` | Turbo build all packages |
| `pnpm test` | Turbo test all packages |
| `pnpm lint` | Turbo lint all packages |
| `pnpm dev` | Start backend + frontend locally |
| `pnpm docker:up` | Docker Compose local stack |

---

# SECTION 2 — Backend Foundation

## Runtime Entry Points

| File | Purpose |
|---|---|
| `backend/src/main.ts` | NestJS API bootstrap |
| `backend/src/worker.ts` | BullMQ worker bootstrap |
| `backend/src/scheduler.ts` | Cron/interval job bootstrap |
| `backend/src/app.module.ts` | API module graph |
| `backend/src/worker.module.ts` | Worker module graph |
| `backend/src/scheduler.module.ts` | Scheduler module graph |

## Config Module

| File | Responsibility |
|---|---|
| `config/config.module.ts` | Global config registration |
| `config/configuration.ts` | Typed config factory |
| `config/env.validation.ts` | Joi/Zod schema validation at boot |
| `config/config.types.ts` | Config interface types |

Boot fails if required env vars missing. No silent defaults for secrets.

## Database Module

| File | Responsibility |
|---|---|
| `database/database.module.ts` | Global database provider |
| `database/database.service.ts` | Connection pool, query helper, transaction wrapper |
| `database/database.constants.ts` | Injection tokens |
| `database/repositories/*.repository.ts` | One repository per table group |

Repository pattern only. No raw SQL in controllers. Service layer calls repositories.

## Redis Module

| File | Responsibility |
|---|---|
| `redis/redis.module.ts` | Global Redis provider |
| `redis/redis.service.ts` | Get/set, locks, rate limit helpers |
| `redis/redis.constants.ts` | Key prefixes, TTL constants |

## Queues Module

| File | Responsibility |
|---|---|
| `queues/queues.module.ts` | BullMQ registration |
| `queues/queues.constants.ts` | Queue names |
| `queues/bullmq.config.ts` | Connection, default job options, DLQ config |
| `queues/processors/*.processor.ts` | One processor per queue |
| `queues/producers/*.producer.ts` | Enqueue helpers per domain |

## Queue Names (Frozen)

| Constant | Queue Name |
|---|---|
| `INTENT_QUEUE` | `valen:intent` |
| `COMPLIANCE_QUEUE` | `valen:compliance` |
| `RISK_QUEUE` | `valen:risk` |
| `POLICY_QUEUE` | `valen:policy` |
| `SETTLEMENT_QUEUE` | `valen:settlement` |
| `CONFIRMATION_QUEUE` | `valen:confirmation` |
| `AUDIT_QUEUE` | `valen:audit` |
| `NOTIFICATION_QUEUE` | `valen:notification` |
| `VENDOR_QUEUE` | `valen:vendor` |
| `INDEXER_QUEUE` | `valen:indexer` |
| `MAINTENANCE_QUEUE` | `valen:maintenance` |
| `DEAD_LETTER_QUEUE` | `valen:dead-letter` |

## Health Module

| File | Endpoint |
|---|---|
| `health/health.controller.ts` | `GET /health/live`, `GET /health/ready`, `GET /health/deep` |
| `health/health.service.ts` | DB ping, Redis ping, queue connectivity |

## Observability Module

| File | Responsibility |
|---|---|
| `observability/sentry/sentry.module.ts` | Sentry init |
| `observability/sentry/sentry.service.ts` | Capture exception, set user context |
| `observability/posthog/posthog.module.ts` | PostHog init |
| `observability/posthog/posthog.service.ts` | Track event, identify user |

## Auth Module

| File | Type | Route / Role |
|---|---|---|
| `auth/auth.controller.ts` | Controller | `POST /v1/auth/sync`, `GET /v1/me` |
| `auth/auth.service.ts` | Service | User sync, session resolution |
| `auth/privy.service.ts` | Service | JWT verification via JWKS |
| `auth/dto/auth-sync.dto.ts` | DTO | Request validation |
| `auth/dto/me-response.dto.ts` | DTO | Response shape |

| Guard | File |
|---|---|
| Privy JWT | `common/guards/privy-auth.guard.ts` |
| API Key | `common/guards/api-key-auth.guard.ts` |
| RBAC | `common/guards/roles.guard.ts` |
| Org scope | `common/guards/organization-scope.guard.ts` |

## Domain Modules — Controller / Service / Repository Map

| Module | Controller | Service(s) | Repository |
|---|---|---|---|
| organizations | `organizations.controller.ts`, `team.controller.ts` | `organizations.service.ts`, `team.service.ts` | `organizations.repository.ts`, `team-members.repository.ts` |
| agents | `agents.controller.ts` | `agents.service.ts`, `agent-wallets.service.ts`, `agent-api-keys.service.ts` | `agents.repository.ts`, `agent-wallets.repository.ts`, `api-keys.repository.ts` |
| policies | `policies.controller.ts` | `policies.service.ts`, `policy-versions.service.ts` | `policies.repository.ts`, `policy-versions.repository.ts` |
| compliance | `compliance.controller.ts` | `compliance.service.ts`, `compliance-worker.service.ts` | `compliance-checks.repository.ts` |
| risk | `risk.controller.ts` | `risk.service.ts`, `risk-worker.service.ts` | `risk-scores.repository.ts` |
| settlement | `settlement.controller.ts` | `settlement.service.ts`, `settlement-worker.service.ts`, `alchemy.service.ts`, `chain.service.ts` | `settlements.repository.ts` |
| audit | `audit.controller.ts` | `audit.service.ts`, `audit-worker.service.ts` | `audit-logs.repository.ts` |
| notifications | `notifications.controller.ts` | `notifications.service.ts`, `notification-worker.service.ts` | `notifications.repository.ts` |
| webhooks | `webhooks.controller.ts` | `webhooks.service.ts` | `webhooks.repository.ts` |
| admin | `admin.controller.ts` | `admin.service.ts`, `emergency.service.ts`, `dead-letter.service.ts` | `dead-letter-jobs.repository.ts`, `emergency-actions.repository.ts` |

## Common Layer — Filters and Interceptors

| File | Behavior |
|---|---|
| `filters/all-exceptions.filter.ts` | Catch-all; map to ErrorResponseDTO |
| `filters/http-exception.filter.ts` | HTTP exceptions with error codes |
| `interceptors/request-id.interceptor.ts` | Generate/propagate `requestId` |
| `interceptors/logging.interceptor.ts` | Structured request log |
| `interceptors/transform-response.interceptor.ts` | Wrap in ApiResponseDTO |

## Backend Dependencies (package.json)

| Package | Purpose |
|---|---|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | NestJS core |
| `@nestjs/config` | Config module |
| `@nestjs/bullmq`, `bullmq`, `ioredis` | Queues |
| `pg` or `@supabase/supabase-js` | Database |
| `@privy-io/server-auth` | Privy JWT verification |
| `@sentry/nestjs` | Sentry |
| `posthog-node` | PostHog |
| `viem` or `ethers` | Chain interaction |
| `class-validator`, `class-transformer` | DTO validation |
| `joi` or `zod` | Env validation |

## Backend Test Structure

| File | Scope |
|---|---|
| `test/app.e2e-spec.ts` | Health endpoints |
| `test/helpers/test-database.ts` | Test DB setup |
| `test/helpers/test-redis.ts` | Test Redis setup |
| Per-module `*.spec.ts` | Co-located with services |

---

# SECTION 3 — Database Foundation

## SQL Folder Structure

```text
backend/
└── supabase/
    ├── config.toml
    ├── seed.sql
    └── migrations/
        ├── 20260101000001_extensions_and_enums.sql
        ├── 20260101000002_identity_and_organizations.sql
        ├── 20260101000003_agents_and_wallets.sql
        ├── 20260101000004_policies.sql
        ├── 20260101000005_executions.sql
        ├── 20260101000006_compliance.sql
        ├── 20260101000007_risk.sql
        ├── 20260101000008_settlements.sql
        ├── 20260101000009_audit.sql
        ├── 20260101000010_notifications_webhooks.sql
        ├── 20260101000011_platform_ops.sql
        ├── 20260101000012_rls_policies.sql
        └── 20260101000013_indexes.sql
```

## Migration Order

| # | Migration File | Tables Created |
|---|---|---|
| 001 | `extensions_and_enums.sql` | Extensions (`uuid-ossp`, `pgcrypto`); enums for status, role, tier |
| 002 | `identity_and_organizations.sql` | `users`, `organizations`, `team_members` |
| 003 | `agents_and_wallets.sql` | `agents`, `agent_wallets`, `api_keys` |
| 004 | `policies.sql` | `policies`, `policy_versions` |
| 005 | `executions.sql` | `executions`, `intent_idempotency_keys` |
| 006 | `compliance.sql` | `compliance_checks`, `compliance_attestations` |
| 007 | `risk.sql` | `risk_scores`, `risk_models` |
| 008 | `settlements.sql` | `settlements`, `chain_networks`, `contract_deployments`, `nonce_locks` |
| 009 | `audit.sql` | `audit_logs`, `audit_events`, `audit_commitments` |
| 010 | `notifications_webhooks.sql` | `notifications`, `webhooks`, `webhook_deliveries`, `notification_preferences` |
| 011 | `platform_ops.sql` | `job_runs`, `dead_letter_jobs`, `feature_flags`, `admin_actions`, `emergency_actions` |
| 012 | `rls_policies.sql` | RLS enable + policies per table |
| 013 | `indexes.sql` | Performance indexes per VALEN_ARCHITECTURE_BLUEPRINT |

## Schema Ownership

| Domain | Owner Module | Tables |
|---|---|---|
| Identity | auth, organizations | users, organizations, team_members |
| Agents | agents | agents, agent_wallets, api_keys |
| Policies | policies | policies, policy_versions |
| Executions | settlement (intent lifecycle) | executions, intent_idempotency_keys |
| Compliance | compliance | compliance_checks, compliance_attestations |
| Risk | risk | risk_scores, risk_models |
| Settlement | settlement | settlements, chain_networks, contract_deployments, nonce_locks |
| Audit | audit | audit_logs, audit_events, audit_commitments |
| Notifications | notifications, webhooks | notifications, webhooks, webhook_deliveries |
| Platform | admin | dead_letter_jobs, emergency_actions, admin_actions, feature_flags |

## RLS Ownership

| Table Group | Policy Owner | Read Roles | Write |
|---|---|---|---|
| Organization-owned | Backend + Supabase migration 012 | team_members of org | Backend service role only |
| audit_logs | audit module | auditor, owner, compliance_officer | Backend service role append-only |
| settlements | settlement module | settlement_operator, owner, auditor | Backend service role only |
| compliance_checks | compliance module | compliance_officer, auditor, owner | Backend service role only |
| api_keys | agents module | organization_owner, developer | Backend service role only |
| admin_actions | admin module | platform_admin | Backend service role only |

RLS policies live only in `20260101000012_rls_policies.sql`. No RLS in feature migrations.

## Seed Strategy

| File | Contents |
|---|---|
| `supabase/seed.sql` | Dev-only: one test organization, one test user, one test agent, one test policy, chain_networks for Sepolia and Robinhood Testnet |

Seed runs only in local and dev. Never in staging or production.

## Audit Strategy

| Mechanism | Location |
|---|---|
| Append-only `audit_logs` table | Migration 009 |
| `audit_events` normalized ledger | Migration 009 |
| `audit_commitments` onchain hash refs | Migration 009 |
| Audit queue processor | `audit.processor.ts` |
| Audit service | `audit.service.ts` |
| No UPDATE/DELETE on audit tables | RLS + repository constraints |

---

# SECTION 4 — Contracts Foundation

## Hardhat Configuration

| File | Purpose |
|---|---|
| `contracts/hardhat.config.ts` | Networks: localhost, arbitrum-sepolia, robinhood-testnet, arbitrum-one; Solidity 0.8.24; optimizer enabled |
| `contracts/package.json` | hardhat, @nomicfoundation/hardhat-toolbox, @openzeppelin/contracts, @openzeppelin/contracts-upgradeable |
| `contracts/.solhint.json` | Solhint rules |
| `contracts/Dockerfile` | Compile-only container for CI |

## Source Layout

| Directory | Files | Purpose |
|---|---|---|
| `src/interfaces/` | 13 interface files | External and Stylus engine ABIs |
| `src/libraries/` | ValenErrors, ValenTypes, ValenConstants | Shared types and errors |
| `src/core/` | ValenAccessControl | Base access control |
| `src/registry/` | ValenRegistry | Address registry |
| `src/governance/` | ValenGovernance, ValenTimelock | Governance and delay |
| `src/treasury/` | ValenTreasury | Fee collection |
| `src/settlement/` | ValenPolicyManager, ValenMandateRegistry, ValenSettlement | Core settlement path |
| `src/escrow/` | ValenEscrow | Optional custody |
| `src/audit/` | ValenAuditLog | Onchain commitments |
| `src/emergency/` | ValenEmergencyGuardian | Pause and freeze |

## Contract Files — Scaffold State

Each `.sol` file contains:
- SPDX license identifier
- pragma solidity
- contract/interface skeleton with NatSpec header
- Storage layout comments (no implementation body)
- Function signatures only (no logic)
- Event declarations
- Error declarations

## Test Layout

| File | Tests |
|---|---|
| `ValenRegistry.test.ts` | Deploy, register, resolve |
| `ValenPolicyManager.test.ts` | Publish, activate, retire |
| `ValenMandateRegistry.test.ts` | Grant, revoke, freeze, cap |
| `ValenSettlement.test.ts` | Pause, execute path stubs |
| `ValenEscrow.test.ts` | Deposit, lock, release stubs |
| `ValenTreasury.test.ts` | Fee accrual stubs |
| `ValenGovernance.test.ts` | Queue, execute stubs |
| `ValenAuditLog.test.ts` | Record commitment |
| `ValenEmergencyGuardian.test.ts` | Pause, lift |
| `helpers/deploy.ts` | Shared deploy fixture |
| `helpers/fixtures.ts` | Test accounts and constants |

## Script Layout

| Script | Network | Output |
|---|---|---|
| `deploy-local.ts` | localhost | `deployments/localhost/*.json` |
| `deploy-sepolia.ts` | arbitrum-sepolia | `deployments/arbitrum-sepolia/*.json` |
| `deploy-robinhood-testnet.ts` | robinhood-testnet | `deployments/robinhood-testnet/*.json` |
| `deploy-mainnet.ts` | arbitrum-one | `deployments/arbitrum-one/*.json` |
| `verify.ts` | any | Arbiscan verification |
| `register-engines.ts` | any | Register Stylus addresses in ValenRegistry |

## Deployment Artifact Format

Each deployment JSON contains:
- `network`
- `chainId`
- `deployer`
- `timestamp`
- `contracts`: map of name → `{ address, txHash, implementation? }`
- `engines`: map of name → `{ address, txHash, activated, version }`

---

# SECTION 5 — Stylus Foundation

## Workspace Layout

| Path | Purpose |
|---|---|
| `stylus/Cargo.toml` | Workspace manifest |
| `stylus/rust-toolchain.toml` | Pinned Rust version |
| `stylus/crates/valen-stylus-common/` | Shared types, traits, errors |
| `stylus/engines/*/` | One crate per engine |
| `stylus/tests/` | Integration tests |
| `stylus/script/` | Build and deploy shell scripts |
| `stylus/deployments/` | Per-chain deployment JSON |

## Common Crate Structure

| File | Purpose |
|---|---|
| `types/mod.rs` | Module exports |
| `types/intent.rs` | Intent input struct |
| `types/verdict.rs` | Verdict output struct |
| `types/reason_code.rs` | Reason code enum |
| `traits/mod.rs` | Module exports |
| `traits/engine.rs` | Engine trait definition |
| `errors/mod.rs` | Module exports |
| `errors/engine_error.rs` | Engine error enum |

## Engine Crate Structure (Each Engine)

| File | Purpose |
|---|---|
| `Cargo.toml` | Dependencies: stylus-sdk, valen-stylus-common |
| `Stylus.toml` | Stylus deployment config |
| `src/lib.rs` | Crate root, re-exports |
| `src/{EngineName}.rs` | Entrypoint skeleton with `#[entrypoint]`, storage struct, public method signatures only |

## Engine Files

| Engine | Entry File | Public Methods (signatures only) |
|---|---|---|
| ComplianceEngine | `ComplianceEngine.rs` | `evaluate(intent_hash, context) -> Verdict` |
| RiskEngine | `RiskEngine.rs` | `calculate(intent_hash, factors) -> RiskVerdict` |
| EligibilityEngine | `EligibilityEngine.rs` | `check(principal, agent, asset, counterparty, scope) -> EligibilityVerdict` |
| PolicyEngine | `PolicyEngine.rs` | `evaluate(intent_hash, policy_hash, compliance_hash, risk_hash) -> PolicyVerdict` |

## Stylus Scripts

| Script | Action |
|---|---|
| `build-all.sh` | `cargo build --release` for all engines |
| `deploy-sepolia.sh` | `cargo stylus deploy` to Arbitrum Sepolia |
| `deploy-robinhood-testnet.sh` | `cargo stylus deploy` to Robinhood Testnet |
| `activate-all.sh` | `cargo stylus activate` for all engines |
| `export-abi.sh` | `cargo stylus export-abi` for backend integration |

## Stylus Dependencies (Workspace Cargo.toml)

| Crate | Version Pin |
|---|---|
| `stylus-sdk` | Pin per VALEN_ARCHITECTURE_BLUEPRINT |
| `openzeppelin-stylus` | Pin per OZ release |
| `alloy-primitives` | Match stylus-sdk |
| `cargo-stylus` | CLI tool, not workspace dep |

## Stylus Test Files

| File | Scope |
|---|---|
| `compliance_engine_test.rs` | Reason code matrix stubs |
| `risk_engine_test.rs` | Tier boundary stubs |
| `eligibility_engine_test.rs` | Dimension pass/fail stubs |
| `policy_engine_test.rs` | Verdict enum stubs |

Tests use `stylus-test` TestVM. No network required for unit tests.

---

# SECTION 6 — DevOps Foundation

## Docker

| File | Purpose |
|---|---|
| `infra/docker/docker-compose.yml` | Postgres, Redis, optional local chain |
| `infra/docker/docker-compose.override.yml.example` | Local overrides template |
| `infra/docker/.env.docker.example` | Docker env template |
| `backend/Dockerfile` | API production image |
| `backend/Dockerfile.worker` | Worker production image |
| `backend/Dockerfile.scheduler` | Scheduler production image |
| `contracts/Dockerfile` | Hardhat compile CI image |
| `stylus/Dockerfile` | Rust/WASM build CI image |

## Docker Compose Services

| Service | Image / Build | Ports |
|---|---|---|
| `postgres` | postgres:16 | 5432 |
| `redis` | redis:7-alpine | 6379 |
| `valen-api` | build backend/Dockerfile | 3000 |
| `valen-worker` | build backend/Dockerfile.worker | — |
| `valen-scheduler` | build backend/Dockerfile.scheduler | — |

## Render

| File | Service |
|---|---|
| `infra/render/render.yaml` | Blueprint root |
| `infra/render/valen-api.yaml` | Web service spec |
| `infra/render/valen-worker.yaml` | Background worker spec |
| `infra/render/valen-scheduler.yaml` | Background worker spec |
| `infra/render/valen-redis.yaml` | Managed Redis reference |

## Linting and Formatting

| Area | Config File | Tool |
|---|---|---|
| Backend | `backend/.eslintrc.js`, `backend/.prettierrc` | ESLint, Prettier |
| Frontend | `frontend/.eslintrc.json` | ESLint |
| Contracts | `contracts/.solhint.json` | Solhint |
| Stylus | `stylus/rustfmt.toml`, `stylus/clippy.toml` | rustfmt, clippy |
| Root | `.editorconfig` | EditorConfig |

## Testing

| Area | Config | Runner |
|---|---|---|
| Backend unit | `backend/jest.config.ts` | Jest |
| Backend e2e | `backend/test/jest-e2e.json` | Jest |
| Contracts | `contracts/hardhat.config.ts` mocha | Hardhat |
| Stylus | `stylus/Cargo.toml` | cargo test |
| Monorepo | `turbo.json` test pipeline | Turbo |

## Coverage

| Area | Target | Tool |
|---|---|---|
| Backend | 80% domain services | Jest coverage |
| Contracts | 90% critical paths | hardhat coverage |
| Stylus | All public methods stubbed | cargo tarpaulin optional |

## Release Workflow

| File | Purpose |
|---|---|
| `.github/workflows/release.yml` | Tag → build artifacts → GitHub Release |
| Version in root `package.json` | Semantic version |
| Contract deployment JSON versioned per release | `deployments/*/release-{version}.json` |

## Versioning Strategy

| Artifact | Version Source |
|---|---|
| Backend | `backend/package.json` version |
| Contracts | `contracts/package.json` version + deployment JSON |
| Stylus | `stylus/Cargo.toml` workspace version + activation metadata |
| Frontend | `frontend/package.json` version |
| Monorepo | Root `package.json` coordinates release train |

---

# SECTION 7 — Environment Management

## Environment Files

| File | Location | Used By |
|---|---|---|
| `.env.development` | `backend/`, `contracts/`, `stylus/`, `frontend/` | Local dev |
| `.env.staging` | Render env groups, not committed | Staging |
| `.env.production` | Render env groups, not committed | Production |
| `.env.example` | Each package, committed | Template only |

`.env.development`, `.env.staging`, `.env.production` are gitignored. Only `.env.example` is committed.

## Backend Variables

| Variable | Development | Staging | Production | Owner |
|---|---|---|---|---|
| `NODE_ENV` | development | staging | production | DevOps |
| `APP_ENV` | local | staging | production | DevOps |
| `PORT` | 3000 | 3000 | 3000 | DevOps |
| `DATABASE_URL` | local postgres | Supabase staging | Supabase prod | DevOps |
| `SUPABASE_URL` | dev project | staging project | prod project | DevOps |
| `SUPABASE_ANON_KEY` | dev | staging | prod | DevOps |
| `SUPABASE_SERVICE_ROLE_KEY` | dev | staging | prod | DevOps (secret) |
| `REDIS_URL` | local redis | Render Redis | Render Redis | DevOps |
| `PRIVY_APP_ID` | dev app | staging app | prod app | Backend |
| `PRIVY_SECRET` | dev | staging | prod | Backend (secret) |
| `ALCHEMY_API_KEY` | dev key | staging key | prod key | Backend (secret) |
| `ARB_SEPOLIA_RPC` | Alchemy dev | Alchemy staging | — | Backend |
| `ARB_MAINNET_RPC` | — | — | Alchemy prod | Backend |
| `ROBINHOOD_TESTNET_RPC` | public/Alchemy | Alchemy staging | — | Backend |
| `ROBINHOOD_RPC` | — | — | Alchemy prod | Backend |
| `SETTLEMENT_SIGNER_MODE` | private_key | private_key | kms/turnkey | Security |
| `PRIVATE_KEY` | testnet only | testnet only | never | Security (secret) |
| `SENTRY_DSN` | dev project | staging | prod | DevOps |
| `POSTHOG_KEY` | dev | staging | prod | DevOps |
| `VALEN_SETTLEMENT_ADDRESS` | localhost/sepolia | staging deploy | prod deploy | Contracts |
| `COMPLIANCE_ENGINE_ADDRESS` | sepolia | staging | prod | Stylus |
| `RISK_ENGINE_ADDRESS` | sepolia | staging | prod | Stylus |
| `ELIGIBILITY_ENGINE_ADDRESS` | sepolia | staging | prod | Stylus |
| `POLICY_ENGINE_ADDRESS` | sepolia | staging | prod | Stylus |

## Contracts Variables

| Variable | Owner | Rotation |
|---|---|---|
| `PRIVATE_KEY` | Smart Contract Engineer | Per environment wallet |
| `ARBISCAN_API_KEY` | DevOps | Annual |
| `SAFE_MULTISIG_ADDRESS` | Security | On governance change |
| `TIMELOCK_ADDRESS` | Security | On deploy |
| `EMERGENCY_GUARDIAN_ADDRESS` | Security | On governance change |

## Stylus Variables

| Variable | Owner | Rotation |
|---|---|---|
| `PRIVATE_KEY` / `PRIVATE_KEY_PATH` | Stylus Engineer | Per environment |
| `STYLUS_NETWORK` | Stylus Engineer | Per deploy target |
| `ARB_SEPOLIA_RPC` | DevOps | With Alchemy key |

## Frontend Variables

| Variable | Exposure |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Public |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public |
| `NEXT_PUBLIC_SENTRY_DSN` | Public |

## Validation Strategy

| Layer | Mechanism |
|---|---|
| Boot | `env.validation.ts` rejects missing required vars |
| CI | Workflow checks `.env.example` documents all required keys |
| Render | Env group validation script in `scripts/ops/validate-env.sh` |
| Secrets | Never in git; Render secret store; rotate on incident |

## Secret Ownership

| Secret | Owner | Storage |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | DevOps | Render secrets |
| `PRIVY_SECRET` | Backend lead | Render secrets |
| `ALCHEMY_API_KEY` | Backend lead | Render secrets |
| `PRIVATE_KEY` (settlement) | Security | KMS/Turnkey prod; local env dev only |
| `PRIVATE_KEY` (deploy) | Contracts/Stylus lead | Render secrets staging; KMS prod |
| `TRM_API_KEY` | Compliance lead | Render secrets |
| `WEBACY_API_KEY` | Risk lead | Render secrets |
| `API_KEY_PEPPER` | Backend lead | Render secrets |
| `ENCRYPTION_KEY` | Security | Render secrets |

## Rotation Strategy

| Secret | Frequency | Trigger |
|---|---|---|
| API keys (customer) | On demand | Compromise, offboarding |
| `PRIVY_SECRET` | Quarterly | Scheduled |
| `ALCHEMY_API_KEY` | Quarterly | Scheduled |
| Deployer keys | On personnel change | Offboarding |
| Settlement signer | On incident | Compromise |
| `API_KEY_PEPPER` | Annual with migration | Scheduled |

---

# SECTION 8 — CI/CD

## Workflow Files

```text
.github/
└── workflows/
    ├── ci-backend.yml
    ├── ci-frontend.yml
    ├── ci-contracts.yml
    ├── ci-stylus.yml
    ├── ci-security.yml
    ├── deploy-dev.yml
    ├── deploy-staging.yml
    ├── deploy-production.yml
    ├── verify-contracts.yml
    └── release.yml
```

## ci-backend.yml

| Trigger | PR, push to develop/main |
|---|---|
| Jobs | install → lint → typecheck → unit test → e2e (postgres + redis services) |
| Services | postgres:16, redis:7 |
| Artifacts | coverage report |
| Fail on | lint error, test failure, coverage below threshold |

## ci-frontend.yml

| Trigger | PR, push to develop/main |
|---|---|
| Jobs | install → lint → typecheck → build |
| Fail on | lint error, build failure |

## ci-contracts.yml

| Trigger | PR, push to develop/main |
|---|---|
| Jobs | install → compile → solhint → test → coverage |
| Node | 20 |
| Fail on | compile error, test failure, solhint error |

## ci-stylus.yml

| Trigger | PR, push to develop/main |
|---|---|
| Jobs | rustfmt check → clippy → cargo test → wasm build check |
| Toolchain | From rust-toolchain.toml |
| Fail on | fmt, clippy, test, build failure |

## ci-security.yml

| Trigger | PR, weekly schedule |
|---|---|
| Jobs | npm audit → dependency review → secret scan (gitleaks) → optional slither on contracts |
| Fail on | critical vulnerability, secret detected |

## deploy-dev.yml

| Trigger | Push to develop |
|---|---|
| Jobs | build backend → deploy Render dev API/worker/scheduler |
| Environment | development |
| Requires | ci-backend green on commit |

## deploy-staging.yml

| Trigger | Push to release/* |
|---|---|
| Jobs | full CI → deploy Render staging → smoke health check |
| Environment | staging |
| Requires | manual approval optional |

## deploy-production.yml

| Trigger | Push tag v* |
|---|---|
| Jobs | full CI → manual approval → deploy Render production |
| Environment | production |
| Requires | staging smoke passed, approval gate |

## verify-contracts.yml

| Trigger | Manual, post-deploy |
|---|---|
| Jobs | verify Solidity on Arbiscan per network |
| Inputs | network, deployment JSON path |

## release.yml

| Trigger | Tag v* |
|---|---|
| Jobs | build all → attach deployment artifacts → GitHub Release notes |
| Outputs | Versioned contract addresses, engine addresses |

## Pipeline Dependency Graph

```text
PR opened
  → ci-backend + ci-frontend + ci-contracts + ci-stylus + ci-security (parallel)
  → merge to develop
  → deploy-dev
  → release branch
  → deploy-staging
  → tag v*
  → deploy-production + release.yml + verify-contracts.yml
```

---

# SECTION 9 — Implementation Order

## Week 1 — Repository and Tooling

### Day 1 — Monorepo Bootstrap

| Task | Owner | Output |
|---|---|---|
| Init root package.json, pnpm-workspace, turbo.json | DevOps | Root installs |
| Create .gitignore, .editorconfig, .nvmrc, README | DevOps | Repo hygiene |
| Create all empty directories per Section 1 tree | All | Folder structure |
| Init backend NestJS project | Backend | backend/ builds |
| Init frontend Next.js project | Frontend | frontend/ builds |
| Init contracts Hardhat project | Contracts | contracts/ compiles empty |
| Init stylus Cargo workspace | Stylus | stylus/ builds empty |

### Day 2 — Backend Core

| Task | Owner | Output |
|---|---|---|
| config module + env.validation | Backend | Boot validates env |
| database module + database.service | Backend | DB connects |
| redis module + redis.service | Backend | Redis connects |
| health module + controller | Backend | /health/live, /health/ready |
| common filters, interceptors, guards skeleton | Backend | Request pipeline |
| main.ts, app.module.ts | Backend | API starts |

### Day 3 — Backend Modules Skeleton

| Task | Owner | Output |
|---|---|---|
| auth module (controller, service, dto, privy.service) | Backend | Auth routes stub |
| organizations module | Backend | Org routes stub |
| agents module | Backend | Agent routes stub |
| policies module | Backend | Policy routes stub |
| All repositories (empty methods) | Backend | Repository layer exists |

### Day 4 — Queues and Workers

| Task | Owner | Output |
|---|---|---|
| queues.module + bullmq.config | Backend | BullMQ connects |
| All processors (empty process method) | Backend | Workers register |
| All producers | Backend | Enqueue helpers exist |
| worker.ts + worker.module.ts | Backend | Worker starts |
| scheduler.ts + scheduler jobs skeleton | Backend | Scheduler starts |

### Day 5 — Domain Modules Remaining

| Task | Owner | Output |
|---|---|---|
| compliance, risk, settlement modules | Backend | Routes stub |
| audit, notifications, webhooks, admin modules | Backend | Routes stub |
| observability sentry + posthog modules | Backend | Telemetry init |
| integrations module skeleton | Backend | Adapter stubs |

## Week 2 — Database and Contracts

### Day 6 — Database Migrations 001–005

| Task | Owner | Output |
|---|---|---|
| supabase/config.toml | Backend | Supabase CLI config |
| migrations 001–005 | Backend | Core tables exist |
| seed.sql | Backend | Dev seed runs |
| Repository methods wired to tables | Backend | CRUD stubs work |

### Day 7 — Database Migrations 006–013

| Task | Owner | Output |
|---|---|---|
| migrations 006–011 | Backend | All tables exist |
| migration 012 RLS | Backend | RLS enabled |
| migration 013 indexes | Backend | Indexes created |
| RLS integration test | Backend | Tenant isolation test passes |

### Day 8 — Contracts Interfaces and Libraries

| Task | Owner | Output |
|---|---|---|
| All interfaces in src/interfaces/ | Contracts | ABI contracts defined |
| ValenErrors, ValenTypes, ValenConstants | Contracts | Libraries compile |
| ValenAccessControl skeleton | Contracts | Core compiles |
| hardhat.config.ts networks | Contracts | Sepolia + Robinhood configured |

### Day 9 — Contracts Core and Settlement

| Task | Owner | Output |
|---|---|---|
| ValenRegistry skeleton | Contracts | Compiles |
| ValenPolicyManager, ValenMandateRegistry skeleton | Contracts | Compiles |
| ValenSettlement skeleton | Contracts | Compiles |
| deploy-local.ts script | Contracts | Local deploy produces JSON |

### Day 10 — Contracts Remaining and Tests

| Task | Owner | Output |
|---|---|---|
| ValenEscrow, ValenTreasury, ValenGovernance skeleton | Contracts | Compiles |
| ValenAuditLog, ValenEmergencyGuardian skeleton | Contracts | Compiles |
| All test files with deploy fixtures | Contracts | Tests run (stubs pass) |
| helpers/deploy.ts, fixtures.ts | Contracts | Shared test harness |

## Week 3 — Stylus and DevOps

### Day 11 — Stylus Common and Compliance

| Task | Owner | Output |
|---|---|---|
| valen-stylus-common crate | Stylus | Common types compile |
| compliance-engine crate skeleton | Stylus | WASM builds |
| eligibility-engine crate skeleton | Stylus | WASM builds |
| build-all.sh | Stylus | Script runs |

### Day 12 — Stylus Risk and Policy

| Task | Owner | Output |
|---|---|---|
| risk-engine crate skeleton | Stylus | WASM builds |
| policy-engine crate skeleton | Stylus | WASM builds |
| All engine tests stubs | Stylus | cargo test passes |
| export-abi.sh | Stylus | ABI export works |

### Day 13 — Docker and Local Stack

| Task | Owner | Output |
|---|---|---|
| docker-compose.yml | DevOps | postgres + redis up |
| backend Dockerfiles | DevOps | Images build |
| scripts/local/bootstrap.sh | DevOps | One-command local start |
| scripts/local/start-all.sh | DevOps | Full stack runs |

### Day 14 — CI Pipelines

| Task | Owner | Output |
|---|---|---|
| ci-backend.yml | DevOps | Backend CI green |
| ci-contracts.yml | DevOps | Contracts CI green |
| ci-stylus.yml | DevOps | Stylus CI green |
| ci-frontend.yml | DevOps | Frontend CI green |
| ci-security.yml | DevOps | Security scan runs |

### Day 15 — Render and Deploy Pipelines

| Task | Owner | Output |
|---|---|---|
| render.yaml + service yamls | DevOps | Render blueprint valid |
| deploy-dev.yml | DevOps | Dev auto-deploy works |
| deploy-staging.yml | DevOps | Staging deploy ready |
| infra/runbooks/* | DevOps | Runbooks written |

## Week 4 — Integration and Validation

### Day 16 — Frontend Shell

| Task | Owner | Output |
|---|---|---|
| App layout, login page, privy integration | Frontend | Auth flow stub |
| Organization layout + sidebar | Frontend | Nav works |
| api-client.ts wired to backend | Frontend | API calls health |
| Placeholder pages for all routes | Frontend | All routes render |

### Day 17 — Backend Integration Test

| Task | Owner | Output |
|---|---|---|
| e2e health test | Backend | Passes |
| auth sync flow test | Backend | Passes with mock Privy |
| queue enqueue/dequeue test | Backend | Passes |
| repository integration tests | Backend | Passes against test DB |

### Day 18 — Contract Local Deploy

| Task | Owner | Output |
|---|---|---|
| deploy-local full stack | Contracts | All contracts deployed locally |
| deployment JSON written | Contracts | backend can read addresses |
| Registry test passes | Contracts | Address resolution works |

### Day 19 — Stylus Local Build Pipeline

| Task | Owner | Output |
|---|---|---|
| build-all.sh in CI | Stylus | CI builds all engines |
| ABI exported to contracts/interfaces or backend config | Stylus | Backend knows engine ABIs |
| register-engines.ts script stub | Contracts | Registry wiring ready |

### Day 20 — Foundation Validation

| Task | Owner | Output |
|---|---|---|
| `pnpm install && pnpm build` | All | Monorepo builds |
| `pnpm test` | All | All tests pass |
| `docker compose up` + bootstrap | DevOps | Local stack healthy |
| `GET /health/ready` returns 200 | Backend | Ready |
| CI all green on main | DevOps | Foundation complete |
| Definition of Done review | All | Section 10 checklist |

---

# SECTION 10 — Definition Of Done

## Monorepo Root

| Criterion | Done When |
|---|---|
| `pnpm install` succeeds | All workspace packages install without error |
| `pnpm build` succeeds | Turbo builds backend, frontend, contracts compile, stylus WASM builds |
| `pnpm test` succeeds | All stub tests pass |
| `pnpm lint` succeeds | No lint errors |
| README documents local start | `scripts/local/bootstrap.sh` documented |

## Backend — Per Module

| Module | Done Criteria |
|---|---|
| **config** | Env validation rejects missing required vars; app fails fast |
| **database** | Connects to Postgres; transaction wrapper works; all repositories exist with typed methods |
| **redis** | Connects; get/set/lock helpers work |
| **health** | `/health/live` returns 200; `/health/ready` checks DB + Redis |
| **auth** | Privy guard verifies JWT; `POST /v1/auth/sync` and `GET /v1/me` return stub responses; guards applied |
| **organizations** | CRUD routes exist; DTOs validated; repository wired; org scope guard applied |
| **agents** | Register, list, get, update, wallet link, suspend, revoke, api-key routes exist; repositories wired |
| **policies** | Create, list, version, submit, publish, activate routes exist; repositories wired |
| **compliance** | Controller, service, worker service, processor, producer exist; TRM/Webacy adapter stubs exist |
| **risk** | Controller, service, worker service, processor, producer exist |
| **settlement** | Controller, service, worker service, processor, alchemy.service stub, chain.service stub exist |
| **audit** | Controller, service, worker service, processor exist; append-only repository methods |
| **notifications** | Controller, service, worker service, processor exist |
| **webhooks** | CRUD routes exist; repository wired |
| **admin** | Admin routes exist; emergency and dead-letter services exist |
| **queues** | All 12 queues registered; all processors register; DLQ config present |
| **observability** | Sentry and PostHog init without error when DSN/key present |
| **scheduler** | All 5 jobs register; scheduler process starts |
| **common** | All guards, filters, interceptors, decorators applied globally |

## Backend — Runtime

| Runtime | Done Criteria |
|---|---|
| API (`main.ts`) | Starts on PORT; all modules load; health returns 200 |
| Worker (`worker.ts`) | Starts; all processors listen; no crash on empty queue |
| Scheduler (`scheduler.ts`) | Starts; all jobs register |

## Database

| Criterion | Done When |
|---|---|
| Migrations 001–013 apply cleanly | `supabase db reset` succeeds locally |
| seed.sql runs | Dev data present |
| RLS enabled on all tenant tables | Migration 012 applied |
| All indexes from blueprint exist | Migration 013 applied |
| No destructive migrations | Forward-only |

## Contracts — Per Contract

| Contract | Done Criteria |
|---|---|
| **IValenRegistry** + **ValenRegistry** | Interface + skeleton compile; deploy script produces address; test file runs |
| **IValenPolicyManager** + **ValenPolicyManager** | Interface + skeleton compile; test stub passes |
| **IValenMandateRegistry** + **ValenMandateRegistry** | Interface + skeleton compile; test stub passes |
| **IValenSettlement** + **ValenSettlement** | Interface + skeleton compile; references registry interfaces; test stub passes |
| **IValenEscrow** + **ValenEscrow** | Interface + skeleton compile; test stub passes |
| **IValenTreasury** + **ValenTreasury** | Interface + skeleton compile; test stub passes |
| **IValenGovernance** + **ValenGovernance** | Interface + skeleton compile; test stub passes |
| **ValenTimelock** | Skeleton compiles |
| **IValenAuditLog** + **ValenAuditLog** | Interface + skeleton compile; test stub passes |
| **IValenEmergencyGuardian** + **ValenEmergencyGuardian** | Interface + skeleton compile; test stub passes |
| **Engine interfaces** | IComplianceEngine, IRiskEngine, IEligibilityEngine, IPolicyEngine compile |
| **Libraries** | ValenErrors, ValenTypes, ValenConstants compile |
| **deploy-local.ts** | Produces deployments/localhost/*.json |
| **hardhat.config.ts** | localhost, arbitrum-sepolia, robinhood-testnet networks configured |

## Stylus — Per Engine

| Engine | Done Criteria |
|---|---|
| **valen-stylus-common** | Types, traits, errors compile; imported by all engines |
| **ComplianceEngine** | Crate builds to WASM; Stylus.toml present; entrypoint skeleton; test stub passes; export-abi produces JSON |
| **RiskEngine** | Same as ComplianceEngine |
| **EligibilityEngine** | Same as ComplianceEngine |
| **PolicyEngine** | Same as ComplianceEngine |
| **build-all.sh** | Builds all four engines without error |
| **export-abi.sh** | Produces ABI artifacts for backend/contracts |
| **rust-toolchain.toml** | Pinned; CI uses same version |

## Infrastructure

| Component | Done Criteria |
|---|---|
| **docker-compose.yml** | `docker compose up` starts postgres + redis |
| **backend Dockerfiles** | All three images build |
| **render.yaml** | Valid Render blueprint; services defined |
| **ci-backend.yml** | Runs on PR; passes with stub tests |
| **ci-contracts.yml** | Runs on PR; compile + test pass |
| **ci-stylus.yml** | Runs on PR; fmt + clippy + test + build pass |
| **ci-frontend.yml** | Runs on PR; build passes |
| **ci-security.yml** | Runs on PR; no secrets in repo |
| **deploy-dev.yml** | Deploys to Render dev on develop merge |
| **bootstrap.sh** | Local full stack starts with one command |
| **runbooks** | local-development, deployment, rollback, emergency-pause, incident-response exist |

## Frontend

| Criterion | Done When |
|---|---|
| All routes from blueprint exist | Pages render without error |
| Privy provider configured | Login page loads |
| api-client.ts points to backend | Health fetch works |
| Vercel config present | Preview deploy succeeds |

## Foundation Complete Gate

Foundation is **DONE** when all of the following are true:

1. `pnpm install && pnpm build && pnpm test && pnpm lint` exit 0 at repo root.
2. `docker compose -f infra/docker/docker-compose.yml up -d` starts postgres and redis.
3. `scripts/local/bootstrap.sh` starts backend API and returns `GET /health/ready` 200.
4. All 13 database migrations apply without error.
5. `npx hardhat compile` and `npx hardhat test` pass in contracts/.
6. `cargo build --release` and `cargo test` pass in stylus/.
7. All GitHub Actions workflows exist and pass on a clean PR to main.
8. Render blueprint validates.
9. No business logic implemented — only scaffolding, stubs, signatures, and empty processors.
10. Section 10 per-module criteria checked for every module, contract, engine, and infra component.

---

**Foundation scaffolding specification complete. Implementation of business logic begins in Phase 4 per module, following this file tree exactly.**
