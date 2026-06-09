# VALEN Backend and Smart Contract Masterplan

**Status:** Phase 2 implementation plan.  
**Scope:** Production backend, database, contracts, Stylus, DevOps, security, wallet, indexing, and deployment plan.  
**Non-goals:** No implementation code, no generated contracts, no SQL migration files, no source APIs.  
**Product:** VALEN, the Compliance, Risk and Permission Layer for Agentic Finance.

---

# Repository Structure

## Monorepo Layout

```text
valen/
  frontend/
  backend/
  contracts/
  stylus/
  scripts/
  infra/
  docs/
```

## Directory Ownership

| Directory | Owner | Purpose |
|---|---|---|
| `frontend/` | Frontend engineer | Vercel application, dashboard, admin console, approvals UI |
| `backend/` | Backend engineer | NestJS API, workers, queue processors, integrations, auth, data access |
| `contracts/` | Smart contract engineer | Solidity contracts, Foundry tests, deployment config, verification metadata |
| `stylus/` | Stylus engineer | Rust Stylus engines, unit tests, ABI exports, activation metadata |
| `scripts/` | Backend + DevOps + contracts | Operational scripts, deployment orchestration, local bootstrap, verification commands |
| `infra/` | DevOps engineer | Render blueprints, environment documentation, monitoring config, runbooks |
| `docs/` | All leads | Architecture, API specs, threat model, deployment runbooks, audit docs |

## Proposed Internal Layout

```text
backend/
  src/
    app/
    common/
    config/
    database/
    queues/
    modules/
      auth/
      organizations/
      agents/
      policies/
      compliance/
      risk/
      settlement/
      audit/
      notifications/
      admin/
      webhooks/
      integrations/
      observability/
  test/
  docs/

contracts/
  src/
  test/
  script/
  deployments/
  audits/
  docs/

stylus/
  engines/
    compliance-engine/
    risk-engine/
    eligibility-engine/
    policy-engine/
  crates/
  tests/
  deployments/
  docs/

scripts/
  local/
  deploy/
  verify/
  ops/

infra/
  render/
  github/
  sentry/
  posthog/
  runbooks/

docs/
  architecture/
  api/
  database/
  contracts/
  security/
  operations/
```

## Monorepo Rules

- `backend/` must never import source from `frontend/`.
- `frontend/` consumes generated API documentation or shared type packages only after explicit contract freeze.
- `contracts/` and `stylus/` expose ABI artifacts to backend through release artifacts, not source imports.
- `docs/` is the authoritative planning and review source.
- Deployment artifacts are immutable once promoted to staging or production.

---

# Backend Architecture

## NestJS Application Model

VALEN uses a modular NestJS backend with three runtime modes:

| Runtime | Purpose | Render Service |
|---|---|---|
| API server | REST API, auth, admin, webhook ingestion | `valen-api` |
| Worker service | BullMQ processors for intents, compliance, risk, settlement, audit, notifications | `valen-worker` |
| Scheduler service | Periodic jobs for expiry, reconciliation, keepalive checks, monitoring | `valen-scheduler` |

All runtimes share configuration, logging, database, queue, and observability modules. Runtime-specific modules are enabled by environment.

## Core Backend Modules

| Module | Purpose |
|---|---|
| Auth Module | Authentication, Privy token verification, session context, RBAC guards |
| Organization Module | Tenant model, memberships, team management |
| Agent Module | Agent registration, wallet binding, status, capabilities, agent API access |
| Policy Module | Policy authoring, versions, publication, evaluation orchestration |
| Compliance Module | KYC/AML/sanctions/jurisdiction checks, vendor adapters, compliance verdicts |
| Risk Module | Risk scoring orchestration, factor collection, model versioning, escalation |
| Settlement Module | Transaction preparation, settlement approval, chain submission, confirmation tracking |
| Audit Module | Immutable audit event writing, evidence exports, onchain commitment tracking |
| Notification Module | Email, webhook, in-app, incident notification dispatch |
| Admin Module | Platform and organization administration, emergency actions, support tooling |
| Webhook Module | Customer webhook endpoints and delivery management |
| Integration Module | Alchemy, Privy, TRM, Webacy, Chainlink, Envio, The Graph, Sentry, PostHog adapters |
| Queue Module | BullMQ queue registration, processors, DLQ, idempotency |
| Database Module | Supabase Postgres connection, repositories, transactions, RLS-aware access |
| Observability Module | Logs, tracing, Sentry, PostHog, health checks |
| Config Module | Typed environment loading and validation |

## Auth Module

**Purpose:** Authenticate humans, service accounts, and agent API clients.

**Responsibilities:**
- Verify Privy-issued access tokens.
- Resolve authenticated user to VALEN user and organization context.
- Enforce RBAC guards on every protected route.
- Authenticate service accounts using hashed API keys.
- Authenticate agent clients using agent API credentials and optional wallet signature.
- Provide request-scoped security context.

**Dependencies:** Privy, users, organizations, team_members, api_keys, Redis rate limits.

**Boundaries:**
- Does not decide compliance or settlement authority.
- Does not trust user-editable metadata for authorization.
- Never exposes Supabase service role credentials.

## Organization Module

**Purpose:** Manage tenant ownership, members, and organization-level settings.

**Responsibilities:**
- Create and manage organizations.
- Manage members, invitations, roles, and deactivation.
- Store organization settings including default chain, policy mode, risk thresholds.
- Enforce tenant isolation.

**Dependencies:** Auth Module, Audit Module, Notification Module.

## Agent Module

**Purpose:** Manage autonomous agents that submit intents.

**Responsibilities:**
- Register agents under organizations.
- Bind agent wallets or smart accounts.
- Track agent lifecycle: draft, active, suspended, revoked.
- Store allowed action types and capability declarations.
- Issue and rotate agent API credentials.
- Coordinate onchain registry updates when required.

**Dependencies:** Auth, Organization, Wallet, Settlement, Audit.

## Policy Module

**Purpose:** Manage policy rule sets and active policy versions.

**Responsibilities:**
- Create policy drafts.
- Validate policy definitions at design level.
- Publish immutable policy versions.
- Assign active policy version per organization, agent, mandate, or asset class.
- Queue policy evaluations for intents.
- Persist policy verdicts and reason codes.

**Dependencies:** Risk, Compliance, Settlement, Audit, Admin.

## Compliance Module

**Purpose:** Determine whether an intent is legally and operationally permissible.

**Responsibilities:**
- Run identity, mandate, sanctions, jurisdiction, counterparty, asset, and attestation checks.
- Call TRM and Webacy when configured.
- Normalize vendor responses into compliance_checks.
- Enforce expiry on compliance attestations.
- Produce structured reason codes.
- Fail closed when required checks are unavailable.

**Dependencies:** Agent, Mandate contract reads, TRM, Webacy, Chainlink, Audit, Queue.

## Risk Module

**Purpose:** Score the risk of intents that pass compliance.

**Responsibilities:**
- Collect risk factors: amount, velocity, asset volatility, counterparty risk, agent history, concentration.
- Call external risk sources where enabled.
- Request Stylus RiskEngine evaluation when onchain scoring is required.
- Store risk_scores.
- Trigger escalations for HIGH and CRITICAL tiers.

**Dependencies:** Compliance, Policy, Settlement, Chainlink, Webacy, Audit.

## Settlement Module

**Purpose:** Turn approved intents into onchain settlement actions.

**Responsibilities:**
- Prepare transaction payloads.
- Enforce idempotency and nonce locks.
- Submit transactions through Alchemy.
- Submit ERC-4337 UserOperations where enabled.
- Track confirmations and finality.
- Reconcile events from indexers.
- Handle settlement failures and retries.

**Dependencies:** Alchemy, contracts, wallets, Redis locks, Audit, Notification.

## Audit Module

**Purpose:** Preserve immutable evidence for all material events.

**Responsibilities:**
- Write audit_logs for every state transition.
- Store hash commitments for sensitive payloads.
- Track onchain audit commitments emitted by contracts.
- Generate export metadata for compliance reports.
- Record admin and emergency actions.

**Dependencies:** All modules.

## Notification Module

**Purpose:** Deliver messages to humans, agents, and customer systems.

**Responsibilities:**
- Queue and send notifications.
- Dispatch webhooks.
- Track delivery attempts and failures.
- Escalate critical alerts.
- Rate-limit and disable failing endpoints.

**Dependencies:** Webhook Module, Audit, Queue, Sentry.

## Admin Module

**Purpose:** Support privileged operations with strong audit controls.

**Responsibilities:**
- Manage platform admins.
- Approve policy publication where required.
- Suspend organizations or agents.
- Trigger emergency pause flows.
- Review dead letter jobs.
- Replay safe jobs.

**Dependencies:** Auth, Audit, Settlement, Queue, Contracts.

---

# Database Design

## Database Principles

- Supabase PostgreSQL is the offchain source of truth.
- Chain state is the source of truth for settlement execution.
- Every tenant-owned table includes organization scoping.
- All exposed tables require RLS.
- Audit, settlement, compliance, and risk records are append-heavy and should not be destructively updated.
- Sensitive payloads are stored as references, hashes, encrypted fields, or private storage objects.
- Indexes are defined around access patterns, not speculative optimization.

## Required Tables

### `organizations`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| name | text | Display name |
| slug | text | Unique human-readable identifier |
| status | enum | active, suspended, archived |
| plan | enum | dev, beta, pro, enterprise |
| default_chain_id | integer | Default execution chain |
| risk_mode | enum | conservative, standard, custom |
| compliance_mode | enum | fail_closed, monitor_only |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Unique index on slug.
- Index on status.

**Relationships:**
- Has many users through team_members.
- Has many agents, policies, executions, settlements, webhooks, api_keys.

### `users`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| privy_user_id | text | Privy identity reference |
| email | text | User email |
| display_name | text | User display name |
| status | enum | active, invited, suspended, deleted |
| last_login_at | timestamptz | Last successful login |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Unique index on privy_user_id.
- Unique partial index on email where email is not null.
- Index on status.

**Relationships:**
- Belongs to organizations through team_members.
- Produces audit_logs and admin actions.

### `team_members`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| user_id | uuid | User reference |
| role | enum | Organization role |
| status | enum | active, invited, suspended, removed |
| invited_by_user_id | uuid | Inviter reference |
| joined_at | timestamptz | Join time |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Unique index on organization_id + user_id.
- Index on organization_id + role.
- Index on status.

**Relationships:**
- Belongs to organization.
- Belongs to user.

### `agents`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| name | text | Agent display name |
| description | text | Agent description |
| status | enum | draft, active, suspended, revoked, archived |
| agent_type | enum | hosted, external, service, experimental |
| external_ref | text | Customer or framework reference |
| default_policy_id | uuid | Default policy reference |
| metadata | jsonb | Non-authoritative metadata |
| created_by_user_id | uuid | Creator |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Index on organization_id + status.
- Index on default_policy_id.
- GIN index on metadata only if query patterns require it.

**Relationships:**
- Belongs to organization.
- Has many api_keys.
- Has many executions.
- Has many compliance_checks and risk_scores through executions.

### `agent_wallets`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| agent_id | uuid | Agent reference |
| organization_id | uuid | Tenant reference |
| chain_id | integer | Chain identifier |
| wallet_address | text | EVM address |
| wallet_type | enum | privy, safe, zerodev, turnkey, eoa, kms |
| status | enum | active, rotated, revoked |
| is_primary | boolean | Primary wallet for chain |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Unique index on chain_id + wallet_address.
- Unique partial index on agent_id + chain_id where is_primary is true and status is active.
- Index on organization_id + chain_id.

**Relationships:**
- Belongs to agent.
- Used by executions and settlements.

### `policies`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| name | text | Policy name |
| description | text | Policy description |
| status | enum | draft, active, disabled, archived |
| active_version_id | uuid | Active policy version |
| created_by_user_id | uuid | Creator |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Index on organization_id + status.
- Index on active_version_id.

**Relationships:**
- Has many policy_versions.
- Referenced by agents and executions.

### `policy_versions`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| policy_id | uuid | Policy reference |
| organization_id | uuid | Tenant reference |
| version_number | integer | Monotonic version |
| status | enum | draft, pending_approval, published, retired |
| rules | jsonb | Policy rule document |
| rules_hash | text | Hash of canonical policy rules |
| published_by_user_id | uuid | Publisher |
| published_at | timestamptz | Publish time |
| created_at | timestamptz | Creation time |

**Indexes:**
- Primary key on id.
- Unique index on policy_id + version_number.
- Index on organization_id + status.
- Index on rules_hash.

**Relationships:**
- Belongs to policy.
- Referenced by executions and policy evaluations.

### `executions`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| agent_id | uuid | Agent reference |
| policy_id | uuid | Policy reference |
| policy_version_id | uuid | Version evaluated |
| mandate_ref | text | Onchain/offchain mandate reference |
| idempotency_key | text | Duplicate prevention |
| action_type | enum | transfer, swap, approve, contract_call, rebalance, custom |
| status | enum | created, validated, compliance_failed, risk_failed, policy_rejected, approval_required, approved, settlement_submitted, executed, failed, cancelled |
| request_payload_hash | text | Hash of canonical request |
| request_payload_ref | text | Private storage reference when needed |
| target_chain_id | integer | Chain target |
| target_address | text | Target contract or counterparty |
| value_amount | numeric | Human-readable amount where applicable |
| asset_address | text | Token or asset address |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Unique index on organization_id + idempotency_key.
- Index on organization_id + status + created_at.
- Index on agent_id + created_at.
- Index on target_chain_id + target_address.
- Index on policy_version_id.

**Relationships:**
- Belongs to organization, agent, policy, policy_version.
- Has one or many compliance_checks, risk_scores, settlements.
- Has many audit_logs.

### `compliance_checks`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| execution_id | uuid | Execution reference |
| status | enum | pending, passed, failed, expired, error |
| reason_code | text | Structured reason |
| provider | text | internal, TRM, Webacy, Chainlink, manual |
| provider_ref | text | Vendor reference |
| subject_type | enum | agent, principal, counterparty, asset, transaction |
| subject_ref | text | Address/entity/asset reference |
| attestation_hash | text | Result hash |
| expires_at | timestamptz | Expiry |
| checked_at | timestamptz | Evaluation time |
| created_at | timestamptz | Creation time |

**Indexes:**
- Primary key on id.
- Index on execution_id.
- Index on organization_id + status + checked_at.
- Index on subject_type + subject_ref.
- Index on expires_at.

**Relationships:**
- Belongs to execution.
- Referenced by audit_logs.

### `risk_scores`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| execution_id | uuid | Execution reference |
| score | integer | 0 to 100 risk score |
| tier | enum | low, medium, high, critical |
| model_version | text | Risk model version |
| factor_summary | jsonb | Non-sensitive factor output |
| score_hash | text | Canonical score hash |
| requires_approval | boolean | Escalation flag |
| calculated_at | timestamptz | Evaluation time |
| created_at | timestamptz | Creation time |

**Indexes:**
- Primary key on id.
- Index on execution_id.
- Index on organization_id + tier + calculated_at.
- Index on model_version.

**Relationships:**
- Belongs to execution.
- Informs policy evaluation and settlement approval.

### `settlements`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| execution_id | uuid | Execution reference |
| chain_id | integer | Chain identifier |
| contract_address | text | VALEN settlement contract |
| target_address | text | Final target |
| status | enum | pending, prepared, submitted, confirmed, failed, reverted, cancelled |
| tx_hash | text | Transaction hash |
| user_operation_hash | text | ERC-4337 user operation hash |
| block_number | bigint | Confirmed block |
| failure_reason | text | Failure summary |
| submitted_at | timestamptz | Submit time |
| confirmed_at | timestamptz | Confirmation time |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Unique partial index on chain_id + tx_hash where tx_hash is not null.
- Unique partial index on chain_id + user_operation_hash where user_operation_hash is not null.
- Index on execution_id.
- Index on organization_id + status + created_at.
- Index on chain_id + block_number.

**Relationships:**
- Belongs to execution.
- Has many audit_logs.

### `audit_logs`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference, nullable for platform events |
| actor_type | enum | user, agent, service_account, system, contract |
| actor_id | uuid/text | Actor reference |
| action | text | Audit action |
| entity_type | text | Entity type |
| entity_id | text | Entity reference |
| event_hash | text | Canonical event hash |
| payload_ref | text | Private storage reference |
| chain_id | integer | Optional chain reference |
| tx_hash | text | Optional transaction hash |
| ip_address | inet | Request IP where applicable |
| user_agent | text | Request user agent where applicable |
| created_at | timestamptz | Audit time |

**Indexes:**
- Primary key on id.
- Index on organization_id + created_at.
- Index on entity_type + entity_id.
- Index on actor_type + actor_id.
- Index on chain_id + tx_hash.
- Index on event_hash.

**Relationships:**
- References any domain entity by type and id.

### `api_keys`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| agent_id | uuid | Optional agent binding |
| name | text | Display name |
| key_prefix | text | Public key prefix |
| key_hash | text | Hashed secret |
| scopes | text[] | Allowed scopes |
| status | enum | active, revoked, expired |
| expires_at | timestamptz | Expiry |
| last_used_at | timestamptz | Last use |
| created_by_user_id | uuid | Creator |
| created_at | timestamptz | Creation time |
| revoked_at | timestamptz | Revocation time |

**Indexes:**
- Primary key on id.
- Unique index on key_prefix.
- Index on organization_id + status.
- Index on agent_id.
- Index on expires_at.

**Relationships:**
- Belongs to organization.
- Optionally belongs to agent.

### `notifications`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| recipient_type | enum | user, role, webhook, platform |
| recipient_ref | text | Recipient reference |
| channel | enum | email, webhook, in_app, slack, incident |
| template | text | Template reference |
| status | enum | queued, sent, delivered, failed, suppressed |
| priority | enum | low, normal, high, critical |
| payload_ref | text | Private payload reference |
| sent_at | timestamptz | Sent time |
| created_at | timestamptz | Creation time |

**Indexes:**
- Primary key on id.
- Index on organization_id + status + created_at.
- Index on recipient_type + recipient_ref.
- Index on priority + status.

**Relationships:**
- May reference users, webhooks, executions, settlements.

### `webhooks`

| Field | Type | Purpose |
|---|---|---|
| id | uuid | Primary identifier |
| organization_id | uuid | Tenant reference |
| name | text | Display name |
| url | text | Destination URL |
| secret_hash | text | Signing secret hash or reference |
| subscribed_events | text[] | Event types |
| status | enum | active, disabled, failing, revoked |
| failure_count | integer | Consecutive failures |
| created_by_user_id | uuid | Creator |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update time |

**Indexes:**
- Primary key on id.
- Index on organization_id + status.
- Index on subscribed_events using GIN if queried.

**Relationships:**
- Belongs to organization.
- Has many webhook delivery attempts through notifications or a future delivery table.

## Additional Required Supporting Tables

The user-required table list is the minimum. Production requires supporting tables:

| Table | Purpose |
|---|---|
| `agent_wallets` | Wallet bindings for agents |
| `mandates` | Offchain mirror of authority grants |
| `contract_deployments` | Active contract addresses per chain and version |
| `chain_networks` | Supported chain metadata |
| `queue_jobs` | Durable job observability |
| `dead_letter_jobs` | Failed jobs requiring review |
| `feature_flags` | Controlled rollout |
| `admin_actions` | Privileged operations |
| `emergency_actions` | Pause, freeze, recovery actions |
| `webhook_deliveries` | Delivery attempts and response metadata |

---

# Smart Contracts

## Contract Architecture

Solidity contracts own final settlement authority, mandate enforcement, registry wiring, treasury controls, and administrative safety. Stylus engines perform compute-heavy evaluation and return deterministic results to Solidity or backend callers.

## Contract List

| Contract | Purpose | Upgrade Decision |
|---|---|---|
| `ValenRegistry.sol` | Canonical registry of VALEN contracts, engines, roles, supported chains | UUPS proxy |
| `ValenPolicyManager.sol` | Policy version hashes, active policy pointers, policy authorization | UUPS proxy |
| `ValenMandateRegistry.sol` | Agent/principal mandate lifecycle and usage accounting | UUPS proxy |
| `ValenSettlement.sol` | Final pre-execution gate and settlement dispatcher | UUPS proxy with strict controls |
| `ValenEscrow.sol` | Optional custody/escrow for controlled flows | Non-upgradeable or UUPS depending custody mode |
| `ValenTreasury.sol` | Protocol fees, payment collection, treasury withdrawals | UUPS behind timelock |
| `ValenGovernance.sol` | Role coordination, proposal references, governance hooks | UUPS or timelock-managed |
| `ValenAuditLog.sol` | Onchain audit commitments and event emission | Non-upgradeable preferred |
| `ValenEmergencyGuardian.sol` | Scoped pause and emergency freeze controls | Non-upgradeable preferred |

## `ValenRegistry.sol`

**Purpose:** Canonical address and version registry.

**Storage:**
- Contract address registry by name and version.
- Stylus engine address registry.
- Supported chain metadata.
- Role references.
- Contract status flags.

**Functions:**
- Register contract address.
- Register Stylus engine address.
- Deprecate contract or engine.
- Resolve current contract address.
- Resolve current engine address.
- Update supported chain status.

**Events:**
- ContractRegistered.
- ContractDeprecated.
- EngineRegistered.
- EngineDeprecated.
- ChainSupportUpdated.

**Access Control:**
- Platform Admin through timelock for normal updates.
- Emergency Guardian can mark contract or engine unsafe.
- Public read access.

## `ValenPolicyManager.sol`

**Purpose:** Bind published policy versions to onchain enforcement.

**Storage:**
- Policy hash by organization or policy namespace.
- Active policy version hash.
- Policy activation timestamp.
- Policy publisher role mapping.
- Retired policy hashes.

**Functions:**
- Publish policy hash.
- Activate policy version.
- Retire policy version.
- Resolve active policy hash.
- Verify policy hash.

**Events:**
- PolicyPublished.
- PolicyActivated.
- PolicyRetired.
- PolicyPublisherUpdated.

**Access Control:**
- Policy Manager role can publish staged policy hashes.
- Timelock required for production activation.
- Emergency Guardian can freeze a policy version.

## `ValenMandateRegistry.sol`

**Purpose:** ERC-8226-aligned authority registry for agents.

**Storage:**
- Mandate records keyed by mandate id.
- Agent address to principal and mandate bindings.
- Asset/action scope hashes.
- Per-transaction, daily, and total caps.
- Expiry and revocation state.
- Usage counters.
- Freeze flags.

**Functions:**
- Grant mandate.
- Activate mandate.
- Revoke mandate.
- Freeze mandate.
- Record execution usage.
- Check mandate validity.
- Resolve principal for agent.
- Check scope and cap.

**Events:**
- MandateGranted.
- MandateActivated.
- MandateRevoked.
- MandateFrozen.
- MandateUsageRecorded.
- MandateExpired.

**Access Control:**
- Principal or organization owner can grant.
- Compliance Officer or Emergency Guardian can freeze.
- Settlement contract can record usage.
- Public read for non-sensitive mandate state.

## `ValenSettlement.sol`

**Purpose:** Final gate for approved execution.

**Storage:**
- Registry address.
- Policy manager address.
- Mandate registry address.
- Stylus engine addresses.
- Execution nonce map.
- Execution status map.
- Pause flags by organization, agent, asset, and global scope.
- Approved executor roles.

**Functions:**
- Submit settlement approval.
- Validate compliance/risk/policy result references.
- Execute approved target call.
- Execute token transfer.
- Execute batch only where explicitly allowed.
- Cancel expired approval.
- Record failed execution.
- Pause and unpause scoped settlement.

**Events:**
- SettlementRequested.
- SettlementApproved.
- SettlementExecuted.
- SettlementFailed.
- SettlementCancelled.
- SettlementPaused.
- SettlementUnpaused.

**Access Control:**
- Settlement Operator can submit approved settlements.
- Contract itself enforces mandate and policy checks.
- Emergency Guardian can pause.
- Timelock controls upgrades and configuration.

## `ValenEscrow.sol`

**Purpose:** Optional custody layer for flows requiring funds to be held before execution.

**Storage:**
- Deposits by organization/principal/asset.
- Locked balances by execution.
- Withdrawal requests.
- Escrow status.

**Functions:**
- Deposit asset.
- Lock funds for settlement.
- Release to target.
- Refund principal.
- Emergency freeze escrow.

**Events:**
- Deposited.
- FundsLocked.
- FundsReleased.
- Refunded.
- EscrowFrozen.

**Access Control:**
- Principal controls deposits and withdrawals.
- Settlement contract can lock and release.
- Emergency Guardian can freeze but not withdraw.
- Treasury cannot seize escrow funds.

## `ValenTreasury.sol`

**Purpose:** Protocol fees and revenue.

**Storage:**
- Fee configuration.
- Fee recipient.
- Accrued fees by asset.
- Withdrawal history.

**Functions:**
- Set fee configuration.
- Accrue fee.
- Withdraw fees.
- Update fee recipient.

**Events:**
- FeeAccrued.
- FeeWithdrawn.
- FeeConfigUpdated.
- FeeRecipientUpdated.

**Access Control:**
- Timelock controls fee changes.
- Treasury multisig controls withdrawals.
- Settlement contract can accrue fees.

## `ValenGovernance.sol`

**Purpose:** Coordinate privileged changes and governance references.

**Storage:**
- Governance roles.
- Timelock address.
- Multisig address.
- Proposal references.
- Execution delay configuration.

**Functions:**
- Register proposal reference.
- Queue governed action.
- Execute governed action after timelock.
- Cancel governed action.

**Events:**
- ProposalRegistered.
- ActionQueued.
- ActionExecuted.
- ActionCancelled.

**Access Control:**
- Governance multisig owns governance actions.
- Timelock enforces delay.

## `ValenAuditLog.sol`

**Purpose:** Immutable onchain evidence commitments.

**Storage:**
- Commitment existence by hash.
- Commitment metadata pointers.
- Emitter authorization.

**Functions:**
- Record audit commitment.
- Verify commitment exists.
- Authorize emitter.

**Events:**
- AuditCommitmentRecorded.
- AuditEmitterUpdated.

**Access Control:**
- Settlement and registry contracts can emit commitments.
- Audit role can record offchain decision commitments.
- No mutation of recorded commitments.

## `ValenEmergencyGuardian.sol`

**Purpose:** Scoped emergency controls.

**Storage:**
- Guardian addresses.
- Pause scopes.
- Freeze scopes.
- Emergency action history references.

**Functions:**
- Pause global settlement.
- Pause organization.
- Pause agent.
- Pause asset.
- Freeze mandate.
- Lift pause after governance approval.

**Events:**
- EmergencyPauseActivated.
- EmergencyPauseLifted.
- MandateEmergencyFrozen.
- GuardianUpdated.

**Access Control:**
- Emergency Guardian can activate pause.
- Timelock or multisig required to lift global pause.
- Guardian cannot withdraw funds.

---

# Stylus Contracts

## Stylus Architecture

Stylus engines are Rust/WASM contracts deployed on Arbitrum chains. They are called by Solidity contracts and backend simulations for deterministic evaluation. They should be stateless or minimally stateful where possible to reduce upgrade and storage complexity.

## `ComplianceEngine.rs`

**Purpose:** Deterministically evaluate compliance status for an intent.

**Architecture:**
- Receives normalized compliance context.
- Validates agent status, mandate state, jurisdiction, asset eligibility, counterparty flags, attestation expiry.
- Returns pass/fail plus reason code and canonical result hash.

**Storage:**
- Engine version.
- Authorized settlement caller.
- Compliance rule root or active rule hash.
- Optional reason code registry hash.

**Inputs:**
- Intent hash.
- Agent identifier.
- Principal reference.
- Mandate reference.
- Asset address.
- Counterparty address.
- Jurisdiction code.
- Compliance attestation hashes.
- Expiry timestamps.

**Outputs:**
- `passed`.
- `reason_code`.
- `result_hash`.
- `engine_version`.
- `expires_at`.

## `RiskEngine.rs`

**Purpose:** Calculate a deterministic risk score for compliant intents.

**Architecture:**
- Uses weighted factors and active model version.
- Supports bounded loops and deterministic scoring only.
- Can verify signed or hash-committed offchain factor summaries.

**Storage:**
- Engine version.
- Active risk model hash.
- Risk tier thresholds.
- Authorized settlement caller.

**Inputs:**
- Intent hash.
- Amount.
- Asset risk factor.
- Counterparty risk factor.
- Agent velocity factor.
- Mandate usage factor.
- Historical behavior summary hash.
- External risk attestation hash and expiry.

**Outputs:**
- Score from 0 to 100.
- Tier: low, medium, high, critical.
- Requires approval flag.
- Result hash.
- Engine version.

## `EligibilityEngine.rs`

**Purpose:** Evaluate whether a principal, agent, asset, and counterparty are eligible for a specific action.

**Architecture:**
- Narrow engine focused on eligibility primitives.
- Can be reused by ComplianceEngine and PolicyEngine.
- Keeps checks composable and auditable.

**Storage:**
- Engine version.
- Eligibility root hashes.
- Authorized updater or registry reference.

**Inputs:**
- Principal reference.
- Agent reference.
- Asset address.
- Counterparty address.
- Scope hash.
- Eligibility attestation hash.

**Outputs:**
- Eligible flag.
- Failed dimension.
- Reason code.
- Result hash.

## `PolicyEngine.rs`

**Purpose:** Evaluate active organization policy against the compliance and risk outputs.

**Architecture:**
- Receives policy version hash and normalized facts.
- Evaluates bounded rule sets.
- Returns approval, rejection, or escalation requirement.

**Storage:**
- Engine version.
- Active policy hash registry reference.
- Maximum rule count.
- Authorized settlement caller.

**Inputs:**
- Intent hash.
- Policy version hash.
- Compliance result hash.
- Risk result hash.
- Mandate state summary.
- Action type.
- Amount and asset.
- Time window.

**Outputs:**
- Verdict: approved, rejected, approval_required.
- Reason code.
- Approval level.
- Result hash.
- Engine version.

---

# API Design

## API Principles

- REST first for production clarity.
- All endpoints require authentication unless explicitly public health endpoints.
- All mutating endpoints require idempotency keys where replay is possible.
- All responses include request id and trace id.
- All errors use structured error codes.
- API versions are prefixed with `/v1`.

## Common Error Codes

| HTTP | Code | Meaning |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Request body or params invalid |
| 401 | `UNAUTHENTICATED` | Missing or invalid credentials |
| 403 | `FORBIDDEN` | Authenticated but lacks permission |
| 404 | `NOT_FOUND` | Resource not found or not visible |
| 409 | `CONFLICT` | Idempotency, duplicate, invalid state transition |
| 422 | `DOMAIN_REJECTED` | Valid request rejected by compliance/risk/policy |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `VENDOR_UNAVAILABLE` | Required external service failed |
| 503 | `SERVICE_UNAVAILABLE` | System paused or unhealthy |

## Health

| Method | Path | Purpose |
|---|---|---|
| GET | `/health/live` | Process liveness |
| GET | `/health/ready` | DB, Redis, queue, and critical config readiness |
| GET | `/health/deep` | Internal-only deep dependency check |

## Auth and User

### `GET /v1/me`

**Response body:**
- user id, email, display name.
- organizations with role.
- active organization context.
- permissions.

**Errors:** `UNAUTHENTICATED`.

### `POST /v1/auth/sync`

**Request body:**
- Privy user reference.
- email.
- wallet references.

**Response body:**
- VALEN user.
- organization membership summary.

**Validation:** Privy token must match request subject.

## Organizations and Team

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/organizations` | Create organization |
| GET | `/v1/organizations/:organizationId` | Read organization |
| PATCH | `/v1/organizations/:organizationId` | Update settings |
| GET | `/v1/organizations/:organizationId/team` | List members |
| POST | `/v1/organizations/:organizationId/team/invitations` | Invite member |
| PATCH | `/v1/organizations/:organizationId/team/:memberId` | Change role/status |

**Create organization request:**
- name.
- slug.
- default chain id.

**Create organization response:**
- organization.
- creator membership.

## Agents

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/organizations/:organizationId/agents` | Register agent |
| GET | `/v1/organizations/:organizationId/agents` | List agents |
| GET | `/v1/organizations/:organizationId/agents/:agentId` | Get agent |
| PATCH | `/v1/organizations/:organizationId/agents/:agentId` | Update agent |
| POST | `/v1/organizations/:organizationId/agents/:agentId/wallets` | Link wallet |
| POST | `/v1/organizations/:organizationId/agents/:agentId/suspend` | Suspend agent |
| POST | `/v1/organizations/:organizationId/agents/:agentId/revoke` | Revoke agent |
| POST | `/v1/organizations/:organizationId/agents/:agentId/api-keys` | Create agent API key |

**Register agent request:**
- name.
- description.
- agent type.
- default policy id.
- capabilities.

**Register agent response:**
- agent.
- registration status.
- next required actions.

## Policies

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/organizations/:organizationId/policies` | Create policy |
| GET | `/v1/organizations/:organizationId/policies` | List policies |
| GET | `/v1/organizations/:organizationId/policies/:policyId` | Get policy |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions` | Create policy version |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions/:versionId/submit` | Submit for approval |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions/:versionId/publish` | Publish policy version |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions/:versionId/activate` | Activate policy version |

**Policy version request:**
- rules document.
- activation strategy.
- approval requirements.

**Policy version response:**
- policy version id.
- rules hash.
- validation result.

## Intents and Executions

| Method | Path | Purpose |
|---|---|---|
| POST | `/v1/organizations/:organizationId/executions` | Submit intent |
| GET | `/v1/organizations/:organizationId/executions` | List executions |
| GET | `/v1/organizations/:organizationId/executions/:executionId` | Get execution |
| POST | `/v1/organizations/:organizationId/executions/:executionId/cancel` | Cancel pending execution |
| GET | `/v1/organizations/:organizationId/executions/:executionId/timeline` | Get audit timeline |

**Submit intent request:**
- agent id.
- idempotency key.
- action type.
- target chain id.
- target address.
- asset address.
- amount.
- mandate reference.
- payload hash or payload reference.
- metadata.

**Submit intent response:**
- execution id.
- status.
- compliance status.
- risk status.
- policy status.
- settlement status.
- next action.

## Compliance

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/organizations/:organizationId/executions/:executionId/compliance` | Read compliance checks |
| POST | `/v1/organizations/:organizationId/compliance/attestations` | Record compliance attestation |
| GET | `/v1/organizations/:organizationId/compliance/subjects/:subjectRef` | Read subject compliance summary |

**Attestation request:**
- subject type.
- subject reference.
- provider.
- attestation hash.
- expiry.
- reason code.

## Risk

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/organizations/:organizationId/executions/:executionId/risk` | Read risk score |
| POST | `/v1/organizations/:organizationId/executions/:executionId/risk/recalculate` | Recalculate risk if allowed |
| GET | `/v1/organizations/:organizationId/risk/models` | List risk model versions |

## Settlement

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/organizations/:organizationId/executions/:executionId/settlement` | Read settlement |
| POST | `/v1/organizations/:organizationId/executions/:executionId/approve` | Human approval for settlement |
| POST | `/v1/organizations/:organizationId/executions/:executionId/settle` | Trigger settlement if authorized |
| POST | `/v1/organizations/:organizationId/settlements/:settlementId/retry` | Retry safe settlement failure |

**Approval request:**
- approval decision.
- reason.
- approval proof or signature reference.

**Settlement response:**
- settlement id.
- status.
- chain id.
- tx hash or user operation hash.
- confirmation state.

## Audit

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/organizations/:organizationId/audit-logs` | Query audit logs |
| GET | `/v1/organizations/:organizationId/audit-logs/:auditLogId` | Read audit log |
| POST | `/v1/organizations/:organizationId/audit-exports` | Request audit export |

## Notifications and Webhooks

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/organizations/:organizationId/notifications` | List notifications |
| PATCH | `/v1/organizations/:organizationId/notifications/:notificationId` | Mark notification state |
| POST | `/v1/organizations/:organizationId/webhooks` | Create webhook |
| GET | `/v1/organizations/:organizationId/webhooks` | List webhooks |
| PATCH | `/v1/organizations/:organizationId/webhooks/:webhookId` | Update webhook |
| DELETE | `/v1/organizations/:organizationId/webhooks/:webhookId` | Disable webhook |
| POST | `/v1/organizations/:organizationId/webhooks/:webhookId/test` | Send test webhook |

## Admin

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/admin/organizations` | Platform organization list |
| POST | `/v1/admin/organizations/:organizationId/suspend` | Suspend organization |
| GET | `/v1/admin/dead-letter-jobs` | Review DLQ |
| POST | `/v1/admin/dead-letter-jobs/:jobId/replay` | Replay job |
| POST | `/v1/admin/emergency/pause` | Activate emergency pause |
| POST | `/v1/admin/emergency/unpause` | Lift emergency pause |

---

# ENV FILES

These are example variable inventories only. Values must be managed through local `.env` files for development and platform secret stores for deployed environments.

## `backend/.env.example`

```dotenv
NODE_ENV=
APP_ENV=
PORT=
PUBLIC_APP_URL=
BACKEND_BASE_URL=

DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

REDIS_URL=
REDIS_TLS_ENABLED=

PRIVY_APP_ID=
PRIVY_SECRET=
PRIVY_JWKS_URL=

ALCHEMY_API_KEY=
ALCHEMY_ARBITRUM_SEPOLIA_RPC=
ALCHEMY_ARBITRUM_MAINNET_RPC=
ALCHEMY_ROBINHOOD_TESTNET_RPC=
ARB_SEPOLIA_RPC=
ARB_MAINNET_RPC=
ROBINHOOD_RPC=
ROBINHOOD_TESTNET_RPC=

SETTLEMENT_SIGNER_MODE=
PRIVATE_KEY=
KMS_KEY_ID=
TURNKEY_ORGANIZATION_ID=
TURNKEY_API_PUBLIC_KEY=
TURNKEY_API_PRIVATE_KEY=

SENTRY_DSN=
SENTRY_ENVIRONMENT=
SENTRY_RELEASE=

POSTHOG_KEY=
POSTHOG_HOST=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=

TRM_API_KEY=
TRM_BASE_URL=
WEBACY_API_KEY=
WEBACY_BASE_URL=
CHAINLINK_CONFIG_REF=

ENVIO_API_KEY=
THE_GRAPH_API_KEY=
ALLIUM_API_KEY=

WEBHOOK_SIGNING_SECRET=
API_KEY_PEPPER=
ENCRYPTION_KEY=

VALEN_REGISTRY_ADDRESS=
VALEN_POLICY_MANAGER_ADDRESS=
VALEN_MANDATE_REGISTRY_ADDRESS=
VALEN_SETTLEMENT_ADDRESS=
VALEN_AUDIT_LOG_ADDRESS=
COMPLIANCE_ENGINE_ADDRESS=
RISK_ENGINE_ADDRESS=
ELIGIBILITY_ENGINE_ADDRESS=
POLICY_ENGINE_ADDRESS=

BULLMQ_PREFIX=
QUEUE_CONCURRENCY_INTENT=
QUEUE_CONCURRENCY_COMPLIANCE=
QUEUE_CONCURRENCY_RISK=
QUEUE_CONCURRENCY_POLICY=
QUEUE_CONCURRENCY_SETTLEMENT=
QUEUE_CONCURRENCY_AUDIT=
QUEUE_CONCURRENCY_NOTIFICATION=

RATE_LIMIT_GLOBAL_RPM=
RATE_LIMIT_AGENT_RPM=
```

## `contracts/.env.example`

```dotenv
PRIVATE_KEY=
DEPLOYER_ADDRESS=

ARB_SEPOLIA_RPC=
ARB_MAINNET_RPC=
ROBINHOOD_RPC=
ROBINHOOD_TESTNET_RPC=

ARBISCAN_API_KEY=
ETHERSCAN_API_KEY=
ROBINHOOD_EXPLORER_API_KEY=

SAFE_MULTISIG_ADDRESS=
TIMELOCK_ADDRESS=
EMERGENCY_GUARDIAN_ADDRESS=
TREASURY_ADDRESS=

VALEN_REGISTRY_PROXY=
VALEN_POLICY_MANAGER_PROXY=
VALEN_MANDATE_REGISTRY_PROXY=
VALEN_SETTLEMENT_PROXY=
VALEN_ESCROW_PROXY=
VALEN_TREASURY_PROXY=
VALEN_GOVERNANCE_PROXY=
VALEN_AUDIT_LOG_ADDRESS=
VALEN_EMERGENCY_GUARDIAN_ADDRESS=

COMPLIANCE_ENGINE_ADDRESS=
RISK_ENGINE_ADDRESS=
ELIGIBILITY_ENGINE_ADDRESS=
POLICY_ENGINE_ADDRESS=
```

## `stylus/.env.example`

```dotenv
PRIVATE_KEY=
PRIVATE_KEY_PATH=

ARB_SEPOLIA_RPC=
ARB_MAINNET_RPC=
ROBINHOOD_RPC=
ROBINHOOD_TESTNET_RPC=

STYLUS_NETWORK=
STYLUS_SDK_VERSION=
CARGO_STYLUS_VERSION=
RUST_TOOLCHAIN_VERSION=

COMPLIANCE_ENGINE_ADDRESS=
RISK_ENGINE_ADDRESS=
ELIGIBILITY_ENGINE_ADDRESS=
POLICY_ENGINE_ADDRESS=

VALEN_SETTLEMENT_ADDRESS=
VALEN_REGISTRY_ADDRESS=

ARBISCAN_API_KEY=
ROBINHOOD_EXPLORER_API_KEY=
```

---

# Render Deployment

## Services

| Service | Type | Runtime | Purpose |
|---|---|---|---|
| `valen-api` | Web service | Node.js | NestJS REST API |
| `valen-worker` | Background worker | Node.js | BullMQ processors |
| `valen-scheduler` | Background worker | Node.js | Cron-like periodic jobs |
| `valen-redis` | Managed Redis | Redis | Queues, locks, cache |

## API Service

**Build command:** install dependencies, build backend package, generate runtime metadata.  
**Start command:** start NestJS API in production mode.  
**Health check:** `/health/ready`.  
**Scaling:** horizontally scalable after sticky-free auth model is verified.  
**Required env:** database, redis, Privy, Alchemy, Sentry, PostHog, contract addresses.

## Worker Service

**Build command:** same backend build.  
**Start command:** start worker runtime.  
**Health check:** worker heartbeat endpoint or process health endpoint.  
**Scaling:** queue-specific concurrency controlled by env variables.  
**Required env:** database, redis, vendors, Alchemy, contract addresses, settlement signer config.

## Scheduler Service

**Build command:** same backend build.  
**Start command:** start scheduler runtime.  
**Health check:** scheduler heartbeat.  
**Responsibilities:** mandate expiry sweeps, settlement reconciliation, Stylus keepalive alerts, DLQ alerts, vendor cache expiry.

## Environment Variables

Render environment groups:

| Group | Services |
|---|---|
| `valen-shared` | API, worker, scheduler |
| `valen-backend-api` | API only |
| `valen-workers` | worker only |
| `valen-scheduler` | scheduler only |
| `valen-secrets-production` | production secret group with restricted access |

## Deployment Rules

- API can deploy independently from workers only if queue payload compatibility is maintained.
- Worker deploys require queue drain or compatibility window.
- Contract address changes require release note and staging verification.
- Production deploys require green health checks and rollback artifact.

---

# Supabase Setup

## Migration Plan

No SQL is generated in this masterplan. The migration sequence should be:

| Migration | Purpose |
|---|---|
| 001_extensions_and_enums | Required Postgres extensions and enum types |
| 002_identity_and_organizations | users, organizations, team_members |
| 003_agents_and_wallets | agents, agent_wallets, api_keys |
| 004_policies | policies, policy_versions |
| 005_executions | executions and lifecycle support |
| 006_compliance | compliance_checks and attestations |
| 007_risk | risk_scores and model references |
| 008_settlements | settlements, contract deployments, chain networks |
| 009_audit | audit_logs and audit event support |
| 010_notifications_webhooks | notifications, webhooks, webhook deliveries |
| 011_platform_ops | dead letters, feature flags, admin actions, emergency actions |
| 012_rls_policies | row level security policies |
| 013_indexes | performance indexes after access pattern confirmation |

## RLS Policies

| Table Group | RLS Rule |
|---|---|
| Organization-owned records | User must be active team member of organization |
| Admin-only records | Platform Admin only |
| Agent API access | API key scope must match organization and agent |
| Audit logs | Readable by Auditor, Organization Owner, Platform Admin; append-only by system |
| Settlements | Read by authorized org roles; write by backend service only |
| Compliance checks | Read by Compliance Officer, Auditor, Owner; write by backend service only |
| Risk scores | Read by Risk Officer, Auditor, Owner; write by backend service only |
| Policy versions | Draft write by Policy Manager; publish requires approval role |

## Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `intent-payloads` | Large or sensitive intent payload references | Private |
| `audit-exports` | Generated audit reports | Private, expiring signed URLs |
| `mandate-documents` | Legal and policy documents | Private |
| `vendor-evidence` | Vendor evidence artifacts where contractually allowed | Private |
| `incident-artifacts` | Incident response evidence | Private, platform admin only |

## Auth Configuration

- Privy is primary authentication.
- Supabase Auth is not the primary user auth system unless explicitly changed later.
- Supabase Postgres RLS must still be configured defensively.
- Backend service role performs server-side privileged operations.
- Frontend must never receive service role credentials.

---

# DevOps

## GitHub Actions

Required workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| backend-ci | PR and merge | Lint, typecheck, unit tests, integration tests |
| contracts-ci | PR and merge | Solidity lint, Foundry tests, coverage |
| stylus-ci | PR and merge | Rust fmt, clippy, tests, WASM build check |
| security-ci | PR and schedule | Dependency audit, secret scan, static checks |
| docs-ci | PR | Link and markdown checks |
| deploy-dev | merge to develop | Deploy dev API/workers |
| deploy-staging | release branch | Deploy staging |
| deploy-production | approved main release | Deploy production |
| contract-verify | manual | Verify contracts on explorers |

## CI/CD Rules

- No production deployment from unprotected branch.
- Required reviewers for backend, contracts, Stylus, and security-sensitive changes.
- Contracts and migrations require additional approval.
- Release artifacts include backend version, contract addresses, Stylus engine addresses, migration version.

## Linting

| Area | Tooling Decision |
|---|---|
| Backend | ESLint, Prettier, TypeScript strict mode |
| Contracts | Forge fmt, Solhint or equivalent, Slither in security workflow |
| Stylus | rustfmt, clippy |
| Docs | markdown linting |

## Testing and Coverage

- Backend minimum coverage target: 80 percent for domain services.
- Contracts minimum coverage target: 90 percent for critical settlement and mandate paths.
- Stylus engines require deterministic fixture tests for every reason code.
- E2E tests cover full intent lifecycle.

## Stylus Build Pipeline

1. Pin Rust toolchain.
2. Build each engine for WASM target.
3. Run unit tests.
4. Run size and compatibility check.
5. Export ABI.
6. Deploy to testnet.
7. Activate contract.
8. Record activation metadata.
9. Verify where explorer support exists.
10. Register engine address in ValenRegistry.

## Contract Verification

- Verify Solidity source after each public deployment.
- Verify proxy implementation and proxy metadata.
- Store compiler version, optimizer settings, constructor/init args, chain id, deployer, tx hash.
- Stylus verification follows Arbitrum/Stylus explorer support and stores reproducible build metadata.

---

# Security

## Threat Model

| Threat | Mitigation |
|---|---|
| Agent submits malicious intent | Strict validation, mandate checks, compliance fail-closed |
| Compromised agent API key | Scoped keys, rotation, rate limits, agent suspension |
| Privilege escalation in dashboard | RBAC guards, RLS, audit logs, permission tests |
| Settlement replay | Idempotency keys, onchain nonces, execution status map |
| Vendor outage | Required checks fail closed, optional checks degrade gracefully |
| RPC inconsistency | Multi-RPC read verification for critical states |
| Contract exploit | OZ patterns, tests, pause, audit, timelock |
| Stylus engine bug | Versioned engines, registry deprecation, fallback pause |
| Key compromise | Multisig, KMS/Turnkey target, secret rotation, emergency pause |
| Database leakage | RLS, least privilege, encryption, private buckets |
| Webhook abuse | Signatures, retries, endpoint disable, SSRF protections |

## Access Control

- Backend RBAC enforced by Auth Module.
- Supabase RLS enforced for exposed data paths.
- Contract roles enforced by OpenZeppelin AccessControl or equivalent.
- Production admin actions require audit logging.
- Emergency actions require explicit reason and incident reference.

## Secrets Management

- Local: `.env` files excluded from git.
- Dev/staging/prod: Render environment secrets and Supabase secret storage where applicable.
- Long term: managed signer or KMS for settlement keys.
- Rotate vendor keys on employee departure, incident, or scheduled interval.
- Never log secrets, bearer tokens, API keys, private keys, or raw compliance payloads.

## Emergency Pause

Emergency pause exists at multiple layers:

| Layer | Pause |
|---|---|
| API | Reject new intent submissions |
| Queue | Pause workers or specific queues |
| Organization | Block one tenant |
| Agent | Suspend agent |
| Contract | Pause settlement |
| Mandate | Freeze authority |
| Asset | Block asset-specific execution |

## Upgrade Strategy

- UUPS proxy for upgradeable core contracts.
- Timelock plus multisig required for production upgrades.
- Emergency Guardian can pause but cannot upgrade.
- Stylus engines are versioned and replaced through registry pointer changes.
- AuditLog and EmergencyGuardian should be non-upgradeable where possible.

## Audit Checklist

- Access control reviewed.
- Reentrancy reviewed.
- Pause and unpause behavior tested.
- Mandate caps cannot be bypassed.
- Batch execution cannot exceed caps.
- Compliance failure always blocks settlement.
- Risk escalation cannot be skipped.
- Policy version hash bound to verdict.
- Settlement idempotency enforced.
- Upgrade authorization tested.
- Stylus activation and engine version recorded.
- Events emitted for every critical state change.

---

# Testing Strategy

## Unit Tests

| Area | Tests |
|---|---|
| Auth | Privy token validation, role checks, service account auth |
| Agents | Registration, wallet linking, suspension, API key rotation |
| Policies | Draft validation, versioning, activation rules |
| Compliance | Reason codes, vendor normalization, fail-closed behavior |
| Risk | Factor calculation, tier mapping, escalation |
| Settlement | Idempotency, nonce locking, status transitions |
| Audit | Append-only writes, payload hashing |
| Notifications | Retry, suppression, webhook signing |

## Integration Tests

- API plus database.
- API plus Redis queues.
- Worker lifecycle from intent to policy verdict.
- Vendor adapter with mocked vendor responses.
- Alchemy adapter with test RPC.
- Supabase RLS policy tests.

## E2E Tests

- Agent submits low-risk intent and settlement succeeds.
- Agent exceeds mandate cap and execution is rejected.
- Compliance vendor unavailable and required check fails closed.
- High-risk intent requires human approval.
- Settlement transaction fails and routes to retry/DLQ as appropriate.
- Emergency pause blocks new settlements.

## Contract Tests

- Registry address resolution.
- Policy hash activation.
- Mandate grant, revoke, freeze, expiry, cap checks.
- Settlement success path.
- Settlement reject paths.
- Treasury fee accrual.
- Escrow lock/release/refund if enabled.
- Timelock and multisig role checks.
- Emergency pause behavior.

## Stylus Tests

- Compliance reason code matrix.
- Risk score factor matrix.
- Eligibility pass/fail dimensions.
- Policy bounded rule evaluation.
- Invalid input rejection.
- Engine version output.
- ABI compatibility with Solidity callers.
- Gas/ink benchmark snapshots.

---

# Deployment Roadmap

## Local

**Goals:**
- Run backend, Postgres, Redis locally or with dev Supabase.
- Run unit and integration tests.
- Use local chain or Arbitrum Sepolia fork where practical.

**Steps:**
1. Configure local env files.
2. Start database and Redis.
3. Apply local migrations when implementation begins.
4. Run backend API and workers.
5. Run contract and Stylus tests.
6. Submit test intent through API.

## Arbitrum Sepolia

**Goals:**
- First full chain integration.
- Deploy Solidity contracts.
- Deploy and activate Stylus engines.
- Verify settlement flow.

**Steps:**
1. Deploy Stylus engines.
2. Activate Stylus engines.
3. Deploy Solidity contracts.
4. Register engine addresses.
5. Configure backend dev/staging env.
6. Run E2E settlement tests.
7. Verify events and indexer sync.

## Robinhood Testnet

**Goals:**
- Robinhood compatibility.
- Validate RPC, explorer, faucet, and Stylus behavior.
- Validate agentic finance demo flow.

**Steps:**
1. Configure Robinhood RPC and chain metadata.
2. Deploy and activate Stylus engines.
3. Deploy Solidity contracts.
4. Register addresses.
5. Run dual-chain E2E tests.
6. Validate account abstraction path if available.

## Arbitrum Mainnet

**Goals:**
- Production deployment for Arbitrum One.

**Steps:**
1. Complete audit readiness checklist.
2. Deploy contracts through production multisig process.
3. Activate Stylus engines.
4. Configure timelock and ownership.
5. Register production addresses.
6. Enable backend production reads.
7. Enable limited settlement allowlist.
8. Gradually expand access.

## Robinhood Mainnet

**Goals:**
- Production deployment when Robinhood Chain mainnet is available.

**Steps:**
1. Confirm final chain parameters.
2. Confirm Stylus support and explorer verification.
3. Deploy engines and contracts.
4. Register addresses.
5. Validate RWA-specific policy flows.
6. Enable production organizations by allowlist.

## Migration Steps

- Generate migrations only after schema review.
- Apply to dev first.
- Run Supabase advisors.
- Apply to staging.
- Run E2E and RLS tests.
- Apply to production in maintenance window if risky.
- Prefer additive migrations.

## Rollback Steps

| Layer | Rollback |
|---|---|
| Backend | Redeploy previous Render release |
| Workers | Pause queues, redeploy previous worker, replay safe jobs |
| Database | Forward-fix preferred; restore only for disaster |
| Contracts | Pause, route to previous registered version if possible |
| Stylus | Deprecate engine and update registry pointer |
| Policy | Reactivate previous policy version |

---

# RBAC MATRIX

## Roles

| Role | Permissions | Restrictions | Escalation Rights |
|---|---|---|---|
| Platform Admin | Manage platform config, suspend organizations, review DLQ, trigger platform emergency procedures | Cannot move customer funds; cannot bypass contract timelock | Can escalate to Emergency Guardian and governance multisig |
| Organization Owner | Manage organization, members, agents, policies, webhooks, API keys | Cannot access other organizations; cannot bypass compliance failures | Can request emergency pause for organization |
| Compliance Officer | Manage compliance attestations, review compliance failures, freeze compliance-sensitive mandates | Cannot publish policy alone unless also Policy Manager; cannot settle funds | Can escalate to organization pause or mandate freeze |
| Risk Officer | Review risk scores, adjust risk thresholds through policy workflow, request escalation | Cannot override compliance failure; cannot execute settlement | Can escalate HIGH/CRITICAL intents to human approval |
| Policy Manager | Draft, submit, and publish policies subject to approval rules | Cannot self-approve where separation of duties is enabled | Can escalate policy activation to Organization Owner |
| Settlement Operator | Trigger approved settlements, retry safe failures, monitor confirmations | Cannot approve own high-risk settlement; cannot change policy or compliance | Can escalate failed settlement to Platform Admin |
| Auditor | Read audit logs, exports, compliance/risk/settlement history | Read-only; cannot mutate operational state | Can flag incident for Compliance Officer or Platform Admin |
| Developer | Access dev/staging resources, logs, non-production configs | No production data or production settlement authority by default | Can request elevated break-glass access |
| Agent | Submit intents within assigned scopes; query own execution status | Cannot approve, settle directly, change policies, or access other agents | None; blocked intents require human roles |
| Service Account | Machine access to scoped APIs and webhooks | Scope-limited, expiring credentials, no dashboard access | None unless explicitly configured |

## Separation of Duties

- Compliance Officer cannot unilaterally execute settlement.
- Settlement Operator cannot publish policy.
- Policy Manager cannot bypass risk escalation.
- Platform Admin cannot withdraw treasury without multisig.
- Emergency Guardian can pause but cannot steal funds or upgrade contracts.

---

# WALLET ARCHITECTURE

## Comparison

| Option | Strengths | Weaknesses | VALEN Use |
|---|---|---|---|
| Privy | Fast auth and embedded wallet UX | Not ideal as sole production treasury custody | User auth, embedded wallets, agent onboarding |
| Safe | Battle-tested multisig and treasury control | More friction for automated agent flows | Treasury, admin multisig, contract ownership |
| ZeroDev | ERC-4337 smart accounts and session keys | Vendor dependency and integration complexity | Agent smart accounts where AA required |
| Turnkey | Secure programmable signing infrastructure | Vendor cost and integration work | Production signer/KMS candidate |
| AWS KMS | Mature key management and IAM | EVM signing integration requires careful design | Backend operational signer candidate |

## Final Architecture

| Wallet Need | Chosen |
|---|---|
| Human auth and onboarding | Privy |
| Organization treasury/admin ownership | Safe multisig |
| Contract ownership | Safe + Timelock |
| Emergency pause | Dedicated Emergency Guardian multisig |
| Agent execution wallet | Privy initially, ZeroDev smart accounts for ERC-4337 flows |
| Backend settlement signer | Turnkey or AWS KMS target; raw private key only in early dev/test |

## Signer Architecture

- Development: local private key allowed.
- Testnet: dedicated deployer key with limited funds.
- Production: managed signer through Turnkey or AWS KMS.
- Contract ownership transferred to Safe and Timelock after deployment.
- Backend signer never owns upgrade authority.

## Multisig Architecture

| Multisig | Purpose | Signers |
|---|---|---|
| Treasury Safe | Protocol funds and fee withdrawals | Founders/finance/security |
| Governance Safe | Timelock proposer/executor governance | Founders/security/technical leads |
| Emergency Guardian Safe | Pause and freeze powers | Security/oncall/founder quorum |

## Treasury Control

- Treasury funds are held in Safe.
- ValenTreasury withdrawals require Safe.
- Fee changes require timelock.
- Emergency Guardian cannot withdraw.

## Emergency Recovery

- If backend signer compromised: pause settlement, rotate signer, revoke API keys, reconcile pending settlements.
- If Safe signer compromised: follow Safe owner rotation procedure.
- If contract bug found: pause scoped contracts, disable engine in registry, publish incident report.

---

# ACCOUNT ABSTRACTION

## ERC-4337 Decision

ERC-4337 is included as a Phase 2 architecture path, not required for the first production release unless customer agent UX requires gas sponsorship or session keys.

## Components

| Component | Choice | Purpose |
|---|---|---|
| Bundler | Alchemy | Submit UserOperations |
| Paymaster | Alchemy Gas Manager initially | Sponsor gas under policy |
| Smart Accounts | ZeroDev or Alchemy smart wallets | Agent-controlled account abstraction |
| Session Keys | Scoped, time-bound execution permissions | Reduce signing friction for agents |

## Why Needed

- Agents need controlled automation.
- Session keys allow limited delegated execution.
- Paymasters allow organizations to sponsor gas with policy limits.
- Smart accounts enable recovery and batched execution.

## Flow

1. Organization creates agent.
2. Agent smart account is created or linked.
3. Session key is granted with action, amount, asset, and time constraints.
4. Agent submits intent to VALEN.
5. VALEN approves or rejects.
6. If approved, backend prepares UserOperation.
7. Paymaster checks sponsorship policy.
8. Bundler submits UserOperation.
9. Settlement contract enforces final checks.

## Security

- Session keys must be scoped and expiring.
- Paymaster sponsorship must enforce organization budgets.
- UserOperations must be tied to approved execution id.
- Bundler failures route to settlement failure handling.
- AA is never allowed to bypass ValenSettlement.

---

# INDEXING ARCHITECTURE

## Comparison

| Option | Pros | Cons |
|---|---|---|
| Envio | Fast indexing, developer-friendly, good for custom read models | Vendor/tooling dependency |
| The Graph | Mature ecosystem and GraphQL patterns | Subgraph lag and setup overhead |
| Custom Indexer | Maximum control and tailored reorg handling | More engineering and operational burden |

## Final Choice

Use **Envio as primary indexer** for production read models, with a **custom lightweight confirmation/reconciliation worker** for critical settlement state. The Graph remains optional for public ecosystem queries.

## Sync Strategy

- Index all VALEN contract events.
- Store indexed block ranges.
- Backend reconciliation worker consumes indexer updates.
- Critical settlement confirmation also verified through direct RPC.
- Database state transitions are idempotent.

## Reorg Handling

- Treat transactions as pending until minimum confirmation threshold.
- Reconcile reorged events by chain id, tx hash, log index, and block hash.
- If confirmed event disappears, mark settlement for manual review.
- Critical events require direct RPC verification before final state.

## Recovery Strategy

- Store last processed block per chain and contract.
- Support replay from block number.
- Support full rebuild of read models from chain events.
- Keep event processing idempotent.
- Alert if indexer lag exceeds threshold.

---

# CONTRACT UPGRADE STRATEGY

## Comparison

| Pattern | Pros | Cons |
|---|---|---|
| UUPS | Lower proxy overhead, implementation controls upgrade logic, common OZ pattern | Upgrade function security must be perfect |
| Transparent Proxy | Mature and admin-separated | More overhead and admin complexity |
| Beacon Proxy | Efficient for many same-logic instances | Not needed unless many clone-like contracts exist |

## Final Approach

Use **UUPS proxies** for core upgradeable contracts:
- ValenRegistry.
- ValenPolicyManager.
- ValenMandateRegistry.
- ValenSettlement.
- ValenTreasury.
- ValenGovernance.

Prefer **non-upgradeable** contracts for:
- ValenAuditLog.
- ValenEmergencyGuardian, unless requirements force upgrades.

## Security Requirements

- Upgrade authority is Timelock controlled by Governance Safe.
- Emergency Guardian cannot upgrade.
- Upgrade proposals include implementation address, diff, tests, audit note, rollback plan.
- Production upgrade delay is mandatory except for scoped pause actions.
- Storage layout checks required in CI.

## Stylus Upgrade Model

Stylus engines are not upgraded in place by assumption. New engine versions are deployed, activated, verified, then registered in ValenRegistry. Old engines remain addressable for audit and rollback until deprecated.

---

# CONTRACT OWNERSHIP MODEL

## Ownership Components

| Component | Role |
|---|---|
| Timelock | Delays normal upgrades and sensitive config changes |
| Governance Safe | Controls timelock proposer/executor rights |
| Treasury Safe | Controls treasury withdrawals |
| Emergency Guardian Safe | Can pause and freeze scoped risk |
| Backend Settlement Signer | Submits approved settlements only |

## Ownership by Contract

| Contract | Owner | Emergency Authority | Notes |
|---|---|---|---|
| ValenRegistry | Timelock | Emergency Guardian can mark unsafe | Registry changes delayed |
| ValenPolicyManager | Timelock | Emergency Guardian can freeze active policy | Policy activation controlled |
| ValenMandateRegistry | Timelock | Emergency Guardian/Compliance Officer can freeze mandates | Revocation rights scoped |
| ValenSettlement | Timelock | Emergency Guardian can pause | Most critical contract |
| ValenEscrow | Timelock | Emergency Guardian can freeze | No guardian withdrawals |
| ValenTreasury | Treasury Safe + Timelock config | None for withdrawals | Fee changes delayed |
| ValenGovernance | Governance Safe + Timelock | None | Governs governance |
| ValenAuditLog | Timelock or immutable owner | None | Append-only |
| Stylus Engines | Registry pointer controlled by Timelock | Emergency Guardian can disable engine pointer | New versions deployed separately |

---

# OBSERVABILITY

## Metrics

| Metric | Purpose |
|---|---|
| API latency by route | Performance and SLA |
| API error rate | Reliability |
| Queue depth by queue | Backpressure |
| Job failures by queue | Worker health |
| DLQ count | Operational risk |
| Vendor latency and failure rate | Compliance/risk reliability |
| Settlement submission rate | Chain operations |
| Settlement failure rate | Onchain health |
| Indexer lag | Data freshness |
| Compliance fail rate | Product and risk signal |
| Risk tier distribution | Product and security signal |
| Emergency pause state | Critical safety |

## Logs

- Structured JSON logs.
- Include request id, trace id, organization id, execution id where safe.
- Exclude secrets and raw sensitive compliance data.
- Worker logs include queue, job id, attempt, execution id.
- Settlement logs include chain id and tx hash.

## Tracing

- Trace request through API, queue job, vendor call, DB write, settlement submission.
- Sentry performance traces for API and workers.
- Manual correlation id propagated through job payloads.

## Alerting

| Alert | Severity |
|---|---|
| Settlement failure spike | Critical |
| Audit queue failures | Critical |
| DLQ growth | High |
| Compliance vendor required outage | High |
| RPC failure or high latency | High |
| Indexer lag over threshold | Medium |
| API error rate spike | High |
| Queue depth sustained high | Medium |
| Emergency pause activated | Critical |

## Sentry

- Backend exceptions.
- Worker exceptions.
- Performance traces.
- Release tracking.
- Alert routing for critical paths.

## PostHog

- Product usage.
- Funnel: agent registered -> intent submitted -> approved -> settled.
- Feature flags.
- Organization-level analytics with privacy controls.

## Health Checks

| Check | Scope |
|---|---|
| Live | Process is running |
| Ready | DB and Redis reachable |
| Deep | Vendor, RPC, indexer, queue, contract read checks |
| Worker heartbeat | Worker processing alive |
| Scheduler heartbeat | Scheduled tasks alive |

## Incident Response

1. Detect and classify.
2. Assign incident commander.
3. Pause affected scope if settlement risk exists.
4. Preserve logs and audit evidence.
5. Communicate internally and to affected customers if needed.
6. Patch and verify.
7. Restore service.
8. Postmortem and action items.

---

# FINAL IMPLEMENTATION ORDER

## Week 1

**Goal:** Foundation, repository, database baseline, backend skeleton, contract skeleton planning.

| Workstream | Tasks |
|---|---|
| Backend Engineer | Monorepo setup, NestJS app, config module, health checks, database module, Redis/BullMQ setup, Auth Module skeleton |
| Smart Contract Engineer | Foundry setup, contract interface specs, ownership model tests plan, registry/settlement storage layout design |
| Stylus Engineer | Stylus workspace setup, toolchain pin, engine ABI planning, ComplianceEngine and RiskEngine fixtures |
| DevOps Engineer | Render dev services, GitHub Actions baseline, Supabase dev project, Redis dev, Sentry/PostHog projects |
| Frontend Engineer | API contract review, auth flow planning, dashboard information architecture |

**Week 1 Exit Criteria:**
- Repo structure created.
- CI baseline runs.
- Backend health endpoint deployed to dev.
- Supabase project connected.
- Redis connected.
- Contract and Stylus test harness planned.

## Week 2

**Goal:** Core domain backend and database migrations begin, contract implementation begins, Stylus engines begin.

| Workstream | Tasks |
|---|---|
| Backend Engineer | Organizations, users, team_members, agents, api_keys, policies, executions modules |
| Smart Contract Engineer | ValenRegistry, ValenPolicyManager, ValenMandateRegistry initial implementation and tests |
| Stylus Engineer | ComplianceEngine and EligibilityEngine deterministic evaluations |
| DevOps Engineer | Staging environment, secrets layout, migration workflow, deployment previews |
| Frontend Engineer | Authenticated shell, organization switcher, agent list, policy list mock integration |

**Week 2 Exit Criteria:**
- Core DB schema implemented in dev.
- RLS draft exists and is testable.
- Agent registration API works in dev.
- Policy version API works in dev.
- First contract tests pass.
- First Stylus engine builds locally.

## Week 3

**Goal:** Compliance, risk, policy, settlement orchestration and testnet deployment.

| Workstream | Tasks |
|---|---|
| Backend Engineer | Compliance, Risk, Settlement, Audit, Notification modules and queues |
| Smart Contract Engineer | ValenSettlement, ValenAuditLog, EmergencyGuardian, contract integration tests |
| Stylus Engineer | RiskEngine and PolicyEngine, ABI export, Solidity caller compatibility tests |
| DevOps Engineer | Arbitrum Sepolia deployment pipeline, contract verification pipeline, indexer setup |
| Frontend Engineer | Intent submission, execution timeline, approval screen |

**Week 3 Exit Criteria:**
- Intent lifecycle works through compliance/risk/policy in dev.
- Settlement queue submits testnet transaction.
- Solidity contracts deployed to Arbitrum Sepolia.
- Stylus engines deployed and activated on Arbitrum Sepolia.
- Audit logs visible in backend.

## Week 4

**Goal:** Robinhood testnet, hardening, E2E, security, readiness.

| Workstream | Tasks |
|---|---|
| Backend Engineer | E2E hardening, idempotency, DLQ, reconciliation, vendor adapters |
| Smart Contract Engineer | Robinhood testnet deployment, upgrade tests, pause tests, audit checklist |
| Stylus Engineer | Robinhood testnet activation, gas/ink benchmarks, reason code matrix |
| DevOps Engineer | Staging release process, monitoring alerts, rollback rehearsal, runbooks |
| Frontend Engineer | Production-ready flows for demo and internal beta |

**Week 4 Exit Criteria:**
- Dual testnet deployment complete.
- E2E tests pass.
- Monitoring alerts configured.
- Security checklist complete.
- Rollback path rehearsed.
- Internal beta readiness review complete.

## Dependency Graph

```text
Repository setup
  -> CI baseline
  -> Backend config/database/queue
  -> Core DB schema
  -> Auth and organization modules
  -> Agent and policy modules
  -> Intent execution module
  -> Compliance/risk/policy queues
  -> Settlement module
  -> Audit and notification modules
  -> E2E lifecycle

Contracts setup
  -> Registry
  -> PolicyManager
  -> MandateRegistry
  -> Settlement
  -> AuditLog/EmergencyGuardian
  -> Testnet deployment
  -> Backend contract integration

Stylus setup
  -> Engine ABI design
  -> ComplianceEngine
  -> EligibilityEngine
  -> RiskEngine
  -> PolicyEngine
  -> Deploy and activate
  -> Register in Solidity registry
```

## Critical Path

1. Repository and CI setup.
2. Database schema and RLS baseline.
3. Auth and organization context.
4. Agent registration and policy versioning.
5. Intent lifecycle.
6. Compliance/risk/policy queues.
7. Settlement contract deployment.
8. Stylus engine deployment and activation.
9. Backend-to-contract integration.
10. E2E dual testnet validation.

## Blocking Tasks

- Supabase project and database URL.
- Redis instance.
- Privy project.
- Alchemy app and RPC keys.
- Render services.
- Contract deployer wallet funded on testnets.
- Robinhood testnet funds.
- Stylus toolchain compatibility.
- Contract ownership addresses.

## Parallel Tasks

| Parallelizable Work | Owner |
|---|---|
| Backend module skeletons | Backend Engineer |
| Contract test harness | Smart Contract Engineer |
| Stylus engine fixtures | Stylus Engineer |
| Render and GitHub Actions setup | DevOps Engineer |
| Frontend auth/dashboard shell | Frontend Engineer |
| Security threat model refinement | Security Engineer |
| API documentation | Backend + Frontend |

## Developer Allocation

| Role | Primary Responsibilities |
|---|---|
| Backend Engineer | NestJS modules, DB access, queues, integrations, API, workers |
| Smart Contract Engineer | Solidity contracts, tests, deployment, verification, ownership |
| Stylus Engineer | Rust engines, ABI compatibility, activation, benchmarks |
| Frontend Engineer | Dashboard, auth UX, approvals, timelines, admin views |
| DevOps Engineer | Render, Supabase, CI/CD, secrets, monitoring, runbooks |
| Security Engineer | Threat model, RBAC, key management, audit checklist, emergency procedures |

---

# Final Masterplan Decision

VALEN Phase 2 proceeds as a production implementation, not a hackathon prototype. The backend is NestJS on Render with Supabase PostgreSQL and Redis/BullMQ. Solidity owns settlement, mandates, registry, treasury, and emergency controls. Stylus Rust owns deterministic compliance, risk, eligibility, and policy computation. Privy handles user and wallet onboarding, Safe controls treasury and ownership, Alchemy provides RPC and account abstraction infrastructure, Sentry and PostHog provide observability, and Envio plus direct RPC reconciliation provide indexing.

Implementation must follow the order above. No code should be written until the repository, ownership, database, security, and deployment decisions in this masterplan are accepted.
