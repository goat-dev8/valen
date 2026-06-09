# VALEN Phase 4 — Production Specifications

**Status:** Final production specification pending approval.  
**Scope:** Database, API, Solidity contracts, Stylus engines, cross-chain deployment, security model, implementation readiness.  
**Rules:** No SQL code. No Solidity code. No Rust code. No pseudocode.  
**Source policy:** Official documentation takes precedence. Unsupported claims are marked `UNVERIFIED` or `NOT SUPPORTED BY CURRENT DOCS`.

---

# Verified Documentation Basis

## Verified

| Area | Verified Facts |
|---|---|
| Open House | HackQuest page confirms projects must deploy on an Arbitrum chain; criteria are smart contract quality, product-market fit, innovation/creativity, and real problem solving; at least one top-3 prize is reserved for Robinhood Chain and at least one for Arbitrum. |
| Arbitrum | Official docs position Arbitrum as finance-native infrastructure for applications, tokenization, and dedicated chains; Arbitrum supports Solidity and Stylus. |
| Arbitrum Sepolia / One | Official chain params verified; Arbitrum One chain ID is `42161`; Arbitrum Sepolia chain ID is `421614`; Arbitrum Sepolia dispute window is short testnet finality, while Arbitrum One has a ~6.4 day dispute window. |
| Stylus | Official docs confirm Rust SDK v0.10.2, Rust 1.91.0+, `wasm32-unknown-unknown`, Alloy primitives, `stylus-sdk`, `cargo-stylus`, ABI export, `TestVM`, and OpenZeppelin audits. |
| Stylus deployment | Official docs confirm deploy + activation flow, ArbWasm precompile `0x0000000000000000000000000000000000000071`, compressed WASM size limit of 24KB, activation fee, keepalive/expiration, and `cargo stylus check/deploy/activate/export-abi`. |
| Stylus security | Official docs require input validation, access control, reentrancy protection, checked arithmetic, external-call handling, no unbounded loops, deterministic builds, and pinned toolchains. |
| Robinhood Chain | Official docs confirm Robinhood Chain testnet is live, Arbitrum Orbit L2 on Ethereum, uses Ethereum blobs for data availability, ETH as gas, chain ID `46630`, public RPC `https://rpc.testnet.chain.robinhood.com`, recommended Alchemy endpoint, sequencer feed, and block explorer. |
| Robinhood assets | Arbitrum blog confirms testnet simulation assets include test versions of Stock Tokens such as Tesla, Amazon, Palantir, Netflix, and AMD; these are testnet-only and do not represent real-world value. |
| Robinhood mainnet | Arbitrum blog confirms a phased roadmap with future mainnet; no official production chain ID/RPC in fetched docs. |
| OpenZeppelin | Official GitHub/docs confirm Contracts 5.x, AccessControl, semantic versioning, audited `latest` releases, upgradeable package, and warning not to upgrade across incompatible major versions. |
| Privy | Official docs confirm authentication, wallets, embedded wallets, REST/Node SDK, user management, policies, wallet actions, and agentic wallets. Privy docs explicitly instruct agents to install the Privy skill/MCP before implementation. |
| Alchemy | Official docs confirm JSON-RPC APIs, Wallet APIs, gas sponsorship, batching, retries, session keys, status tracking, and Privy-compatible wallet integration. |
| ZeroDev | Official docs confirm ERC-4337, EIP-7702, gas abstraction, transaction batching, session keys, and AI agent transaction automation. |
| Supabase | Official docs confirm Postgres, RLS requirements for exposed schemas, service-role bypass danger, Storage buckets, RLS performance guidance, and user metadata authorization warning. |
| Render | Official docs confirm web services, background workers with BullMQ listed for Node.js, cron jobs, environment variables/groups, private networking, health checks, and zero-downtime deploys for web services. |
| BullMQ / Redis | BullMQ docs confirm Redis-backed queues, retries, backoff, concurrency, idempotent jobs, priorities, delayed jobs, and at-least-once in worst-case delivery; Redis docs confirm distributed-lock patterns. |
| NestJS | Official docs confirm modules, providers, controllers, guards/auth patterns, validation, and queues. |

## Explicit Non-Assumptions

| Topic | Status |
|---|---|
| Robinhood mainnet chain ID/RPC | `UNVERIFIED` from current official docs; must not be hardcoded. |
| Robinhood production compliance API | `NOT SUPPORTED BY CURRENT DOCS`; no official Robinhood compliance API was found in fetched docs. |
| Robinhood real-money tokenized equity availability for developers | `NOT SUPPORTED BY CURRENT DOCS`; only testnet simulation assets were verified. |
| Stylus external HTTP/API calls | `NOT SUPPORTED`; Stylus contracts cannot call TRM/Webacy/Privy/Alchemy HTTP APIs. External data must be attested offchain then verified onchain. |
| Privy implementation-level method names | `REQUIRES PHASE 5 VERIFICATION`; Privy docs require installing skill/MCP before code. |

---

# SECTION 1 — Database Final Specification

## Global Database Rules

| Rule | Specification |
|---|---|
| Database | Supabase PostgreSQL. |
| Primary keys | `uuid`, generated by database default. |
| Timestamps | All tables include `created_at`; mutable tables include `updated_at`; append-only tables do not allow destructive mutation. |
| Tenant isolation | Every organization-owned table includes `organization_id`. |
| RLS | Enabled on every table in exposed schemas. |
| Service role | Backend-only. Never exposed to browser or mobile clients. |
| Authorization metadata | Never use user-editable metadata for authorization. |
| Audit | Audit tables are append-only and retained at least 7 years unless legal policy changes. |
| Sensitive payloads | Store hashes and private storage references, not raw regulated payloads, unless explicitly required. |

## Enum Catalog

| Enum | Values |
|---|---|
| organization_status | active, suspended, archived |
| organization_plan | development, beta, pro, enterprise |
| user_status | active, invited, suspended, deleted |
| team_member_status | invited, active, suspended, removed |
| platform_role | platform_admin, organization_owner, compliance_officer, risk_officer, policy_manager, settlement_operator, auditor, developer, agent, service_account |
| agent_status | draft, active, suspended, revoked, archived |
| agent_type | hosted, external, service, experimental |
| wallet_type | privy, safe, zerodev, turnkey, eoa, kms |
| policy_status | draft, active, disabled, archived |
| policy_version_status | draft, pending_approval, published, active, retired |
| execution_status | created, validated, compliance_failed, risk_failed, policy_rejected, approval_required, approved, settlement_submitted, executed, failed, cancelled |
| action_type | transfer, approve, contract_call, rebalance, swap, custom |
| compliance_status | pending, passed, failed, expired, error |
| compliance_subject_type | agent, principal, counterparty, asset, transaction, contract |
| risk_tier | low, medium, high, critical |
| settlement_status | pending, prepared, submitted, confirmed, failed, reverted, cancelled |
| actor_type | user, agent, service_account, system, contract |
| notification_channel | email, webhook, in_app, slack, incident |
| notification_status | queued, sent, delivered, failed, suppressed |
| webhook_status | active, disabled, failing, revoked |
| chain_environment | local, testnet, mainnet |
| deployment_status | planned, active, deprecated, disabled |

## `organizations`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key; default generated UUID |
| name | text | Required; length 2–120 |
| slug | text | Required; unique; lowercase URL-safe |
| status | organization_status | Required; default active |
| plan | organization_plan | Required; default development |
| default_chain_id | integer | Nullable; foreign key to chain_networks.chain_id when set |
| risk_mode | text | Required; default standard; allowed: conservative, standard, custom |
| compliance_mode | text | Required; default fail_closed; allowed: fail_closed, monitor_only |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique slug; status; plan; default_chain_id.  
**Foreign keys:** default_chain_id → chain_networks.chain_id.  
**RLS ownership:** organization_membership policy; Platform Admin full read; organization members read; Organization Owner update; backend service role write.

## `users`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key; default generated UUID |
| privy_user_id | text | Required; unique |
| email | citext | Nullable; unique when present |
| display_name | text | Nullable; max 120 |
| status | user_status | Required; default active |
| last_login_at | timestamptz | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique privy_user_id; unique partial email; status; last_login_at.  
**Foreign keys:** none.  
**RLS ownership:** user can read self; organization-scoped reads through team_members; Platform Admin read; backend service role write.

## `team_members`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| user_id | uuid | Required |
| role | platform_role | Required; organization-scoped roles only |
| status | team_member_status | Required; default invited |
| invited_by_user_id | uuid | Nullable |
| joined_at | timestamptz | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique organization_id + user_id; organization_id + role; organization_id + status; user_id.  
**Foreign keys:** organization_id → organizations.id; user_id → users.id; invited_by_user_id → users.id.  
**RLS ownership:** Organization Owner manages; member reads own organization memberships; Platform Admin full read; backend service role write.

## `agents`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| name | text | Required; length 2–120 |
| description | text | Nullable |
| status | agent_status | Required; default draft |
| agent_type | agent_type | Required |
| external_ref | text | Nullable |
| default_policy_id | uuid | Nullable |
| metadata | jsonb | Required; default empty object; non-authoritative |
| created_by_user_id | uuid | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + status; organization_id + agent_type; default_policy_id; external_ref partial; metadata GIN only if query patterns require.  
**Foreign keys:** organization_id → organizations.id; default_policy_id → policies.id; created_by_user_id → users.id.  
**RLS ownership:** Organization Owner, Developer, Policy Manager read; Organization Owner/Developer create; Compliance Officer can suspend through service action; backend service role write.

## `agent_wallets`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| agent_id | uuid | Required |
| chain_id | integer | Required |
| wallet_address | text | Required; EVM checksum normalized |
| wallet_type | wallet_type | Required |
| status | text | Required; default active; allowed active, rotated, revoked |
| is_primary | boolean | Required; default false |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique chain_id + wallet_address; unique partial agent_id + chain_id where is_primary and active; organization_id + chain_id; agent_id.  
**Foreign keys:** organization_id → organizations.id; agent_id → agents.id; chain_id → chain_networks.chain_id.  
**RLS ownership:** same as agents; write only through backend service role.

## `api_keys`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| agent_id | uuid | Nullable |
| name | text | Required |
| key_prefix | text | Required; unique |
| key_hash | text | Required; never expose |
| scopes | text[] | Required; default empty array |
| status | text | Required; default active; allowed active, revoked, expired |
| expires_at | timestamptz | Nullable |
| last_used_at | timestamptz | Nullable |
| created_by_user_id | uuid | Nullable |
| created_at | timestamptz | Required; default now |
| revoked_at | timestamptz | Nullable |

**Indexes:** primary key id; unique key_prefix; organization_id + status; agent_id; expires_at.  
**Foreign keys:** organization_id → organizations.id; agent_id → agents.id; created_by_user_id → users.id.  
**RLS ownership:** Organization Owner and Developer can view metadata only; key_hash never returned; service role write.

## `policies`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| name | text | Required |
| description | text | Nullable |
| status | policy_status | Required; default draft |
| active_version_id | uuid | Nullable |
| created_by_user_id | uuid | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + status; active_version_id.  
**Foreign keys:** organization_id → organizations.id; active_version_id → policy_versions.id; created_by_user_id → users.id.  
**RLS ownership:** Policy Manager/Owner read-write; Auditor read; backend service role write.

## `policy_versions`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| policy_id | uuid | Required |
| version_number | integer | Required; positive |
| status | policy_version_status | Required; default draft |
| rules | jsonb | Required; canonical policy document |
| rules_hash | text | Required when published; unique per policy |
| published_by_user_id | uuid | Nullable |
| published_at | timestamptz | Nullable |
| activated_at | timestamptz | Nullable |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique policy_id + version_number; organization_id + status; rules_hash; policy_id + status.  
**Foreign keys:** organization_id → organizations.id; policy_id → policies.id; published_by_user_id → users.id.  
**RLS ownership:** Policy Manager drafts/publishes subject to workflow; Owner activates; Auditor read; service role write.

## `mandates`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| agent_id | uuid | Required |
| principal_user_id | uuid | Nullable |
| chain_id | integer | Required |
| onchain_mandate_id | text | Nullable until onchain grant confirmed |
| scope_hash | text | Required |
| status | text | Required; default draft; allowed draft, active, revoked, expired, frozen |
| valid_from | timestamptz | Required |
| valid_until | timestamptz | Required |
| max_per_transaction | numeric | Nullable |
| max_total | numeric | Nullable |
| used_total | numeric | Required; default 0 |
| created_by_user_id | uuid | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + status; agent_id + status; chain_id + onchain_mandate_id unique partial; valid_until.  
**Foreign keys:** organization_id → organizations.id; agent_id → agents.id; principal_user_id → users.id; chain_id → chain_networks.chain_id.  
**RLS ownership:** Owner and Compliance Officer manage; Auditor read; service role writes on indexer reconciliation.

## `executions`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| agent_id | uuid | Required |
| mandate_id | uuid | Nullable |
| policy_id | uuid | Nullable |
| policy_version_id | uuid | Nullable |
| idempotency_key | text | Required |
| action_type | action_type | Required |
| status | execution_status | Required; default created |
| request_payload_hash | text | Required |
| request_payload_ref | text | Nullable |
| target_chain_id | integer | Required |
| target_address | text | Required when applicable |
| asset_address | text | Nullable |
| value_amount | numeric | Nullable |
| metadata | jsonb | Required; default empty object |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique organization_id + idempotency_key; organization_id + status + created_at; agent_id + created_at; target_chain_id + target_address; policy_version_id; mandate_id.  
**Foreign keys:** organization_id → organizations.id; agent_id → agents.id; mandate_id → mandates.id; policy_id → policies.id; policy_version_id → policy_versions.id; target_chain_id → chain_networks.chain_id.  
**RLS ownership:** Agent can read own execution status; org roles read by permission; service role writes lifecycle.

## `intent_idempotency_keys`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| idempotency_key | text | Required |
| execution_id | uuid | Required |
| expires_at | timestamptz | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique organization_id + idempotency_key; expires_at.  
**Foreign keys:** organization_id → organizations.id; execution_id → executions.id.  
**RLS ownership:** service role only.

## `compliance_attestations`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| provider | text | Required |
| subject_type | compliance_subject_type | Required |
| subject_ref | text | Required |
| attestation_hash | text | Required |
| reason_code | text | Required |
| status | compliance_status | Required; default passed |
| expires_at | timestamptz | Required |
| issued_at | timestamptz | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + subject_type + subject_ref; attestation_hash; expires_at; provider + subject_ref.  
**Foreign keys:** organization_id → organizations.id.  
**RLS ownership:** Compliance Officer create/read; Auditor read; service role write; agents no direct read unless scoped to own execution.

## `compliance_checks`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| execution_id | uuid | Required |
| status | compliance_status | Required; default pending |
| reason_code | text | Required |
| provider | text | Required |
| provider_ref | text | Nullable |
| subject_type | compliance_subject_type | Required |
| subject_ref | text | Required |
| attestation_hash | text | Nullable |
| result_hash | text | Nullable |
| expires_at | timestamptz | Nullable |
| checked_at | timestamptz | Nullable |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; execution_id; organization_id + status + checked_at; subject_type + subject_ref; expires_at.  
**Foreign keys:** organization_id → organizations.id; execution_id → executions.id.  
**RLS ownership:** Compliance Officer and Auditor read; service role write.

## `risk_models`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Nullable; null means platform default |
| name | text | Required |
| version | text | Required |
| model_hash | text | Required |
| status | text | Required; default active |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique organization_id + name + version; model_hash; status.  
**Foreign keys:** organization_id → organizations.id.  
**RLS ownership:** Risk Officer read; Platform Admin manage; service role write.

## `risk_scores`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| execution_id | uuid | Required |
| risk_model_id | uuid | Nullable |
| score | integer | Required; between 0 and 100 |
| tier | risk_tier | Required |
| factor_summary | jsonb | Required; non-sensitive summary |
| score_hash | text | Required |
| requires_approval | boolean | Required; default false |
| calculated_at | timestamptz | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; execution_id; organization_id + tier + calculated_at; risk_model_id; score_hash.  
**Foreign keys:** organization_id → organizations.id; execution_id → executions.id; risk_model_id → risk_models.id.  
**RLS ownership:** Risk Officer, Auditor, Owner read; service role write.

## `chain_networks`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| chain_id | integer | Required; unique |
| name | text | Required |
| environment | chain_environment | Required |
| rpc_url_ref | text | Required; secret/config reference, not raw secret |
| explorer_url | text | Nullable |
| native_symbol | text | Required; default ETH |
| is_supported | boolean | Required; default false |
| supports_stylus | boolean | Required; default false |
| supports_erc4337 | boolean | Required; default false |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique chain_id; environment; is_supported; supports_stylus.  
**Foreign keys:** none.  
**RLS ownership:** public read of supported metadata; Platform Admin write through service role.

## `contract_deployments`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| chain_id | integer | Required |
| contract_name | text | Required |
| contract_address | text | Required |
| implementation_address | text | Nullable |
| deployment_tx_hash | text | Required |
| version | text | Required |
| status | deployment_status | Required; default planned |
| deployed_at | timestamptz | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique chain_id + contract_name + version; chain_id + status; contract_address.  
**Foreign keys:** chain_id → chain_networks.chain_id.  
**RLS ownership:** authenticated org users can read active public addresses; Platform Admin/service role write.

## `settlements`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| execution_id | uuid | Required |
| chain_id | integer | Required |
| contract_address | text | Required |
| target_address | text | Nullable |
| status | settlement_status | Required; default pending |
| tx_hash | text | Nullable |
| user_operation_hash | text | Nullable |
| block_number | bigint | Nullable |
| failure_reason | text | Nullable |
| submitted_at | timestamptz | Nullable |
| confirmed_at | timestamptz | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique partial chain_id + tx_hash where present; unique partial chain_id + user_operation_hash where present; execution_id; organization_id + status + created_at; chain_id + block_number.  
**Foreign keys:** organization_id → organizations.id; execution_id → executions.id; chain_id → chain_networks.chain_id.  
**RLS ownership:** Settlement Operator, Auditor, Owner read; service role write.

## `nonce_locks`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| chain_id | integer | Required |
| signer_address | text | Required |
| nonce_value | bigint | Required |
| lock_key | text | Required; unique |
| status | text | Required; default locked |
| expires_at | timestamptz | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique lock_key; chain_id + signer_address + nonce_value; expires_at.  
**Foreign keys:** chain_id → chain_networks.chain_id.  
**RLS ownership:** service role only.

## `audit_logs`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Nullable for platform-level events |
| actor_type | actor_type | Required |
| actor_id | text | Nullable |
| action | text | Required |
| entity_type | text | Required |
| entity_id | text | Required |
| event_hash | text | Required |
| payload_ref | text | Nullable |
| chain_id | integer | Nullable |
| tx_hash | text | Nullable |
| ip_address | inet | Nullable |
| user_agent | text | Nullable |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + created_at; entity_type + entity_id; actor_type + actor_id; chain_id + tx_hash; event_hash.  
**Foreign keys:** organization_id → organizations.id; chain_id → chain_networks.chain_id.  
**RLS ownership:** Auditor, Owner, Compliance Officer read; service role append-only; no user update/delete.

## `audit_events`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Nullable |
| event_name | text | Required |
| event_hash | text | Required |
| related_entity_type | text | Required |
| related_entity_id | text | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; event_name + created_at; related_entity_type + related_entity_id; event_hash.  
**Foreign keys:** organization_id → organizations.id.  
**RLS ownership:** same as audit_logs.

## `audit_commitments`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Nullable |
| audit_log_id | uuid | Required |
| chain_id | integer | Required |
| commitment_hash | text | Required |
| tx_hash | text | Nullable |
| status | text | Required; default pending |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; audit_log_id; chain_id + commitment_hash; tx_hash.  
**Foreign keys:** organization_id → organizations.id; audit_log_id → audit_logs.id; chain_id → chain_networks.chain_id.  
**RLS ownership:** Auditor read; service role write.

## `notifications`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| recipient_type | text | Required |
| recipient_ref | text | Required |
| channel | notification_channel | Required |
| template | text | Required |
| status | notification_status | Required; default queued |
| priority | text | Required; default normal |
| payload_ref | text | Nullable |
| sent_at | timestamptz | Nullable |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + status + created_at; recipient_type + recipient_ref; priority + status.  
**Foreign keys:** organization_id → organizations.id.  
**RLS ownership:** recipient and org admins read; service role write.

## `webhooks`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| name | text | Required |
| url | text | Required; HTTPS only outside local |
| secret_hash | text | Required |
| subscribed_events | text[] | Required |
| status | webhook_status | Required; default active |
| failure_count | integer | Required; default 0 |
| created_by_user_id | uuid | Nullable |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; organization_id + status; subscribed_events GIN; created_by_user_id.  
**Foreign keys:** organization_id → organizations.id; created_by_user_id → users.id.  
**RLS ownership:** Organization Owner/Developer manage; service role writes delivery state.

## `webhook_deliveries`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| organization_id | uuid | Required |
| webhook_id | uuid | Required |
| event_name | text | Required |
| status | text | Required; default pending |
| attempt_count | integer | Required; default 0 |
| last_status_code | integer | Nullable |
| last_error | text | Nullable |
| created_at | timestamptz | Required; default now |
| delivered_at | timestamptz | Nullable |

**Indexes:** primary key id; webhook_id + created_at; organization_id + status; event_name.  
**Foreign keys:** organization_id → organizations.id; webhook_id → webhooks.id.  
**RLS ownership:** Organization Owner/Developer read; service role write.

## `dead_letter_jobs`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| queue_name | text | Required |
| job_id | text | Required |
| organization_id | uuid | Nullable |
| execution_id | uuid | Nullable |
| failure_reason | text | Required |
| retry_count | integer | Required |
| payload_ref | text | Nullable |
| status | text | Required; default open |
| created_at | timestamptz | Required; default now |
| resolved_at | timestamptz | Nullable |

**Indexes:** primary key id; queue_name + status; organization_id + created_at; execution_id; status.  
**Foreign keys:** organization_id → organizations.id; execution_id → executions.id.  
**RLS ownership:** Platform Admin read/write; organization read only if organization_id matches and role is Owner/Auditor.

## `admin_actions`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| actor_user_id | uuid | Required |
| organization_id | uuid | Nullable |
| action | text | Required |
| target_type | text | Required |
| target_id | text | Required |
| reason | text | Required |
| created_at | timestamptz | Required; default now |

**Indexes:** primary key id; actor_user_id + created_at; organization_id + created_at; target_type + target_id.  
**Foreign keys:** actor_user_id → users.id; organization_id → organizations.id.  
**RLS ownership:** Platform Admin read; org Owner read scoped; service role write.

## `emergency_actions`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| actor_user_id | uuid | Required |
| scope | text | Required |
| scope_ref | text | Nullable |
| action | text | Required |
| reason | text | Required |
| chain_id | integer | Nullable |
| tx_hash | text | Nullable |
| created_at | timestamptz | Required; default now |
| lifted_at | timestamptz | Nullable |

**Indexes:** primary key id; scope + scope_ref; actor_user_id + created_at; chain_id + tx_hash.  
**Foreign keys:** actor_user_id → users.id; chain_id → chain_networks.chain_id.  
**RLS ownership:** Platform Admin and Emergency Guardian read/write through service role; Auditor read.

## `feature_flags`

| Column | Type | Constraints / Defaults |
|---|---|---|
| id | uuid | Primary key |
| key | text | Required; unique |
| environment | text | Required |
| enabled | boolean | Required; default false |
| rules | jsonb | Required; default empty object |
| created_at | timestamptz | Required; default now |
| updated_at | timestamptz | Required; default now |

**Indexes:** primary key id; unique key + environment; enabled.  
**Foreign keys:** none.  
**RLS ownership:** Platform Admin only; service role write.

---

# SECTION 2 — API Final Specification

## Global API Rules

| Rule | Specification |
|---|---|
| Version | All product endpoints use `/v1`. |
| Auth | All endpoints require auth except health. |
| Human auth | Privy JWT verified server-side. |
| Agent/service auth | Scoped API key; optional wallet-signature binding where endpoint mutates execution state. |
| Idempotency | Required on all execution-creating and settlement-triggering requests. |
| Response envelope | All responses include `requestId` and `traceId`. |
| Error envelope | Error includes `code`, `message`, `details`, `requestId`, `traceId`. |
| Validation | DTO validation; unknown fields rejected for mutating endpoints. |

## Health

| Method | Route | Auth | Request | Response | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/health/live` | none | none | HealthResponse | none | public |
| GET | `/health/ready` | none | none | HealthResponse | none | public |
| GET | `/health/deep` | platform admin | none | HealthResponse | none | platform_admin |

## Auth

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| POST | `/v1/auth/sync` | Privy JWT | privyUserId, email, walletRefs[] | UserDTO, organizations[], permissions[] | token subject must match privyUserId | authenticated user |
| GET | `/v1/me` | Privy JWT | none | UserDTO, organizations[], permissions[] | valid token | authenticated user |

## Organizations and Team

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| POST | `/v1/organizations` | Privy JWT | name, slug, defaultChainId | OrganizationDTO | slug unique, valid chain if set | authenticated user |
| GET | `/v1/organizations/:organizationId` | Privy JWT | path organizationId | OrganizationDTO | organization visible | org member |
| PATCH | `/v1/organizations/:organizationId` | Privy JWT | name?, defaultChainId?, riskMode?, complianceMode? | OrganizationDTO | valid enum values | organization_owner |
| GET | `/v1/organizations/:organizationId/team` | Privy JWT | pagination | TeamMemberDTO[] | organization visible | organization_owner, auditor |
| POST | `/v1/organizations/:organizationId/team/invitations` | Privy JWT | email, role | TeamMemberDTO | valid org role | organization_owner |
| PATCH | `/v1/organizations/:organizationId/team/:memberId` | Privy JWT | role?, status? | TeamMemberDTO | cannot remove last owner | organization_owner |

## Agents

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| POST | `/v1/organizations/:organizationId/agents` | Privy JWT | name, description?, agentType, defaultPolicyId?, capabilities[] | AgentDTO | policy belongs to org | organization_owner, developer |
| GET | `/v1/organizations/:organizationId/agents` | Privy JWT | filters status?, type? | AgentDTO[] | valid filters | org member |
| GET | `/v1/organizations/:organizationId/agents/:agentId` | Privy JWT or agent key | path agentId | AgentDTO | agent belongs to org | org member or same agent |
| PATCH | `/v1/organizations/:organizationId/agents/:agentId` | Privy JWT | name?, description?, defaultPolicyId?, capabilities? | AgentDTO | active/revoked state rules | organization_owner, developer |
| POST | `/v1/organizations/:organizationId/agents/:agentId/wallets` | Privy JWT | chainId, walletAddress, walletType, isPrimary | AgentWalletDTO | EVM address, supported chain | organization_owner, developer |
| POST | `/v1/organizations/:organizationId/agents/:agentId/suspend` | Privy JWT | reason | AgentDTO | active agent only | organization_owner, compliance_officer |
| POST | `/v1/organizations/:organizationId/agents/:agentId/revoke` | Privy JWT | reason | AgentDTO | not already revoked | organization_owner |
| POST | `/v1/organizations/:organizationId/agents/:agentId/api-keys` | Privy JWT | name, scopes[], expiresAt? | ApiKeyDTO + oneTimeSecret | valid scopes | organization_owner, developer |

## Policies

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| POST | `/v1/organizations/:organizationId/policies` | Privy JWT | name, description? | PolicyDTO | unique name per org | policy_manager, organization_owner |
| GET | `/v1/organizations/:organizationId/policies` | Privy JWT | status? | PolicyDTO[] | valid status | org member |
| GET | `/v1/organizations/:organizationId/policies/:policyId` | Privy JWT | path policyId | PolicyDTO + versions[] | belongs to org | org member |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions` | Privy JWT | rules, activationStrategy?, approvalRequirements? | PolicyVersionDTO | canonical JSON; bounded rule count | policy_manager |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions/:versionId/submit` | Privy JWT | comment? | PolicyVersionDTO | draft only | policy_manager |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions/:versionId/publish` | Privy JWT | approvalRef? | PolicyVersionDTO | pending_approval only | policy_manager, organization_owner |
| POST | `/v1/organizations/:organizationId/policies/:policyId/versions/:versionId/activate` | Privy JWT | activationTime? | PolicyDTO | published only | organization_owner |

## Executions

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| POST | `/v1/organizations/:organizationId/executions` | agent key or Privy JWT | agentId, idempotencyKey, actionType, targetChainId, targetAddress, assetAddress?, amount?, mandateId?, payloadHash, payloadRef?, metadata? | ExecutionDTO | active agent, supported action, unique idempotency key | agent, developer, service_account |
| GET | `/v1/organizations/:organizationId/executions` | Privy JWT or agent key | filters status?, agentId?, date range | ExecutionDTO[] | scoped filters | org member or same agent |
| GET | `/v1/organizations/:organizationId/executions/:executionId` | Privy JWT or agent key | path executionId | ExecutionDetailDTO | belongs to org | org member or same agent |
| POST | `/v1/organizations/:organizationId/executions/:executionId/cancel` | Privy JWT or agent key | reason | ExecutionDTO | only non-terminal statuses | submitter agent, settlement_operator, owner |
| GET | `/v1/organizations/:organizationId/executions/:executionId/timeline` | Privy JWT | path executionId | AuditTimelineEventDTO[] | belongs to org | auditor, owner, compliance_officer, risk_officer |

## Compliance

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/v1/organizations/:organizationId/executions/:executionId/compliance` | Privy JWT | path executionId | ComplianceCheckDTO[] | belongs to org | compliance_officer, auditor, owner |
| POST | `/v1/organizations/:organizationId/compliance/attestations` | Privy JWT | provider, subjectType, subjectRef, attestationHash, expiresAt, reasonCode | ComplianceAttestationDTO | expiry in future, allowed provider | compliance_officer |
| GET | `/v1/organizations/:organizationId/compliance/subjects/:subjectRef` | Privy JWT | subjectRef | ComplianceSubjectDTO | visible subject | compliance_officer, auditor, owner |

## Risk

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/v1/organizations/:organizationId/executions/:executionId/risk` | Privy JWT | path executionId | RiskScoreDTO | belongs to org | risk_officer, auditor, owner |
| POST | `/v1/organizations/:organizationId/executions/:executionId/risk/recalculate` | Privy JWT | reason | RiskScoreDTO | execution not terminal unless admin override | risk_officer |
| GET | `/v1/organizations/:organizationId/risk/models` | Privy JWT | none | RiskModelDTO[] | organization visible | risk_officer, auditor, owner |

## Settlement

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/v1/organizations/:organizationId/executions/:executionId/settlement` | Privy JWT | path executionId | SettlementDTO | belongs to org | settlement_operator, auditor, owner |
| POST | `/v1/organizations/:organizationId/executions/:executionId/approve` | Privy JWT | decision, reason, approvalProofRef? | ExecutionDTO | execution approval_required | settlement_operator, organization_owner |
| POST | `/v1/organizations/:organizationId/executions/:executionId/settle` | Privy JWT/service account | idempotencyKey | SettlementDTO | execution approved; no active pause | settlement_operator, service_account |
| POST | `/v1/organizations/:organizationId/settlements/:settlementId/retry` | Privy JWT | reason | SettlementDTO | retryable failure only | settlement_operator |

## Audit

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/v1/organizations/:organizationId/audit-logs` | Privy JWT | filters entityType?, actor?, date range | AuditLogDTO[] | date range bounded | auditor, owner, compliance_officer |
| GET | `/v1/organizations/:organizationId/audit-logs/:auditLogId` | Privy JWT | path auditLogId | AuditLogDTO | belongs to org | auditor, owner, compliance_officer |
| POST | `/v1/organizations/:organizationId/audit-exports` | Privy JWT | startDate, endDate, format, entityTypes[] | AuditExportDTO | range bounded; allowed format | auditor, owner |

## Notifications and Webhooks

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/v1/organizations/:organizationId/notifications` | Privy JWT | filters status?, channel? | NotificationDTO[] | org visible | org member |
| PATCH | `/v1/organizations/:organizationId/notifications/:notificationId` | Privy JWT | status | NotificationDTO | allowed status transition | recipient or owner |
| POST | `/v1/organizations/:organizationId/webhooks` | Privy JWT | name, url, subscribedEvents[] | WebhookDTO | HTTPS URL outside local; event allowlist | organization_owner, developer |
| GET | `/v1/organizations/:organizationId/webhooks` | Privy JWT | none | WebhookDTO[] | org visible | organization_owner, developer, auditor |
| PATCH | `/v1/organizations/:organizationId/webhooks/:webhookId` | Privy JWT | name?, url?, subscribedEvents?, status? | WebhookDTO | URL/event validation | organization_owner, developer |
| DELETE | `/v1/organizations/:organizationId/webhooks/:webhookId` | Privy JWT | none | WebhookDTO | soft-disable only | organization_owner |
| POST | `/v1/organizations/:organizationId/webhooks/:webhookId/test` | Privy JWT | eventName? | WebhookTestResponseDTO | active webhook | organization_owner, developer |

## Admin

| Method | Route | Auth | Request Schema | Response Schema | Validation | Permissions |
|---|---|---|---|---|---|---|
| GET | `/v1/admin/organizations` | Privy JWT | filters status?, plan? | AdminOrganizationDTO[] | platform admin only | platform_admin |
| POST | `/v1/admin/organizations/:organizationId/suspend` | Privy JWT | reason | OrganizationDTO | active organization | platform_admin |
| GET | `/v1/admin/dead-letter-jobs` | Privy JWT | filters queue?, status? | DeadLetterJobDTO[] | platform admin only | platform_admin |
| POST | `/v1/admin/dead-letter-jobs/:jobId/replay` | Privy JWT | reason | DeadLetterJobDTO | job open; replayable queue | platform_admin |
| POST | `/v1/admin/emergency/pause` | Privy JWT | scope, scopeRef?, reason | EmergencyActionDTO | valid scope | platform_admin, emergency_guardian |
| POST | `/v1/admin/emergency/unpause` | Privy JWT | scope, scopeRef?, reason, governanceApprovalRef? | EmergencyActionDTO | valid governance approval for global pause | platform_admin, emergency_guardian |

---

# SECTION 3 — Smart Contract Final Specification

## Global Solidity Rules

| Rule | Specification |
|---|---|
| Tooling | Hardhat per Phase 3. |
| Solidity library | OpenZeppelin Contracts 5.x and Contracts Upgradeable 5.x latest audited release only. |
| Upgrade pattern | UUPS for upgradeable core contracts; non-upgradeable for AuditLog and EmergencyGuardian unless audit requires otherwise. |
| Access control | OpenZeppelin AccessControl-based roles. |
| Pausing | OpenZeppelin Pausable where settlement or privileged mutation can stop. |
| Timelock | Governance changes and upgrades go through TimelockController equivalent. |
| Storage layout | No cross-major OpenZeppelin upgrade. Storage layout checks mandatory before upgrade. |
| External calls | Checks-effects-interactions; reentrancy protection on settlement/escrow. |

## Contract Roles

| Role | Purpose |
|---|---|
| DEFAULT_ADMIN_ROLE | Timelock only after initialization |
| UPGRADER_ROLE | Timelock only |
| REGISTRY_MANAGER_ROLE | Timelock / Governance Safe |
| POLICY_MANAGER_ROLE | Policy Manager contract/admin path |
| MANDATE_MANAGER_ROLE | Mandate admin path |
| SETTLEMENT_OPERATOR_ROLE | Backend settlement signer or service account |
| AUDIT_WRITER_ROLE | Settlement, registry, backend audit signer |
| EMERGENCY_GUARDIAN_ROLE | Emergency Guardian Safe |
| TREASURY_ROLE | Treasury Safe |

## `ValenRegistry`

**Upgradeability:** UUPS.  
**Storage layout:**
- contract name hash → active contract address
- contract name hash → active version string
- engine name hash → active Stylus engine address
- engine name hash → engine version string
- chain ID → support metadata
- disabled contract/engine flags
- storage gap

**Functions:**
- initialize(admin, timelock)
- registerContract(nameHash, address, version)
- deprecateContract(nameHash)
- registerEngine(nameHash, address, version)
- deprecateEngine(nameHash)
- setChainSupport(chainId, enabled, stylusSupported)
- getContract(nameHash)
- getEngine(nameHash)
- isChainSupported(chainId)

**Events:** ContractRegistered, ContractDeprecated, EngineRegistered, EngineDeprecated, ChainSupportUpdated.  
**Errors:** ZeroAddress, Unauthorized, UnsupportedChain, ContractDisabled, EngineDisabled, VersionEmpty.  
**Modifiers:** onlyRole(REGISTRY_MANAGER_ROLE), onlyRole(UPGRADER_ROLE), whenNotPaused where applicable.  
**Access roles:** Timelock owns admin/upgrader; Emergency Guardian can disable engine/contract only if explicitly scoped.

## `ValenPolicyManager`

**Upgradeability:** UUPS.  
**Storage layout:**
- organization key → policy ID → active policy hash
- policy hash → status
- policy hash → activation timestamp
- policy hash → publisher
- frozen policy hash flags
- storage gap

**Functions:**
- initialize(registry, admin)
- publishPolicy(orgKey, policyId, policyHash)
- activatePolicy(orgKey, policyId, policyHash)
- retirePolicy(orgKey, policyId, policyHash)
- freezePolicy(policyHash)
- unfreezePolicy(policyHash)
- getActivePolicyHash(orgKey, policyId)
- isPolicyActive(policyHash)

**Events:** PolicyPublished, PolicyActivated, PolicyRetired, PolicyFrozen, PolicyUnfrozen.  
**Errors:** InvalidPolicyHash, PolicyNotPublished, PolicyFrozen, Unauthorized, InvalidOrgKey.  
**Modifiers:** onlyRole(POLICY_MANAGER_ROLE), onlyRole(EMERGENCY_GUARDIAN_ROLE), onlyRole(UPGRADER_ROLE).  
**Access roles:** Policy Manager publishes; Timelock configures; Emergency Guardian freezes.

## `ValenMandateRegistry`

**Upgradeability:** UUPS.  
**Storage layout:**
- mandate ID → mandate record
- agent address → active mandate IDs
- mandate ID → used total
- mandate ID → frozen/revoked flags
- mandate ID → daily/window usage bucket
- scope hash allowlist
- storage gap

**Functions:**
- initialize(registry, admin)
- grantMandate(principal, agent, scopeHash, validFrom, validUntil, maxPerTx, maxTotal)
- activateMandate(mandateId)
- revokeMandate(mandateId, reasonCode)
- freezeMandate(mandateId, reasonCode)
- unfreezeMandate(mandateId)
- recordExecution(mandateId, amount, executionHash)
- checkMandate(mandateId, agent, asset, amount, actionHash)
- getMandate(mandateId)

**Events:** MandateGranted, MandateActivated, MandateRevoked, MandateFrozen, MandateUnfrozen, MandateUsageRecorded.  
**Errors:** MandateNotFound, MandateExpired, MandateRevoked, MandateFrozen, CapExceeded, InvalidScope, UnauthorizedAgent, InvalidTimeRange.  
**Modifiers:** onlyRole(MANDATE_MANAGER_ROLE), onlySettlementContract, onlyRole(EMERGENCY_GUARDIAN_ROLE).  
**Access roles:** Mandate Manager grants/activates; Settlement records usage; Emergency Guardian freezes.

## `ValenSettlement`

**Upgradeability:** UUPS.  
**Storage layout:**
- registry address
- mandate registry address
- policy manager address
- audit log address
- treasury address
- escrow address
- execution hash → status
- execution hash → used nonce flag
- scope pause flags: global, organization, agent, asset
- storage gap

**Functions:**
- initialize(registry, admin)
- submitSettlement(executionHash, mandateId, policyHash, complianceHash, riskHash, target, value, callDataHash)
- executeSettlement(settlementId)
- cancelSettlement(settlementId, reasonCode)
- markSettlementFailed(settlementId, reasonCode)
- pauseScope(scope, scopeRef)
- unpauseScope(scope, scopeRef)
- isPaused(scope, scopeRef)

**Events:** SettlementRequested, SettlementApproved, SettlementExecuted, SettlementFailed, SettlementCancelled, SettlementPaused, SettlementUnpaused.  
**Errors:** SettlementAlreadyUsed, SettlementNotApproved, SettlementPaused, InvalidVerdictHash, ComplianceRejected, RiskRejected, PolicyRejected, MandateInvalid, TargetCallFailed, ReentrantCall.  
**Modifiers:** nonReentrant, whenNotPausedGlobal, onlyRole(SETTLEMENT_OPERATOR_ROLE), onlyRole(EMERGENCY_GUARDIAN_ROLE), onlyRole(UPGRADER_ROLE).  
**Access roles:** Backend settlement signer has SETTLEMENT_OPERATOR_ROLE; Timelock upgrades; Emergency Guardian pauses only.

## `ValenEscrow`

**Upgradeability:** UUPS only if custody path is enabled; otherwise defer deployment.  
**Storage layout:**
- depositor → asset → balance
- execution hash → locked balance
- frozen asset/depositor flags
- approved settlement contract
- storage gap

**Functions:**
- deposit(asset, amount)
- lockForSettlement(executionHash, depositor, asset, amount)
- releaseToTarget(executionHash, target)
- refund(executionHash, depositor)
- freezeDepositor(depositor)
- freezeAsset(asset)

**Events:** Deposited, FundsLocked, FundsReleased, Refunded, EscrowFrozen, AssetFrozen.  
**Errors:** InsufficientBalance, NotSettlement, EscrowFrozen, AssetFrozen, InvalidAsset, TransferFailed.  
**Modifiers:** nonReentrant, onlySettlementContract, onlyRole(EMERGENCY_GUARDIAN_ROLE).  
**Access roles:** Settlement controls lock/release; principals deposit; guardian freezes only.

## `ValenTreasury`

**Upgradeability:** UUPS.  
**Storage layout:**
- fee recipient
- fee basis points by action type
- accrued fees by asset
- treasury safe address
- storage gap

**Functions:**
- setFeeRecipient(address)
- setFeeConfig(actionHash, basisPoints)
- accrueFee(asset, amount)
- withdrawFees(asset, recipient, amount)
- getAccruedFees(asset)

**Events:** FeeConfigUpdated, FeeAccrued, FeeWithdrawn, FeeRecipientUpdated.  
**Errors:** InvalidFee, Unauthorized, InsufficientFees, InvalidRecipient, TransferFailed.  
**Modifiers:** onlyRole(TREASURY_ROLE), onlySettlementContract, onlyRole(UPGRADER_ROLE).  
**Access roles:** Treasury Safe withdraws; Timelock updates fee config; Settlement accrues.

## `ValenGovernance`

**Upgradeability:** UUPS.  
**Storage layout:**
- governance safe
- timelock address
- proposal references
- action hash → queued status
- storage gap

**Functions:**
- registerProposal(proposalHash, metadataHash)
- queueAction(actionHash)
- cancelAction(actionHash)
- markActionExecuted(actionHash)
- setGovernanceSafe(address)

**Events:** ProposalRegistered, ActionQueued, ActionCancelled, ActionExecuted, GovernanceSafeUpdated.  
**Errors:** InvalidProposal, ActionNotQueued, ActionAlreadyQueued, Unauthorized.  
**Modifiers:** onlyRole(DEFAULT_ADMIN_ROLE), onlyRole(UPGRADER_ROLE).  
**Access roles:** Timelock/Governance Safe.

## `ValenAuditLog`

**Upgradeability:** Non-upgradeable preferred.  
**Storage layout:**
- commitment hash → exists
- commitment hash → emitter
- authorized emitters

**Functions:**
- recordAuditCommitment(commitmentHash, entityHash)
- authorizeEmitter(address, enabled)
- commitmentExists(commitmentHash)

**Events:** AuditCommitmentRecorded, AuditEmitterUpdated.  
**Errors:** DuplicateCommitment, UnauthorizedEmitter, InvalidCommitment.  
**Modifiers:** onlyAuthorizedEmitter.  
**Access roles:** Settlement, PolicyManager, MandateRegistry, backend audit signer.

## `ValenEmergencyGuardian`

**Upgradeability:** Non-upgradeable preferred.  
**Storage layout:**
- guardian addresses
- pause scopes
- freeze scopes
- settlement contract address
- mandate registry address

**Functions:**
- pauseGlobal(reasonHash)
- pauseOrganization(orgHash, reasonHash)
- pauseAgent(agent, reasonHash)
- pauseAsset(asset, reasonHash)
- freezeMandate(mandateId, reasonHash)
- requestUnpause(scope, scopeRef)

**Events:** EmergencyPauseActivated, EmergencyPauseLifted, MandateEmergencyFrozen, GuardianUpdated.  
**Errors:** UnauthorizedGuardian, InvalidScope, AlreadyPaused, NotPaused.  
**Modifiers:** onlyRole(EMERGENCY_GUARDIAN_ROLE).  
**Access roles:** Emergency Guardian Safe. Cannot upgrade, withdraw, or transfer assets.

---

# SECTION 4 — Stylus Engine Final Specification

## Global Stylus Rules

| Rule | Specification |
|---|---|
| SDK | Stylus Rust SDK v0.10.2 per official docs unless newer verified before implementation. |
| Rust | Rust 1.91.0+; pin in `rust-toolchain.toml`. |
| Target | `wasm32-unknown-unknown`. |
| Deployment | `cargo stylus check` before deploy; `cargo stylus deploy` deploys and activates by default. |
| Activation | Track ArbWasm activation tx, version, data fee, timestamp. |
| Size | Compressed WASM ≤ 24KB. |
| ABI | Export Solidity ABI for backend/contracts. |
| External data | No HTTP calls. Only use input data, onchain state, and attested hashes/signatures. |
| Loops | Bounded loops only. |
| Security | Validate inputs, checked arithmetic, fail closed, no unbounded vectors. |

## Shared Structs

| Struct | Fields |
|---|---|
| EngineHeader | engine_version: bytes32; policy_hash: bytes32; valid_until: uint64 |
| IntentContext | execution_hash: bytes32; organization_hash: bytes32; agent: address; mandate_id: bytes32; action_type: bytes32; target_chain_id: uint64; target: address; asset: address; amount: uint256 |
| ComplianceContext | principal_hash: bytes32; jurisdiction_hash: bytes32; counterparty: address; attestation_hashes: bytes32[]; attestation_expiries: uint64[] |
| RiskFactors | amount_factor: uint16; asset_factor: uint16; counterparty_factor: uint16; velocity_factor: uint16; mandate_usage_factor: uint16; anomaly_factor: uint16 |
| PolicyFacts | compliance_hash: bytes32; risk_hash: bytes32; policy_version_hash: bytes32; mandate_scope_hash: bytes32; time_bucket: uint64 |
| EngineVerdict | status: enum; reason_code: enum; result_hash: bytes32; engine_version: bytes32; expires_at: uint64 |

## Shared Enums

| Enum | Values |
|---|---|
| VerdictStatus | pass, fail, approval_required, error |
| ComplianceReason | compliant, kyc_expired, aml_flag, jurisdiction_blocked, identity_not_found, attestation_revoked, counterparty_blocked, asset_not_permitted, mandate_invalid, unknown_error |
| RiskTier | low, medium, high, critical |
| PolicyReason | approved, limit_exceeded, action_not_allowed, asset_not_allowed, counterparty_not_allowed, time_window_blocked, approval_required, policy_inactive |

## `ComplianceEngine`

**Purpose:** Deterministically evaluate compliance constraints for an intent.  
**Storage:**
- engine_version
- authorized_caller
- active_compliance_rule_hash
- max_attestations
- reason_code_registry_hash

**Inputs:**
- IntentContext
- ComplianceContext
- mandate_status_hash
- eligibility_result_hash

**Outputs:**
- EngineVerdict with pass/fail status
- ComplianceReason
- result_hash
- expires_at equals minimum attestation expiry

**Computational flow:**
1. Validate caller and engine active status.
2. Validate intent fields are non-zero where required.
3. Validate attestation arrays are bounded and aligned.
4. Validate no attestation is expired.
5. Validate jurisdiction, counterparty, asset, and mandate hashes match supplied context.
6. Fail closed on missing or invalid required input.
7. Return canonical result hash bound to input hashes and engine version.

## `EligibilityEngine`

**Purpose:** Evaluate whether principal, agent, asset, and counterparty are eligible for action scope.  
**Storage:**
- engine_version
- authorized_caller
- eligibility_root_hash
- max_scope_dimensions

**Inputs:**
- principal_hash
- agent address
- asset address
- counterparty address
- scope_hash
- eligibility_attestation_hash
- expiry

**Outputs:**
- EngineVerdict
- failed_dimension
- result_hash

**Computational flow:**
1. Validate caller.
2. Validate scope hash and attestation hash are non-zero.
3. Validate expiry.
4. Evaluate each bounded eligibility dimension.
5. Return fail with first failed dimension or pass.

## `RiskEngine`

**Purpose:** Calculate bounded deterministic risk score where Stylus provides compute advantage.  
**Storage:**
- engine_version
- authorized_caller
- active_risk_model_hash
- low_threshold
- medium_threshold
- high_threshold
- max_factor_count

**Inputs:**
- IntentContext
- RiskFactors
- historical_summary_hash
- external_risk_attestation_hash
- external_risk_expiry

**Outputs:**
- score: 0–100
- RiskTier
- requires_approval boolean
- result_hash
- EngineVerdict

**Computational flow:**
1. Validate caller and non-expired risk attestation.
2. Validate each factor is within allowed range.
3. Apply bounded weighted factor aggregation.
4. Apply bounded correlation adjustments.
5. Clamp final score to 0–100.
6. Map score to RiskTier.
7. Set requires_approval for high and critical.
8. Return result hash bound to model hash and factors.

## `PolicyEngine`

**Purpose:** Evaluate active policy hash against compliance and risk outputs.  
**Storage:**
- engine_version
- authorized_caller
- active_policy_registry
- max_rules
- max_time_window_count

**Inputs:**
- IntentContext
- PolicyFacts
- risk_tier
- risk_score
- rule_commitment_hashes

**Outputs:**
- EngineVerdict
- PolicyReason
- approval_level
- result_hash

**Computational flow:**
1. Validate caller.
2. Validate policy version hash is active.
3. Validate compliance hash status is pass.
4. Validate risk hash and tier are consistent.
5. Evaluate bounded policy rule commitments.
6. Return approved, rejected, or approval_required.
7. Bind verdict to policy hash, engine version, and execution hash.

---

# SECTION 5 — Cross-Chain Architecture

## Chain Matrix

| Chain | Status | Chain ID | What Lives There | Why |
|---|---|---:|---|---|
| Arbitrum Sepolia | Verified testnet | 421614 | First Solidity contracts, Stylus engines, integration tests, fake assets | Official Arbitrum testnet; fast challenge period; Stylus testing |
| Robinhood Testnet | Verified testnet | 46630 | Hackathon deployment, Robinhood-compatible contracts, test stock-token simulations | Required for Robinhood prize alignment; RWA narrative |
| Arbitrum One | Verified mainnet | 42161 | Production contracts and engines after audit | Liquidity, production Arbitrum settlement |
| Robinhood Mainnet | Future / UNVERIFIED params | Unknown | Future production deployment after official launch | RWA-focused production target; cannot hardcode until docs publish |

## Deployment Per Chain

| Component | Arbitrum Sepolia | Robinhood Testnet | Arbitrum One | Robinhood Mainnet |
|---|---|---|---|---|
| ValenRegistry | yes | yes | post-audit | future |
| ValenPolicyManager | yes | yes | post-audit | future |
| ValenMandateRegistry | yes | yes | post-audit | future |
| ValenSettlement | yes | yes | post-audit | future |
| ValenAuditLog | yes | yes | post-audit | future |
| ValenEmergencyGuardian | yes | yes | post-audit | future |
| ValenTreasury | optional test | optional test | yes | future |
| ValenEscrow | optional | optional | only if custody path approved | future |
| ComplianceEngine | yes | yes | post-audit | future |
| EligibilityEngine | yes | yes | post-audit | future |
| RiskEngine | yes | yes | post-audit | future |
| PolicyEngine | yes | yes | post-audit | future |

## Migration Strategy

1. Build and test locally.
2. Deploy to Arbitrum Sepolia.
3. Deploy same contract set to Robinhood Testnet.
4. Validate identical ABI compatibility and chain-specific addresses.
5. Index both testnets.
6. Run settlement lifecycle tests on both.
7. Freeze audited release.
8. Deploy to Arbitrum One with Timelock/Safe ownership.
9. Deploy to Robinhood Mainnet only after official chain ID/RPC/explorer docs exist.

## Cross-Chain Rules

- Each chain has independent contract deployments.
- Backend stores chain-specific contract_deployments.
- No cross-chain mandate portability in Phase 4.
- Cross-chain execution is `UNVERIFIED` and out of scope until LayerZero/bridge design is separately approved.
- Robinhood Mainnet remains feature-flagged off until official docs publish production parameters.

---

# SECTION 6 — Security Model

## Threat: Compromised Agent

| Area | Specification |
|---|---|
| Impact | Agent submits malicious or excessive intents. |
| Mitigation | API key scope, agent status, mandate checks, idempotency keys, compliance fail-closed, risk scoring, policy approval thresholds, onchain mandate caps. |
| Detection | Abnormal velocity, repeated policy rejection, risk tier spikes, failed compliance checks. |
| Recovery | Suspend agent, revoke API key, revoke/freeze mandate, rotate wallet, audit export. |

## Threat: Malicious Operator

| Area | Specification |
|---|---|
| Impact | Insider tries to approve forbidden settlement or alter policy. |
| Mitigation | RBAC separation of duties, audit_logs append-only, Timelock for contract changes, Safe multisig, no single operator can override compliance failure. |
| Detection | Admin action monitoring, policy activation alerts, emergency action alerts, Sentry/PostHog operational events. |
| Recovery | Suspend user, rotate credentials, revert active policy version, pause scope, incident review. |

## Threat: Replay Attacks

| Area | Specification |
|---|---|
| Impact | Reuse signed intent or settlement payload. |
| Mitigation | execution idempotency key, execution hash, chain ID binding, onchain nonce map, settlement status map, expiry timestamps. |
| Detection | Duplicate idempotency key conflict, repeated execution hash, chain mismatch. |
| Recovery | Mark duplicate as conflict, preserve audit event, rotate compromised agent key if needed. |

## Threat: Signature Forgery

| Area | Specification |
|---|---|
| Impact | Unauthorized request or settlement approval. |
| Mitigation | Privy JWT verification, API key hash verification, optional wallet signature recovery, EIP-712 domain separation for future signatures, chain ID binding. |
| Detection | Failed auth attempts, signature mismatch logs, rate-limit events. |
| Recovery | Revoke API key/session, rotate signing keys, suspend agent/user. |

## Threat: Oracle or Vendor Manipulation

| Area | Specification |
|---|---|
| Impact | False compliance/risk input affects verdict. |
| Mitigation | Expiring attestations, provider allowlist, result hashes, multi-provider support, fail-closed for required providers, Chainlink where official feeds exist. |
| Detection | Vendor disagreement, stale attestation, sudden score distribution shift. |
| Recovery | Disable provider, invalidate attestations, rerun affected checks, pause high-risk settlements. |

## Threat: Privilege Escalation

| Area | Specification |
|---|---|
| Impact | User gains admin/policy/settlement permissions. |
| Mitigation | RBAC guards, Supabase RLS, no user_metadata authorization, role changes audited, least privilege service accounts. |
| Detection | Forbidden route attempts, role change audit alerts, impossible permission combinations. |
| Recovery | Revoke membership/session, rotate secrets, review audit logs. |

## Threat: Stylus Engine Failure

| Area | Specification |
|---|---|
| Impact | Evaluation incorrect or engine expired. |
| Mitigation | `cargo stylus check`, activation tracking, keepalive scheduler, engine version registry, bounded loops, deterministic build, tests. |
| Detection | programTimeLeft monitoring, staticcall failures, result-hash mismatch. |
| Recovery | Disable engine pointer, pause settlement, reactivate or deploy new engine, replay pending executions. |

## Threat: Smart Contract Upgrade Attack

| Area | Specification |
|---|---|
| Impact | Malicious implementation installed. |
| Mitigation | UUPS upgrade only via Timelock, Governance Safe, storage layout checks, delay, audit requirement. |
| Detection | Upgrade event monitoring, registry address change alert. |
| Recovery | Pause contracts, upgrade to safe implementation if available, incident response. |

---

# SECTION 7 — Implementation Readiness Checklist

## Documentation Verification

- [ ] HackQuest Open House requirements reviewed and reflected.
- [ ] Arbitrum chain params verified for Sepolia and One.
- [ ] Robinhood Testnet chain ID, RPC, explorer verified.
- [ ] Robinhood Mainnet remains unconfigured until official docs publish parameters.
- [ ] Stylus SDK version and Rust version verified immediately before implementation.
- [ ] Privy skill/MCP installed before implementation-level code.
- [ ] OpenZeppelin Contracts 5.x latest audited package pinned.

## Database

- [ ] Every table in Section 1 is buildable as a migration.
- [ ] Every enum is buildable.
- [ ] Every foreign key target exists before dependent migration.
- [ ] Every RLS ownership rule is testable.
- [ ] Every index maps to a known query path.
- [ ] Audit tables are append-only by repository and RLS.
- [ ] Service role never reaches frontend.

## API

- [ ] Every endpoint has method, route, auth, request schema, response schema, validation, and permissions.
- [ ] All mutating execution/settlement routes require idempotency.
- [ ] Auth uses Privy JWT for humans and hashed API keys for agents/services.
- [ ] RBAC tests cover every role.
- [ ] Error response model is uniform.

## Contracts

- [ ] Every contract has storage layout, functions, events, errors, modifiers, access roles, and upgradeability.
- [ ] UUPS contracts include upgrade authorization restricted to Timelock.
- [ ] Non-upgradeable contracts are intentionally non-upgradeable.
- [ ] AccessControl roles match Section 3.
- [ ] Emergency Guardian cannot withdraw or upgrade.
- [ ] Settlement is non-reentrant and fail-closed.
- [ ] Contract tests cover all critical failures.

## Stylus

- [ ] Every engine has storage, inputs, outputs, structs, enums, and computational flow.
- [ ] Every loop is bounded.
- [ ] Every external input is validated.
- [ ] No HTTP/API assumptions exist in Stylus.
- [ ] Compressed WASM size is checked.
- [ ] Deployment and activation metadata is recorded.
- [ ] Keepalive monitoring is implemented before mainnet.

## Cross-Chain

- [ ] Arbitrum Sepolia deployment scripts exist.
- [ ] Robinhood Testnet deployment scripts exist.
- [ ] Arbitrum One deployment gated by audit.
- [ ] Robinhood Mainnet deployment blocked until official docs publish parameters.
- [ ] Chain-specific contract addresses stored in contract_deployments.
- [ ] Indexer supports replay per chain.

## Security

- [ ] Threats in Section 6 have tests or runbooks.
- [ ] Secrets are owned and rotated per policy.
- [ ] Admin actions are audited.
- [ ] Emergency pause is deployable and testable.
- [ ] Vendor failure paths are fail-closed where required.
- [ ] Replay and signature-forgery tests exist.
- [ ] Mainnet requires external contract audit.

## Deployability

- [ ] Local stack can run API, Redis, Postgres.
- [ ] Testnet contracts deploy and verify.
- [ ] Stylus engines deploy and activate.
- [ ] Render services can start with env validation.
- [ ] Supabase migrations apply cleanly.
- [ ] CI runs backend, contract, Stylus, and security pipelines.

---

**Phase 4 production specifications complete. Await approval before implementation.**
