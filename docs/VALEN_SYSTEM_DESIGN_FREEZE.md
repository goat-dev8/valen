# VALEN Phase 1.5 — System Design Freeze

**Status:** Architecture frozen for implementation planning.  
**Scope:** System design only. No code, contracts, database migrations, schemas, or APIs.  
**Product:** VALEN — The Compliance, Risk and Permission Layer for Agentic Finance.  
**Core flow:** Agent → Intent → Compliance Engine → Risk Engine → Policy Engine → Settlement Approval → Execution.

---

# System Context Diagram

## Complete System Map

```text
                                      ┌────────────────────────────┐
                                      │        GitHub              │
                                      │ repos, CI, reviews, issues │
                                      └─────────────┬──────────────┘
                                                    │
                                                    ▼
┌────────────────────┐     HTTPS/JWT      ┌────────────────────────────┐
│      Frontend      │◄──────────────────►│        Backend             │
│ Vercel app         │                    │ NestJS on Render           │
│ dashboard, console │                    │ API, workers, webhooks     │
└─────────┬──────────┘                    └───────┬─────────┬──────────┘
          │ Privy auth/session                    │         │
          ▼                                        │         │ jobs/events
┌────────────────────┐                             │         ▼
│       Privy        │                             │  ┌──────────────────┐
│ auth, embedded     │                             │  │      Redis       │
│ wallets, sessions  │                             │  │ BullMQ, cache,   │
└─────────┬──────────┘                             │  │ rate limits      │
          │ wallet signing                         │  └────────┬─────────┘
          ▼                                        │           │
┌────────────────────┐                             ▼           ▼
│      Wallets       │                    ┌────────────────────────────┐
│ Privy, EOA, AA     │                    │     PostgreSQL / Supabase  │
│ smart accounts     │                    │ source of truth, audit     │
└─────────┬──────────┘                    └───────────┬────────────────┘
          │ tx / userOp                                │
          ▼                                            │ read/write
┌────────────────────┐                    ┌────────────▼───────────────┐
│      Alchemy       │◄──────────────────►│       Chain Services       │
│ RPC, bundler,      │                    │ tx builder, index sync,    │
│ paymaster support  │                    │ confirmation tracking      │
└─────────┬──────────┘                    └────────────┬───────────────┘
          │ JSON-RPC / ERC-4337                         │
          ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Arbitrum Chains                              │
│                                                                      │
│  ┌──────────────────────────┐    calls     ┌──────────────────────┐ │
│  │ Solidity Contracts       │◄────────────►│ Stylus Rust Engines  │ │
│  │ SettlementGate           │              │ ComplianceEngine     │ │
│  │ MandateRegistry          │              │ RiskEngine           │ │
│  │ AuditLog                 │              │ PolicyEngine         │ │
│  │ ApprovalManager          │              │ ProofVerifier        │ │
│  └───────────┬──────────────┘              └──────────────────────┘ │
│              │                                                       │
│              ▼                                                       │
│  Arbitrum Sepolia, Arbitrum One, Robinhood Chain Testnet/Mainnet     │
└──────────────┬───────────────────────────────────────────────────────┘
               │ events, traces, blocks
               ▼
┌────────────────────┐     indexed data     ┌──────────────────────────┐
│ Indexers           │─────────────────────►│ Backend read models      │
│ The Graph, Envio,  │                      │ settlement status, audit │
│ Allium optional    │                      │ timelines, dashboards    │
└────────────────────┘                      └──────────────────────────┘

┌────────────────────┐                      ┌──────────────────────────┐
│ External Risk &    │ HTTPS / attestations │ Backend / Workers        │
│ Compliance Vendors │─────────────────────►│ compliance enrichment    │
│ TRM, Webacy,       │                      │ risk enrichment          │
│ Chainlink, OpenAI, │                      │ notification dispatch    │
│ Anthropic          │                      └──────────────────────────┘
└────────────────────┘

┌────────────────────┐                      ┌──────────────────────────┐
│ Observability      │ telemetry            │ Engineering / Operations │
│ Sentry, PostHog,   │◄─────────────────────│ alerts, incidents, KPIs  │
│ Render logs        │                      └──────────────────────────┘
└────────────────────┘
```

## Component Communication

| Component | Communicates With | Protocol / Channel | Purpose |
|---|---|---|---|
| Frontend | Backend | HTTPS | Dashboard, console, intent submission, approvals, reporting |
| Frontend | Privy | Privy SDK / browser session | Authentication, wallet connection, embedded wallet UX |
| Frontend | PostHog | Browser telemetry | Product analytics, funnel tracking, UX diagnostics |
| Frontend | Sentry | Browser telemetry | Frontend error tracking |
| Backend | Supabase Postgres | Postgres connection pool / Supabase APIs | Durable source of truth, audit records, operational state |
| Backend | Redis | TCP / managed Redis protocol | BullMQ jobs, idempotency locks, short-lived cache, rate limits |
| Backend | Alchemy | HTTPS JSON-RPC / bundler APIs | Chain reads, transaction submission, user operation submission |
| Backend | Contracts | JSON-RPC via Alchemy or fallback RPCs | Settlement approval, mandate checks, event reconciliation |
| Backend | Indexers | HTTPS GraphQL / REST | Read model enrichment from chain events |
| Backend | TRM / Webacy | HTTPS APIs | Sanctions, counterparty risk, wallet risk, contract risk |
| Backend | Chainlink | Onchain feeds / external services | Price, proof, and compliance-related oracle inputs |
| Backend | OpenAI / Anthropic | HTTPS APIs | Optional agent simulation, policy explanation, natural-language summaries |
| Backend | Sentry | Server telemetry | Error, exception, worker, and latency tracking |
| Backend | PostHog | Server telemetry | Product analytics and operational events |
| Workers | Redis | BullMQ queues | Async intent, compliance, risk, settlement, notification, and audit processing |
| Workers | Supabase Postgres | Postgres | State transitions, job outcomes, audit persistence |
| Workers | Contracts | JSON-RPC | Transaction preparation, submission, confirmation, reconciliation |
| Contracts | Stylus Engines | EVM-compatible contract calls | Onchain compliance, risk, and policy evaluation |
| Contracts | Wallets | Signed transactions / user operations | Settlement execution and approval flows |
| Indexers | Chains | RPC, logs, subgraphs | Contract event indexing and confirmation tracking |
| Monitoring | All runtime services | SDK telemetry, logs, alerts | Reliability, security, and incident response |

## Final System Boundary

VALEN is a hybrid system. The backend orchestrates, persists, enriches, and monitors. The onchain contracts enforce final permission and settlement. Stylus computes risk and policy where onchain determinism matters. Supabase Postgres is the offchain source of truth. Chain state is the settlement authority.

---

# Domain Driven Design

## Domain Map

| Domain | Purpose | Ownership | Primary Boundary |
|---|---|---|---|
| Identity Domain | Users, organizations, auth sessions, roles | Backend + Privy | Human and organization authorization |
| Agent Domain | Agent registration, wallets, capabilities, lifecycle | Backend + onchain registry | Agent identity and operational permissions |
| Mandate Domain | Principal-to-agent delegation, scope, limits, expiry | Contracts + backend | Legal/operational authority for agent actions |
| Intent Domain | Structured action requests before execution | Backend | Agent action normalization and lifecycle |
| Compliance Domain | KYC/AML/sanctions/jurisdiction eligibility | Backend + Stylus + vendors | Whether an action is legally permissible |
| Risk Domain | Financial, behavioral, counterparty, and operational risk scoring | Backend + Stylus | Risk tier and escalation |
| Policy Domain | Organization-defined rules and approval thresholds | Backend + Stylus | Business policy enforcement |
| Settlement Domain | Onchain approval, execution, confirmation, failure recovery | Solidity contracts + backend | Final transaction authority |
| Audit Domain | Immutable audit trail and operational evidence | Contracts + Postgres | Evidence, traceability, regulatory reporting |
| Notification Domain | User, admin, webhook, and incident notifications | Backend workers | Delivery and escalation |
| Administration Domain | Org settings, roles, policy publishing, emergency controls | Backend + contracts | Privileged operations |
| Observability Domain | Errors, telemetry, analytics, security signals | Sentry + PostHog + Render | System health and product behavior |
| Integration Domain | External systems, API keys, webhooks, vendor adapters | Backend | Vendor and customer connectivity |
| Platform Domain | Deployment, environments, CI/CD, secrets, rollback | DevOps | Runtime reliability and release control |

## Identity Domain

**Purpose:** Establish who is using VALEN and what organizational authority they hold.

**Responsibilities:**
- User authentication through Privy.
- Organization membership and role assignment.
- Session trust mapping from Privy identity to VALEN authorization.
- Separation between human users, service accounts, and agents.
- Authorization context for policy administration and approvals.

**Ownership:** Backend application owns authorization state. Privy owns authentication and wallet session primitives.

**Dependencies:** Privy, Supabase Postgres, Redis session/rate-limit cache.

**Boundaries:**
- Does not decide whether an agent action is compliant.
- Does not store raw secrets in user metadata.
- Supabase authorization data must be app-controlled, not user-editable metadata.

## Agent Domain

**Purpose:** Represent autonomous actors that submit intents and may execute financial workflows under mandate.

**Responsibilities:**
- Register agents.
- Bind agent identifiers to wallets or smart accounts.
- Track agent status, capabilities, and allowed integration channels.
- Maintain agent lifecycle: active, suspended, revoked, archived.
- Link agents to organizations and mandates.

**Ownership:** Backend for operational metadata. Contracts for enforcement-relevant identity bindings.

**Dependencies:** Identity Domain, Mandate Domain, Privy/Alchemy wallets, optional ERC-8004 registry.

**Boundaries:**
- Agents do not receive unlimited authority by registration alone.
- Agent metadata is not compliance evidence unless attested.
- Agent-generated inputs are untrusted until validated.

## Mandate Domain

**Purpose:** Define scoped, time-bounded, capped authority from a principal or organization to an agent.

**Responsibilities:**
- Create, activate, revoke, expire, and freeze mandates.
- Store mandate scope, asset permissions, limits, jurisdiction, and expiry.
- Track cumulative usage and execution history.
- Provide onchain enforcement hooks for settlement.
- Align with ERC-8226 Regulated Agent Mandate principles.

**Ownership:** Solidity contracts own enforcement truth. Backend mirrors and enriches state.

**Dependencies:** Agent Domain, Identity Domain, Compliance Domain, Settlement Domain.

**Boundaries:**
- Mandates are permission envelopes, not settlement instructions.
- A mandate cannot override token issuer compliance.
- A revoked or expired mandate must fail closed.

## Intent Domain

**Purpose:** Normalize an agent’s proposed action into a structured, auditable request before any settlement.

**Responsibilities:**
- Accept agent intent submissions.
- Validate basic shape, idempotency, organization, mandate reference, and action type.
- Track lifecycle from created to validated, rejected, approved, executed, failed, or cancelled.
- Coordinate queue handoff to compliance, risk, policy, and settlement workers.

**Ownership:** Backend.

**Dependencies:** Agent Domain, Mandate Domain, Redis, Supabase Postgres.

**Boundaries:**
- Intent creation is not settlement approval.
- Intent validation is syntactic and operational, not compliance approval.
- Raw intent payloads are treated as untrusted input.

## Compliance Domain

**Purpose:** Determine whether an intent is legally, jurisdictionally, and counterparty permissible.

**Responsibilities:**
- Evaluate KYC/AML status.
- Check sanctions, denylist, jurisdiction restrictions, and asset eligibility.
- Validate compliance attestations and expiry.
- Produce structured pass/fail reason codes.
- Fail closed on stale, missing, or contradictory compliance data.

**Ownership:** Backend for enrichment and vendor integration. Stylus for deterministic onchain checks. Solidity for final settlement gating.

**Dependencies:** TRM Labs, Webacy, Chainlink, ComplianceProvider contracts, Mandate Domain, Agent Domain.

**Boundaries:**
- Compliance does not calculate financial risk.
- Compliance does not execute transactions.
- Vendor results are not trusted unless time-bounded and bound to the intent or address being evaluated.

## Risk Domain

**Purpose:** Quantify financial and operational risk of an otherwise compliant intent.

**Responsibilities:**
- Score transaction amount, asset volatility, counterparty risk, velocity, concentration, agent behavior, and anomaly signals.
- Classify risk into LOW, MEDIUM, HIGH, or CRITICAL.
- Determine whether human approval or multi-sig is required.
- Keep risk assessments reproducible and auditable.

**Ownership:** Backend for enrichment and analytics. Stylus for onchain scoring and proof verification.

**Dependencies:** Compliance Domain, Policy Domain, Chainlink/market data, Webacy/TRM, historical executions.

**Boundaries:**
- Risk score cannot override compliance failure.
- Risk score cannot directly execute settlement.
- ML-derived results are advisory unless attested and policy-approved.

## Policy Domain

**Purpose:** Apply organization-configured rules to compliant and risk-scored intents.

**Responsibilities:**
- Manage policy drafts, versions, approvals, and active publication.
- Evaluate limits, approvals, asset constraints, counterparty constraints, time windows, and operational thresholds.
- Bind policy version to every verdict.
- Provide deterministic verdicts for settlement.

**Ownership:** Backend for authoring/versioning. Stylus for deterministic evaluation. Solidity for final enforcement binding.

**Dependencies:** Identity Domain, Administration Domain, Risk Domain, Compliance Domain, Mandate Domain.

**Boundaries:**
- Policy cannot weaken mandatory compliance controls.
- Draft policy cannot affect live settlements.
- Policy changes require auditable version transitions.

## Settlement Domain

**Purpose:** Execute or reject final onchain actions after compliance, risk, and policy decisions.

**Responsibilities:**
- Submit settlement approval to Solidity contracts.
- Enforce mandate validity, nonces, replay protection, and final checks.
- Execute target calls or token transfers.
- Track confirmations, reorg risk, failures, and retries.
- Reconcile backend state with chain events.

**Ownership:** Solidity contracts own final authority. Backend owns transaction orchestration and reconciliation.

**Dependencies:** Alchemy, fallback RPCs, wallets, contracts, indexers, Audit Domain.

**Boundaries:**
- Backend approval alone is insufficient.
- Settlement must not depend on mutable offchain state after final onchain approval.
- Any mismatch between DB and chain resolves in favor of chain state.

## Audit Domain

**Purpose:** Preserve durable, tamper-evident records for every material action and decision.

**Responsibilities:**
- Record lifecycle events, reason codes, policy versions, risk versions, actor identity, and chain references.
- Maintain immutable onchain audit commitments.
- Maintain queryable offchain audit records.
- Support compliance reporting and incident review.

**Ownership:** Backend and contracts jointly.

**Dependencies:** All domains.

**Boundaries:**
- Audit records are append-only.
- Audit logging failure must not silently disappear; it routes to dead letter and incident review.
- Sensitive raw PII is not stored in public logs or onchain events.

## Notification Domain

**Purpose:** Deliver operational, compliance, approval, and incident messages.

**Responsibilities:**
- Notify approvers, admins, agents, customer systems, and internal operators.
- Dispatch email, webhook, in-app, and incident alerts.
- Track delivery status and retries.
- Rate-limit noisy or failing destinations.

**Ownership:** Backend workers.

**Dependencies:** Audit Domain, Policy Domain, Settlement Domain, external notification providers.

**Boundaries:**
- Notifications are not the source of truth.
- Failed notification does not reverse settlement.
- High-risk operational alerts require escalation policies.

## Administration Domain

**Purpose:** Control privileged configuration and emergency authority.

**Responsibilities:**
- Manage organizations, roles, policy publication, API keys, webhooks, and emergency actions.
- Initiate kill switches and mandate freezes.
- Enforce multi-person approval for critical changes.
- Keep administrative actions auditable.

**Ownership:** Backend for admin UX and workflow. Contracts for onchain privileged controls.

**Dependencies:** Identity Domain, Policy Domain, Settlement Domain, Audit Domain.

**Boundaries:**
- No single hot key should control production settlement.
- Admin actions require stronger authentication and logging.
- Emergency controls must be scoped and reversible where possible.

---

# Event Driven Architecture

## Event Backbone Decision

VALEN uses an internal event-driven architecture implemented through durable database records plus BullMQ job dispatch. Events are first-class domain facts, persisted in Postgres, and then fanned out to queues for asynchronous processing.

Kafka is not used in Phase 1.5 because the team needs production-grade reliability without operating a streaming platform prematurely. Redis Streams alone is not used as the primary event ledger because Redis is not the durable compliance source of truth. BullMQ is used for jobs; Postgres is used for event history.

## Event Catalog

| Event | Producer | Consumer | Payload | Storage | Retention |
|---|---|---|---|---|---|
| UserCreated | Identity service | Audit, notification, admin read models | User reference, org reference, auth provider reference | Postgres event log | 7 years |
| OrganizationCreated | Identity service | Administration, audit | Organization reference, creator, plan | Postgres event log | 7 years |
| AgentRegistered | Agent service | Mandate, audit, notification | Agent reference, org reference, wallet reference, status | Postgres + optional onchain event | 7 years |
| AgentWalletLinked | Agent service | Compliance, settlement, audit | Agent reference, wallet reference, chain, proof reference | Postgres event log | 7 years |
| AgentSuspended | Agent service / admin | Intent, settlement, notification, audit | Agent reference, reason, actor | Postgres event log | 7 years |
| MandateCreated | Mandate service / contract indexer | Compliance, policy, audit | Mandate reference, principal, agent, scope reference, limits reference | Postgres + onchain event | 7 years minimum |
| MandateActivated | Contract indexer | Intent, settlement, notification | Mandate reference, chain reference, activation actor | Postgres + onchain event | 7 years minimum |
| MandateRevoked | Admin / contract indexer | Intent, settlement, notification, audit | Mandate reference, reason, actor, effective time | Postgres + onchain event | 7 years minimum |
| MandateExpired | Scheduler | Intent, settlement, notification, audit | Mandate reference, expiry time | Postgres event log | 7 years |
| IntentCreated | Agent SDK / backend | Intent validation queue, audit | Intent reference, agent, mandate, action type, payload hash | Postgres event log | 7 years |
| IntentValidated | Intent worker | Compliance queue, audit | Intent reference, validation outcome | Postgres event log | 7 years |
| IntentRejected | Intent worker | Notification, audit | Intent reference, rejection reason | Postgres event log | 7 years |
| ComplianceRequested | Intent worker | Compliance worker | Intent reference, compliance context reference | Postgres + BullMQ job | 7 years |
| CompliancePassed | Compliance worker / Stylus result | Risk queue, audit | Intent reference, reason code, attestation references, expiry | Postgres event log | 7 years |
| ComplianceFailed | Compliance worker / Stylus result | Notification, audit | Intent reference, reason code, failed control references | Postgres event log | 7 years |
| RiskCalculationRequested | Compliance worker | Risk worker | Intent reference, risk context reference | Postgres + BullMQ job | 7 years |
| RiskCalculated | Risk worker / Stylus result | Policy queue, audit | Intent reference, score band, model/version reference, factors summary | Postgres event log | 7 years |
| RiskEscalated | Risk worker | Approval workflow, notification, audit | Intent reference, tier, required approval level | Postgres event log | 7 years |
| PolicyEvaluationRequested | Risk worker | Policy worker | Intent reference, policy version reference | Postgres + BullMQ job | 7 years |
| PolicyApproved | Policy worker / Stylus result | Settlement queue, audit | Intent reference, policy version, verdict reference | Postgres event log | 7 years |
| PolicyRejected | Policy worker / Stylus result | Notification, audit | Intent reference, policy version, reason code | Postgres event log | 7 years |
| HumanApprovalRequested | Policy / risk worker | Notification, admin UI, audit | Intent reference, approver group, deadline | Postgres event log | 7 years |
| HumanApprovalGranted | Admin UI | Settlement queue, audit | Intent reference, approver reference, approval proof | Postgres event log | 7 years |
| HumanApprovalDenied | Admin UI | Notification, audit | Intent reference, approver reference, denial reason | Postgres event log | 7 years |
| SettlementRequested | Policy / approval worker | Settlement worker | Intent reference, verdict reference, chain target | Postgres + BullMQ job | 7 years |
| SettlementSubmitted | Settlement worker | Confirmation worker, audit | Intent reference, transaction hash, chain, nonce reference | Postgres event log | 7 years |
| SettlementExecuted | Contract indexer / confirmation worker | Audit, notification, read models | Intent reference, transaction hash, block reference, result | Postgres + onchain event | 7 years minimum |
| SettlementFailed | Settlement worker / indexer | Retry logic, notification, audit | Intent reference, failure reason, transaction reference | Postgres event log | 7 years |
| SettlementReconciled | Indexer worker | Audit, admin read models | Chain event reference, database state transition | Postgres event log | 7 years |
| AuditLogged | Audit service / contract indexer | Reporting, monitoring | Audit reference, related entity, hash commitment reference | Postgres + optional onchain event | 7 years minimum |
| NotificationQueued | Any domain service | Notification worker | Recipient reference, channel, template reference, priority | Postgres + BullMQ job | 2 years |
| NotificationDelivered | Notification worker | Audit, analytics | Notification reference, destination, delivery result | Postgres event log | 2 years |
| NotificationFailed | Notification worker | Retry, dead letter, monitoring | Notification reference, failure reason | Postgres event log | 2 years |
| WebhookDispatched | Notification worker | Audit, integration read models | Webhook reference, destination, result | Postgres event log | 2 years |
| VendorCheckRequested | Compliance / risk worker | Vendor adapter | Vendor, subject reference, intent reference | Postgres event log | 7 years |
| VendorCheckCompleted | Vendor adapter | Compliance / risk worker, audit | Vendor, result reference, expiry, confidence | Postgres event log | 7 years |
| VendorCheckFailed | Vendor adapter | Retry, dead letter, monitoring | Vendor, error class, subject reference | Postgres event log | 7 years |
| PolicyVersionPublished | Admin service | Policy worker, audit, notification | Policy version reference, publisher, activation time | Postgres event log | 7 years |
| EmergencyPauseActivated | Admin / contract indexer | All workers, notification, audit | Scope, actor, reason, chain reference | Postgres + onchain event | 7 years minimum |
| EmergencyPauseLifted | Admin / contract indexer | All workers, notification, audit | Scope, actor, reason, chain reference | Postgres + onchain event | 7 years minimum |
| DeadLetterCreated | Queue system | Operations, audit | Original event/job reference, failure reason, retry count | Postgres + BullMQ DLQ | 7 years if compliance-related; 90 days otherwise |

## Event Storage Principles

- Postgres stores domain events as durable compliance evidence.
- Redis/BullMQ stores executable jobs and retry metadata.
- Onchain events store settlement-critical facts and audit commitments.
- Indexers reconcile chain truth into Postgres read models.
- Events are append-only; correction happens through compensating events.

---

# Queue Architecture

## Queue Technology Decision

| Option | Decision | Reason |
|---|---|---|
| BullMQ | **Chosen** | Best fit for NestJS + Redis, retries, delayed jobs, priorities, DLQs, operational simplicity |
| Redis Streams | Not primary | Useful primitive, but less ergonomic for job orchestration and retries in NestJS |
| Kafka | Rejected for Phase 1.5 | Operationally heavy, unnecessary until high-volume multi-service streaming is proven |
| Nothing | Rejected | Intent, compliance, risk, settlement, and notifications require async retries and isolation |

## Final Decision

Use **BullMQ on Redis** for asynchronous job execution. Use **Postgres as durable event history**. Use Redis only for queues, locks, rate limits, short-lived caches, and retry state.

## Queues

| Queue | Purpose | Producers | Consumers | Priority |
|---|---|---|---|---|
| intent.queue | Validate and normalize incoming intents | API service, Agent SDK endpoint | Intent workers | High |
| compliance.queue | Run compliance checks and vendor enrichment | Intent workers | Compliance workers | High |
| risk.queue | Calculate risk assessments | Compliance workers | Risk workers | High |
| policy.queue | Evaluate active policy version | Risk workers, approval workers | Policy workers | High |
| settlement.queue | Submit and monitor onchain settlement | Policy workers, approval workers | Settlement workers | Critical |
| confirmation.queue | Confirm transactions and reconcile chain events | Settlement workers, indexers | Confirmation workers | Critical |
| audit.queue | Persist audit records and onchain commitments | All services | Audit workers | Critical |
| notification.queue | Dispatch email, webhook, in-app, incident alerts | All services | Notification workers | Medium |
| vendor.queue | Isolate external vendor calls | Compliance/risk workers | Vendor adapter workers | Medium |
| indexer.queue | Process indexed chain events | Indexer adapter | Reconciliation workers | High |
| maintenance.queue | Expiry checks, mandate sweeps, cleanup | Scheduler | Maintenance workers | Low |
| dead-letter.queue | Quarantine repeatedly failing jobs | All queues | Operations review workers | Critical visibility |

## Retry Strategy

| Job Type | Retry Policy | Notes |
|---|---|---|
| Intent validation | 1 immediate retry | Failures usually data-related |
| Compliance vendor calls | Exponential backoff, capped retries | Vendor outage must fail closed if required check unavailable |
| Risk calculation | Limited retry | Deterministic failures indicate bad input or model/config issue |
| Policy evaluation | Limited retry | Deterministic failures route to incident review |
| Settlement submission | Strict idempotency, cautious retry | Nonce and transaction hash safety required |
| Confirmation tracking | Repeated retry until timeout | Chain delays expected |
| Notification dispatch | Exponential backoff | Does not block settlement finality |
| Audit persistence | Aggressive retry + alert | Audit failures are critical |

## Dead Letter Rules

- Every queue has a DLQ path.
- Compliance, settlement, and audit DLQ items trigger Sentry alerts.
- DLQ records are persisted in Postgres for review.
- No job is discarded silently.
- Manual replay requires admin authorization and audit logging.

## Idempotency Rules

- Every intent has an idempotency key.
- Every settlement has a chain, nonce, transaction, and intent binding.
- Every vendor check is keyed by vendor, subject, intent, and expiry window.
- Every queue transition is safe to replay.

---

# Database Modeling Freeze

This section lists domain tables only. It intentionally does not define columns, constraints, SQL, indexes, RLS policies, migrations, or schemas.

## Identity and Organization

| Table | Purpose |
|---|---|
| users | Human users mapped to authentication identities |
| organizations | Customer organizations and tenants |
| organization_memberships | User membership and role assignment within organizations |
| roles | Platform and organization role definitions |
| permissions | Fine-grained authorization capabilities |
| service_accounts | Non-human operational accounts for integrations |
| user_sessions | Session references, security posture, and revocation tracking |

## Agents and Wallets

| Table | Purpose |
|---|---|
| agents | Registered autonomous agents |
| agent_wallets | Wallets or smart accounts controlled by agents |
| agent_capabilities | Declared and approved agent abilities |
| agent_status_history | Lifecycle history for activation, suspension, revocation |
| agent_identity_links | Links to ERC-8004 or other external identity registries |

## Mandates

| Table | Purpose |
|---|---|
| mandates | Principal-to-agent authority records |
| mandate_scopes | Scope definitions for assets, actions, jurisdictions, and limits |
| mandate_limits | Spending, velocity, frequency, and time-window limits |
| mandate_status_history | Activation, revocation, expiry, freeze, and update history |
| mandate_usage | Cumulative usage tracking for mandates |
| mandate_documents | Offchain legal or policy document references and hashes |

## Intents

| Table | Purpose |
|---|---|
| intent_requests | Agent-submitted action requests |
| intent_payloads | Structured payload references and hashes |
| intent_validations | Syntactic and operational validation outcomes |
| intent_state_transitions | Lifecycle transitions for every intent |
| intent_idempotency_keys | Replay prevention and duplicate detection |

## Compliance

| Table | Purpose |
|---|---|
| compliance_attestations | KYC/AML/sanctions/jurisdiction attestations |
| compliance_checks | Per-intent compliance evaluations |
| compliance_reason_codes | Controlled vocabulary for compliance outcomes |
| compliance_providers | External or internal compliance provider registry |
| compliance_provider_results | Raw vendor result references and normalized summaries |
| jurisdiction_rules | Jurisdiction-level eligibility and restriction metadata |
| counterparty_screenings | Wallet, entity, or contract screening records |

## Risk

| Table | Purpose |
|---|---|
| risk_assessments | Per-intent risk outcomes |
| risk_factors | Factor definitions used by risk models |
| risk_factor_results | Per-factor evaluation summaries |
| risk_models | Versioned model definitions and metadata |
| risk_model_versions | Published versions used for auditability |
| risk_thresholds | LOW, MEDIUM, HIGH, CRITICAL thresholds by organization/policy |
| risk_escalations | Required approval escalations caused by risk outcomes |

## Policy

| Table | Purpose |
|---|---|
| policy_sets | Organization policy containers |
| policy_rules | Individual business rules |
| policy_versions | Immutable published policy versions |
| policy_drafts | Editable policy work in progress |
| policy_evaluations | Per-intent policy verdicts |
| policy_approvals | Administrative approval of policy publication |
| policy_change_logs | Audit trail for policy changes |

## Settlement

| Table | Purpose |
|---|---|
| settlement_approvals | Final approval records before execution |
| settlements | Settlement lifecycle records |
| settlement_transactions | Onchain transaction tracking |
| settlement_failures | Failed transaction and execution records |
| settlement_reconciliations | Database-to-chain reconciliation history |
| chain_networks | Supported chain metadata |
| contract_deployments | Known deployed contract addresses and versions |
| nonce_locks | Operational nonce coordination and replay prevention |

## Audit

| Table | Purpose |
|---|---|
| audit_logs | Append-only operational and domain audit records |
| audit_events | Normalized event ledger for domain facts |
| audit_commitments | Onchain or hash commitment references |
| audit_exports | Generated compliance or customer report metadata |
| incident_records | Security, compliance, and operational incidents |

## Notifications and Integrations

| Table | Purpose |
|---|---|
| notifications | Notification records and statuses |
| notification_preferences | User and organization notification settings |
| webhook_endpoints | Customer webhook destinations |
| webhook_deliveries | Webhook delivery attempts and results |
| api_keys | Customer API key metadata and lifecycle |
| integration_connections | Connected vendor and customer integrations |
| integration_events | Inbound and outbound integration event records |

## Platform and Operations

| Table | Purpose |
|---|---|
| job_runs | Background job execution records |
| dead_letter_jobs | Failed jobs requiring review |
| rate_limit_records | Abuse prevention and quota enforcement |
| feature_flags | Controlled rollout configuration |
| environment_configs | Non-secret environment configuration records |
| admin_actions | Privileged operational action history |
| emergency_actions | Kill switch, pause, and recovery action history |

## Supabase Security Freeze

- All exposed tables must use RLS.
- Authorization data must not rely on user-editable metadata.
- Service role keys never appear in frontend code.
- Security-definer functions, if ever needed later, must live outside exposed schemas.
- Views exposed to clients must not bypass RLS.
- Audit, compliance, settlement, and mandate tables are treated as regulated evidence.

---

# External Integrations Inventory

| Integration | Purpose | Required? | Cost | Risk | Alternative |
|---|---|---:|---|---|---|
| Privy | Auth, embedded wallets, wallet UX | Required | Low to medium; scales with users/wallets | Vendor lock-in for auth/wallet UX | Dynamic, Web3Auth, Clerk + wallet adapter |
| Alchemy | RPC, bundler, smart wallets, gas manager | Required | Medium; scales with RPC and AA volume | RPC outages, rate limits, account abstraction dependency | QuickNode, Infura, Ankr, public RPC fallback |
| Supabase | PostgreSQL, auth-adjacent storage, operational DB | Required | Low to high; database size and compute driven | RLS mistakes, connection limits, platform dependency | Neon, RDS Postgres, Crunchy, self-managed Postgres |
| Redis | BullMQ, locks, cache, rate limits | Required | Low to medium | Memory loss if misused as source of truth | Upstash, Render Redis, AWS ElastiCache |
| Render | Backend and worker hosting | Required initially | Low to medium | Cold starts/plan limits if under-provisioned | Fly.io, Railway, AWS ECS, GCP Cloud Run |
| Vercel | Frontend hosting | Required initially | Low to medium | Function limits if backend logic leaks into frontend | Netlify, Cloudflare Pages, Render static |
| GitHub | Source control, CI, security workflows | Required | Low | Supply-chain and CI secret exposure | GitLab, Bitbucket |
| Sentry | Error tracking and alerting | Required | Low to medium; event volume driven | Sensitive data leakage in traces | Axiom + custom alerts, Honeycomb, Datadog |
| PostHog | Product analytics, funnels, feature flags | Required for product telemetry | Low to medium; event volume driven | Privacy risk if over-collected | Amplitude, Mixpanel, Plausible |
| Chainlink | Price feeds, oracle inputs, compliance patterns | Required for production-grade risk inputs | Medium; depends on feeds/services | Oracle trust assumptions and feed availability | Pyth, RedStone, Chronicle, internal oracle adapter |
| TRM Labs | Sanctions, AML, wallet/entity screening | Optional for MVP; required for enterprise | High | Commercial access, false positives, jurisdiction complexity | Chainalysis, Elliptic, ComplyAdvantage |
| Webacy | Wallet, transaction, contract, approval risk | Optional but useful | Medium | Coverage gaps, vendor confidence | GoPlus, Blockaid, Hypernative |
| OpenAI | Optional agent simulation/explanation | Optional | Usage-based, medium | Data privacy, hallucination, dependency | Anthropic, local models, no LLM path |
| Anthropic | Optional agent simulation/explanation | Optional | Usage-based, medium | Data privacy, hallucination, dependency | OpenAI, local models, no LLM path |
| The Graph | Contract event indexing | Optional initially; useful at scale | Low to medium | Subgraph lag, indexing complexity | Envio, Allium, direct RPC indexer |
| Envio | Fast indexing and backend read models | Optional but recommended | Low to medium | Vendor and hosted indexer dependency | The Graph, custom indexer |
| Allium | Institutional-grade blockchain analytics | Optional | Medium to high | Cost and availability | Dune, Goldsky, custom warehouse |
| Public RPCs | Fallback chain reads | Optional fallback | Low/free | Rate limits, reliability | Paid Alchemy/QuickNode/Infura |
| Robinhood Chain Faucet | Testnet funds | Required for testnet only | Free | Availability limits | Sepolia bridge/faucets |
| Arbitrum RPCs | Chain access and fallback | Required | Free to paid | Rate limits and outages | Alchemy, Ankr, LlamaRPC, self-hosted node |

---

# MCP Architecture

## Do We Need MCP?

Yes, but MCP is not in the critical settlement path. MCP is used for developer productivity, controlled agent operations, and future customer-facing agent integrations. It must not become an unchecked path to mutate production state.

## MCP Use Cases

| MCP Area | Needed? | Why |
|---|---:|---|
| GitHub MCP | Yes | PR review, issue management, release coordination, CI diagnostics |
| Supabase MCP | Yes for dev/staging | Database inspection, advisors, SQL review, safe operational visibility |
| Filesystem MCP | Yes locally | Developer agent access to repository context |
| Browser MCP | Optional | Manual UI verification, dashboard QA, bug reproduction |
| Custom VALEN MCP | Yes, later | Agent frameworks need a typed way to submit intents and query verdicts |
| Agent SDK MCP | Yes, later | Allows AI agents to integrate with VALEN without direct backend coupling |

## MCP Architecture

```text
┌──────────────────────────────┐
│ Developer / Operator Agent   │
└──────────────┬───────────────┘
               │ MCP tools
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Control Plane                        │
│                                                             │
│ GitHub MCP      → repo, PRs, issues, CI                     │
│ Supabase MCP    → dev/staging DB inspection and advisors    │
│ Filesystem MCP  → local repository context                  │
│ Browser MCP     → UI verification and QA                    │
│ VALEN MCP       → controlled intent and policy operations   │
└──────────────┬──────────────────────────────────────────────┘
               │ strict auth, scopes, audit, environment gates
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    VALEN Backend                            │
│ MCP adapter, API gateway, authorization, audit logging       │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│        Postgres + Redis + Contracts + External Vendors       │
└─────────────────────────────────────────────────────────────┘
```

## MCP Security Freeze

- No production MCP mutation without explicit environment gates.
- MCP actions require user, organization, role, and purpose binding.
- All MCP tool calls that affect data are audit logged.
- Custom VALEN MCP exposes intent submission and status first, not admin controls.
- Supabase MCP is allowed for development and staging; production access requires break-glass policy.
- Browser MCP is QA-only, not production operations.

---

# Security Boundary Map

## Trusted Systems

| System | Trust Level | Notes |
|---|---|---|
| Solidity contracts | Highest for settlement state | Chain-enforced final authority |
| Stylus engines | High for deterministic onchain evaluation | Must be activated, versioned, audited |
| Supabase Postgres | High for offchain source of truth | RLS and secret hygiene critical |
| Backend workers | High operational trust | Must be locked down by environment and IAM |
| Admin multi-sig | High privileged trust | Required for contract emergency controls |
| GitHub protected branches | High engineering trust | CI and review policy required |

## Untrusted Systems

| System | Reason |
|---|---|
| Agents | Autonomous inputs can be malicious, malformed, or compromised |
| User browsers | Client-side state can be manipulated |
| Wallet signatures | Valid signature does not imply compliant intent |
| Vendor APIs | Vendor outages, false positives, false negatives |
| Public RPCs | Rate limits, inconsistent responses, possible censorship |
| Webhooks | Customer endpoints can fail, replay, or leak data |
| LLM providers | Non-deterministic and not authoritative |

## External Inputs

- Agent intents.
- Wallet addresses and signatures.
- Webhook calls.
- Vendor risk/compliance responses.
- Market/oracle data.
- Admin policy edits.
- Contract events from indexers.
- RPC responses.
- MCP tool requests.
- Uploaded documents and legal references.

## Attack Surfaces

| Surface | Risk |
|---|---|
| Public API | Auth bypass, rate abuse, intent spam |
| Agent SDK | Replay attacks, forged agent identity, invalid mandate reference |
| Admin console | Privilege escalation, policy tampering |
| Queue workers | Poison jobs, replay, idempotency gaps |
| Settlement signer | Key compromise, nonce race, unauthorized execution |
| Smart contracts | Reentrancy, access control bugs, mandate bypass |
| Stylus contracts | WASM activation/version issues, deterministic build risk |
| Supabase | RLS mistakes, service role leakage, SQL injection |
| Webhooks | SSRF, delivery abuse, secret leakage |
| MCP | Over-permissive tools, production mutation without review |
| CI/CD | Secret exfiltration, dependency compromise |

## Critical Assets

- Settlement authority contracts.
- Admin and multi-sig keys.
- Backend signing keys and transaction submitter keys.
- Supabase service role key.
- Privy secrets.
- Alchemy keys and bundler/paymaster credentials.
- Vendor API keys.
- Customer compliance records.
- Mandates and policy versions.
- Audit logs and onchain commitments.
- Production database backups.

## Secrets

| Secret | Storage Rule |
|---|---|
| Supabase service role key | Backend/worker environment only; never frontend |
| Database connection string | Backend/worker secret manager |
| Privy app secret | Backend only |
| Alchemy API keys | Backend and deployment only |
| Settlement signer key | Prefer KMS/HSM or managed signer; never plain env long term |
| Vendor API keys | Backend secret manager |
| Sentry DSN | Public DSN allowed for client; auth tokens secret |
| PostHog key | Public client key allowed; personal/API keys secret |
| GitHub tokens | CI secrets only, least privilege |

## Admin Controls

- Organization owner controls.
- Platform super-admin controls.
- Policy publisher role.
- Compliance operator role.
- Emergency pause authority.
- Mandate freeze/revoke authority.
- Contract owner/multi-sig authority.
- Production deploy approval.
- DLQ replay approval.

## Kill Switches

| Kill Switch | Scope |
|---|---|
| Global settlement pause | Blocks all settlement execution |
| Organization pause | Blocks one tenant |
| Agent suspension | Blocks one agent |
| Mandate freeze | Blocks one mandate |
| Asset freeze | Blocks intents involving one asset |
| Counterparty denylist | Blocks one address/entity |
| Vendor outage fail-closed | Blocks required compliance checks during vendor failure |
| Queue drain pause | Stops processing new async jobs |
| Paymaster disable | Stops gas sponsorship |

## Emergency Procedures

1. Detect incident via Sentry, monitoring, vendor alert, chain anomaly, or admin report.
2. Classify severity: compliance, settlement, data, vendor, platform, or security.
3. Activate scoped pause if settlement risk exists.
4. Preserve evidence: logs, audit events, chain references, queue state.
5. Rotate affected secrets if compromise is plausible.
6. Reconcile database state against chain truth.
7. Notify affected organizations if required.
8. Patch and review through expedited but auditable release process.
9. Lift pause only after multi-person approval.
10. Produce incident record and postmortem.

---

# DevOps Topology

## Repositories

| Repository | Purpose |
|---|---|
| valen-app | Frontend, backend, workers, shared types, infrastructure docs |
| valen-contracts | Solidity contracts, Stylus contracts, deployment artifacts |
| valen-docs | Public docs, integration guides, architecture docs |
| valen-mcp | Future custom VALEN MCP server and agent SDK MCP tools |

For early implementation, a monorepo is acceptable if it preserves clear package boundaries. Contract code may be split once audit and release workflows mature.

## Branches

| Branch | Purpose |
|---|---|
| main | Production-ready, protected |
| develop | Integration branch for dev environment |
| feature/* | Feature work |
| fix/* | Bug fixes |
| release/* | Staging hardening and release candidates |
| hotfix/* | Emergency production patches |

## Environments

| Environment | Purpose | Data | Chain |
|---|---|---|---|
| Local | Developer workstation | Local or sandbox data | Local fork / test RPC |
| Dev | Shared development | Non-sensitive test data | Arbitrum Sepolia / Robinhood testnet |
| Staging | Production rehearsal | Sanitized production-like data | Testnet deployments mirroring prod |
| Production | Customer-facing | Real customer and compliance data | Arbitrum One / Robinhood mainnet when available |

## Deployment Flow

1. Feature branch created from develop.
2. Pull request opened with tests, lint, security checks, and review.
3. Merge to develop deploys to Dev.
4. Release branch cut from develop.
5. Release branch deploys to Staging.
6. Staging smoke tests, queue tests, contract integration checks, and rollback rehearsal.
7. Approved release merged to main.
8. Production deploy triggered from main.
9. Post-deploy verification: health checks, queue drain, Sentry, chain reconciliation, critical user journeys.

## Contract Deployment Flow

1. Contracts deployed to testnet.
2. Stylus contracts checked, deployed, activated, and version recorded.
3. Contract addresses registered in environment config.
4. Backend staging points to new contract set.
5. Verification and smoke tests run.
6. Production deployment requires multi-sig/admin approval.
7. Contract deployment artifacts are immutable release artifacts.

## Rollback Flow

| Layer | Rollback Strategy |
|---|---|
| Frontend | Vercel instant rollback to previous deployment |
| Backend | Render rollback to previous image/release |
| Workers | Pause queues, rollback worker image, replay safe jobs |
| Database | Avoid destructive migrations; use forward fixes; backups for disaster recovery |
| Contracts | Prefer pausable and versioned contracts; no blind rollback assumption |
| Policy | Revert active policy version to previous published version |
| Stylus | Keep previous engine deployment active; route SettlementGate/config to approved version where designed |

## Release Strategy

- Trunk-based with release branches for stabilization.
- Feature flags for risky backend/frontend behavior.
- Contract releases are versioned and staged separately.
- Policy releases are versioned as data with approval workflow.
- High-risk changes require staged rollout and monitoring.

## Versioning Strategy

| Artifact | Versioning |
|---|---|
| Backend | Semantic version per release |
| Frontend | Same release train as backend |
| Contracts | Immutable deployment version plus semantic contract package version |
| Stylus engines | Contract version + Stylus SDK version + activation metadata |
| Policies | Monotonic policy version per organization |
| Risk models | Model version and factor version |
| API | Versioned public API path when external API is introduced |
| MCP tools | Tool version and capability version |

---

# Cost Analysis

Planning estimates only. Actual costs depend on vendor contracts, chain activity, log volume, RPC volume, and compliance provider pricing.

## Monthly Cost Estimates

| Scale | Supabase | Render | Vercel | Redis | Alchemy / RPC | Sentry | PostHog | Storage / Indexing | Compliance Vendors | Estimated Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Development | $25–$100 | $25–$100 | $0–$20 | $0–$50 | $0–$100 | $0–$30 | $0–$50 | $0–$50 | $0–$500 | $50–$1,000 |
| Beta | $100–$500 | $100–$500 | $20–$100 | $50–$200 | $100–$500 | $30–$150 | $50–$250 | $50–$300 | $500–$2,500 | $1,000–$5,000 |
| 100 users | $100–$700 | $200–$800 | $20–$150 | $50–$300 | $200–$1,000 | $50–$300 | $100–$500 | $100–$500 | $1,000–$5,000 | $2,000–$9,000 |
| 1,000 users | $500–$2,000 | $800–$3,000 | $100–$500 | $200–$800 | $1,000–$5,000 | $200–$1,000 | $500–$2,000 | $500–$2,500 | $5,000–$25,000 | $9,000–$40,000 |
| 10,000 users | $2,000–$8,000 | $3,000–$12,000 | $500–$2,000 | $800–$3,000 | $5,000–$25,000 | $1,000–$5,000 | $2,000–$10,000 | $2,500–$10,000 | $25,000–$100,000 | $45,000–$175,000 |
| 100,000 users | $8,000–$40,000 | $15,000–$75,000 | $2,000–$10,000 | $3,000–$20,000 | $25,000–$150,000 | $5,000–$25,000 | $10,000–$60,000 | $10,000–$75,000 | $100,000–$500,000+ | $180,000–$955,000+ |

## Cost Drivers

| Driver | Notes |
|---|---|
| Compliance checks | TRM/Chainalysis-style pricing can dominate enterprise cost |
| RPC and transaction volume | Intent simulation, reads, writes, confirmations, and AA bundling increase costs |
| Audit retention | Long retention increases database and storage costs |
| Product analytics | High event volume requires sampling and governance |
| Error telemetry | Noisy errors can unexpectedly increase Sentry spend |
| Indexing | Custom indexing becomes necessary at scale |
| Chain gas | Paid by customers, agents, paymaster, or VALEN depending on model |

## Cost Controls

- Cache vendor results where legally and operationally valid.
- Use per-organization quotas and rate limits.
- Sample non-critical telemetry.
- Separate hot operational data from cold audit archives.
- Use queue backpressure to protect vendors and RPC budgets.
- Offer paid enterprise plans for high compliance-check volume.

---

# Final Technology Decisions

| Area | Chosen Tool | Alternative | Why Alternative Was Rejected | Confidence |
|---|---|---|---|---:|
| Backend framework | NestJS | Express/Fastify only | NestJS gives modules, DI, guards, queues, testing structure for enterprise backend | 0.90 |
| Database | PostgreSQL on Supabase | MongoDB | Compliance and audit data require relational integrity and transactions | 0.95 |
| Cache/queues | Redis + BullMQ | Kafka | Kafka is overkill before multi-service event streaming scale | 0.88 |
| Frontend hosting | Vercel | Render static / Netlify | Vercel is strongest for modern frontend deployment and previews | 0.85 |
| Backend hosting | Render | AWS ECS | Render is faster for early production; AWS can replace later at scale | 0.78 |
| Auth/wallet UX | Privy | Clerk + custom wallet stack | Privy reduces wallet onboarding complexity | 0.82 |
| RPC provider | Alchemy | Public RPC only | Public RPCs are not production-grade and lack bundler/paymaster support | 0.90 |
| Smart contracts | Solidity + OpenZeppelin | All Stylus | Solidity is best for settlement, standards, token hooks, audits | 0.95 |
| Compute contracts | Rust Stylus | Solidity risk engine | Stylus is materially better for compute-heavy risk/policy evaluation | 0.92 |
| Contract libraries | OpenZeppelin Solidity + OZ Stylus | Custom libraries | Security-critical code should use audited patterns | 0.95 |
| Indexing | Envio first, The Graph optional | Direct RPC only | Direct RPC polling becomes fragile and expensive | 0.82 |
| Error monitoring | Sentry | Logs only | Logs alone do not provide tracing, grouping, alerting | 0.93 |
| Product analytics | PostHog | Mixpanel | PostHog supports product analytics and feature flags with strong developer ergonomics | 0.85 |
| Compliance vendor | TRM Labs for enterprise path | Webacy only | Webacy is useful but TRM has stronger institutional compliance positioning | 0.75 |
| Risk vendor | Webacy optional | Build all risk data internally | External wallet/contract risk accelerates coverage | 0.72 |
| Oracle | Chainlink | Internal oracle only | Chainlink is established and credible for financial data | 0.88 |
| AI providers | OpenAI + Anthropic optional | One provider only | Dual-provider optionality reduces vendor lock and model risk | 0.70 |
| Event ledger | Postgres domain events | Redis-only events | Redis is not the compliance source of truth | 0.92 |
| Job processor | BullMQ | Plain cron | Workflows require retries, priorities, DLQs, idempotency | 0.90 |
| MCP | Controlled MCP layer | No MCP | Agentic finance needs safe agent integration paths and developer operations | 0.78 |
| CI/CD | GitHub Actions | Render-only deploy hooks | CI must run tests, security checks, and release gates before deployment | 0.90 |
| Deployment environments | Local, Dev, Staging, Production | Dev + Prod only | Compliance/settlement systems require staging rehearsal | 0.96 |
| Secrets | Platform secret managers, future KMS | Plain `.env` everywhere | Production secrets require centralized access control and rotation | 0.92 |
| Settlement signer | Managed signer/KMS target | Raw private key env var | Raw keys are unacceptable for production settlement authority | 0.90 |
| Data authorization | RLS + backend authorization | Backend-only authorization | Supabase exposed schemas require RLS defense in depth | 0.94 |

---

# Architecture Approval Checklist

## Product and Scope

- [ ] Confirm VALEN is infrastructure, not DEX, wallet, Robinhood clone, or chatbot.
- [ ] Confirm core flow: Agent → Intent → Compliance → Risk → Policy → Settlement Approval → Execution.
- [ ] Confirm initial user segment: agent developers, fintech platforms, RWA issuers, compliance-sensitive protocols.
- [ ] Confirm demo flow includes both approval and rejection paths.
- [ ] Confirm no legal claims exceed infrastructure/compliance tooling positioning.

## System Architecture

- [ ] Approve hybrid architecture: backend orchestration, Postgres source of truth, Redis jobs, Solidity settlement, Stylus compute.
- [ ] Approve component communication map.
- [ ] Approve chain targets: Arbitrum Sepolia and Robinhood Chain Testnet first.
- [ ] Approve production targets: Arbitrum One and Robinhood mainnet when available.
- [ ] Approve indexer strategy and chain reconciliation model.

## Domain Design

- [ ] Approve all domains and ownership boundaries.
- [ ] Approve that chain state wins over database state for settlement truth.
- [ ] Approve mandate domain alignment with ERC-8226 principles.
- [ ] Approve agent identity compatibility with ERC-8004 direction.
- [ ] Approve audit domain as append-only evidence layer.

## Event Architecture

- [ ] Approve event catalog.
- [ ] Approve Postgres as durable event ledger.
- [ ] Approve BullMQ as async job processor.
- [ ] Approve event retention requirements.
- [ ] Approve DLQ and replay governance.

## Queue Architecture

- [ ] Approve BullMQ over Kafka and Redis Streams for Phase 1.5.
- [ ] Approve all queue names and responsibilities.
- [ ] Approve retry policies.
- [ ] Approve idempotency rules.
- [ ] Approve settlement queue as critical priority.

## Data Architecture

- [ ] Approve table/domain model list.
- [ ] Approve no schema implementation until Phase 2.
- [ ] Approve Supabase RLS requirement for exposed tables.
- [ ] Approve no service role exposure to frontend.
- [ ] Approve audit/compliance/settlement retention posture.

## Security

- [ ] Approve trusted and untrusted system boundaries.
- [ ] Approve external input threat model.
- [ ] Approve critical asset inventory.
- [ ] Approve secret storage rules.
- [ ] Approve admin controls and multi-person approval requirements.
- [ ] Approve kill switches and emergency procedures.
- [ ] Approve fail-closed compliance behavior.

## DevOps

- [ ] Approve repository topology.
- [ ] Approve branch strategy.
- [ ] Approve environment topology.
- [ ] Approve deployment flow.
- [ ] Approve rollback flow.
- [ ] Approve contract deployment flow.
- [ ] Approve versioning strategy.

## Integrations

- [ ] Approve required integrations: Privy, Alchemy, Supabase, Redis, Render, Vercel, GitHub, Sentry, PostHog.
- [ ] Approve optional integrations: TRM, Webacy, Chainlink advanced services, OpenAI, Anthropic, The Graph, Envio, Allium.
- [ ] Approve fallback RPC strategy.
- [ ] Approve vendor risk and alternative plan.

## MCP

- [ ] Approve MCP as non-settlement-path infrastructure.
- [ ] Approve GitHub, Supabase, Filesystem, Browser, Custom VALEN, and Agent SDK MCP roles.
- [ ] Approve production MCP restrictions.
- [ ] Approve audit logging for MCP mutations.

## Cost and Business

- [ ] Approve monthly cost ranges as planning estimates.
- [ ] Approve compliance vendors as likely largest variable cost.
- [ ] Approve telemetry sampling and vendor caching as cost controls.
- [ ] Approve enterprise pricing requirement for high-volume compliance usage.

## Implementation Gate

- [ ] Confirm no code has been generated in Phase 1.5.
- [ ] Confirm no contracts have been generated in Phase 1.5.
- [ ] Confirm no database migrations or schemas have been generated in Phase 1.5.
- [ ] Confirm architecture ambiguity is resolved enough to start Phase 2 planning.
- [ ] Obtain explicit approval before implementation begins.

---

**Freeze conclusion:** VALEN will proceed as a production-grade, hybrid onchain/offchain compliance and settlement platform. The architecture is frozen around NestJS, Supabase Postgres, Redis/BullMQ, Solidity/OpenZeppelin, Rust Stylus, Render, Vercel, Privy, Alchemy, Sentry, and PostHog, with optional enterprise compliance and indexing integrations introduced behind clear boundaries.
