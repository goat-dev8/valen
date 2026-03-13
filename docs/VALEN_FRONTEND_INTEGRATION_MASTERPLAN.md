# VALEN Frontend Integration Masterplan

**Date:** 2026-06-12  
**Scope:** Product integration plan for frontend ↔ backend ↔ database ↔ contracts ↔ Stylus ↔ Arbitrum Sepolia ↔ Robinhood Testnet.  
**Instruction followed:** This is an audit and implementation plan only. It does not add new product code.

---

## Current State Analysis

VALEN is no longer blocked by backend infrastructure. The Render backend is proven on testnet: `docs/summary.md` records `validate/full` 12/12 and settlement proof 10/10 after the BullMQ/Redis reliability fixes. The current product problem is that the frontend is still organized as an operator/admin console rather than as a guided product for a normal user.

The current dashboard screenshots show a logged-in organization owner in `My Organization` with:

- Dashboard metrics loaded from Render-backed hooks and operator reads.
- Executions page with an empty list and a primary `Submit Intent` action.
- Approvals page with an empty approval queue.
- Wallet Center showing Privy connected wallet, treasury wallet, settlement wallet, and several honest unavailable states.
- Agents page showing registered agents, including one active agent and several draft agents.
- Audit Logs page showing `agent.created` events.
- Governance, Treasury, Contracts, Webhooks, Team, and Settings in the sidebar.

This proves the user can authenticate, enter an organization, and browse live product surfaces. It does not prove the user can understand or complete the main VALEN job without guidance.

### Current frontend structure risk

The working tree currently contains duplicate route structures:

- `frontend/src/app/dashboard/*`
- `frontend/src/app/(app)/dashboard/*`

The newer route group appears to be active for current screenshots, but both trees exist in the working tree. This creates a high risk of duplicated routes, stale pages, inconsistent imports, and Vercel build ambiguity. This must be resolved before deeper product work.

There is also provider/layout duplication risk: the root `frontend/src/app/layout.tsx` wraps the app with Privy and app providers, while the `(app)` route group also has its own layout/provider path. The canonical route tree decision must include one clear provider stack so Privy, React Query, auth, and org state do not initialize twice.

### Current backend state

The backend exposes the core primitives:

- Auth: `POST /v1/auth/sync`, `GET /v1/me`
- Organizations: `POST /v1/organizations`, `GET/PATCH /v1/organizations/:organizationId`
- Agents: create/list/get/update/link wallet/activate/suspend/revoke/API keys
- Policies: create/list/get/version submit/publish/activate
- Executions: create/list/get/cancel/timeline
- Approval and settlement: approve, settle, get settlement, retry settlement
- Compliance/risk reads
- Audit logs/exports
- Team and webhooks
- Operator-only endpoints for health, queue, treasury, governance, contracts, Stylus, and validation

The backend is powerful enough for a demo, but it is not yet shaped around a user journey. Important consumer product APIs are missing: budget definitions, permission templates, proof pages, wallet balance reads, agent wallet list, policy wizard outputs, and human-readable execution/proof summaries.

### Current chain state

Contracts and Stylus engines are deployed on both target testnets.

Arbitrum Sepolia `421614`:

- `ValenRegistry`: `0x53EeC68c869E06B659A87b9e049a379ba3a5FA0F`
- `ValenSettlement`: `0x993622D55Ea095aB71165Caf191B21E6e3A71D4A`
- `ValenGovernance`: `0xF7623E69a21ad43f3678a9FA2bA931e59f7F1574`
- `ValenTreasury`: `0x094B10D817f4603e9a4734B52c4c7A1Bf389658D`
- `ValenAuditLog`: `0xBe1b5F1055C21D715185612947f681059B585cEE`
- Stylus `ComplianceEngine`, `RiskEngine`, `EligibilityEngine`, and `PolicyEngine` activated.

Robinhood Testnet `46630`:

- `ValenRegistry`: `0x8A80D270dd7028536ecB6f92b04eec11F929d603`
- `ValenSettlement`: `0x91CdD9a481C732bEB09Ce039da23DC11e83547a4`
- `ValenGovernance`: `0x8c263B12e0d511e5a612b4090cFEa0c758A2af6b`
- `ValenTreasury`: `0xd9aDaab0E9660777B979D4C44294bE07E10470c8`
- `ValenAuditLog`: `0x21EC2E12865b5a307A3708ACbA85f2FE2a98B8BF`
- Stylus `ComplianceEngine`, `RiskEngine`, `EligibilityEngine`, and `PolicyEngine` activated.

---

## What A User Can Do Today

Assume a user visits `https://valenai.vercel.app`, connects with Privy, and enters the dashboard.

1. They can sign in through Privy and receive a VALEN session token.
2. They are placed into the first active organization returned by `/v1/me`.
3. They can see dashboard metrics for agents, executions, approvals, treasury, governance, audit, and policies.
4. They can register an agent.
5. They can open an agent detail page and activate/suspend/revoke it, link a wallet, and create an API key.
6. They can create a policy and view policy details/versions.
7. They can submit a raw intent by selecting an active agent, action type, chain, amount, and target address.
8. They can view the execution and optional compliance/risk/settlement/timeline data.
9. They can approve or deny an execution if it reaches `approval_required`.
10. They can inspect settlements, audit logs, treasury, governance, contracts, webhooks, team, and settings.

This is real functionality. The problem is that the user must already understand VALEN internals: agent status, policies, target chain IDs, target addresses, settlement contracts, compliance/risk/policy pipeline, and operator secrets.

---

## What A User Should Be Able To Do

The correct user journey should be:

1. Connect wallet or email with Privy.
2. Create or select an organization.
3. Verify the organization owner wallet once with a signed message.
4. Register an agent through a wizard.
5. Create a policy from templates.
6. Sign a mandate that binds the agent to the policy, chain, allowed action types, allowed targets, budget, expiration, and approval thresholds.
7. Give the agent an API key scoped to submit intents only under that mandate.
8. Submit a user-readable intent through the dashboard or agent API.
9. Watch a pipeline view: intent received → mandate verified → compliance → eligibility → risk → policy → budget → approval if required → operator settlement proof → audit proof.
10. Approve or reject only when the mandate or policy requires human review.
11. See final proof: intent hash, signer/mandate hash, compliance result, risk score, policy result, settlement txs, audit events, and explorer links.
12. Export or share a proof pack.

The product should feel like a governed agent operations product, not a table-heavy backend console.

---

## What Is Working

- Render backend is live at `https://valen-api-m3g4.onrender.com`.
- Health, Supabase, Redis, BullMQ recovery, and pipeline workers are proven.
- Privy auth sync exists and creates/loads users.
- Organization selection exists through `OrgProvider`.
- Agent create/list/detail/activate/suspend/revoke/wallet/API key flows exist.
- Policy create/list/detail/version backend exists.
- Execution create/list/detail/cancel/timeline exists.
- Approval endpoint exists and is wired to the Approvals page.
- Settlement worker executes on-chain via backend signer and persists submit/approve/execute tx data.
- Audit logs are append-only at DB level and displayed in frontend.
- Treasury and governance reads work through operator API when `OPERATOR_DASHBOARD_SECRET` is configured.
- Contract and Stylus manifests are displayed in Contracts Center.
- Vercel env and manifest prebuild are configured, though deploy is still pending green status.

---

## What Is Broken

### Product UX

- There is no onboarding path. Empty screens tell users nothing about what to do next.
- Dashboard is a monitoring page, not a mission control home.
- The primary flow is spread across Agents, Policies, Executions, Approvals, Settlements, and Audit Logs.
- Users must paste raw target addresses and manually understand chain/action semantics.
- There is no “demo-ready” Robinhood flow.
- There is no proof page or proof pack for a completed execution.
- Governance, Treasury, Contracts, Webhooks, Team, and Settings are exposed as primary nav items, but many are advanced/admin surfaces.

### Data/API gaps

- No wallet ownership challenge/verification API for connected or embedded wallets.
- No mandate API for signed agent authority, spend limits, approval thresholds, and expiration.
- No wallet balance API for connected/org/agent wallets.
- No list endpoint exposed in frontend for verified wallets or active mandates.
- No policy template API.
- No permission template or mandate wizard API.
- No budget tables/endpoints yet.
- No proof API yet.
- Settlement DTO is too thin in frontend: it exposes one `txHash`, but backend DB stores submit tx, approve tx, execute tx, on-chain settlement ID, block number, and failure reason after migration `20260101000014`.
- Execution DTO hides policy, policy version, mandate, asset, amount, and metadata fields that users need to understand what happened.
- Risk DTO exposes score/tier but not factors, verdict hash, or explanation.
- Compliance DTO exposes status/provider/reason but not the on-chain/stylus hash explanations users need.

### Architecture gaps

- Settlement execution is currently backend-signed. That is acceptable only if presented as VALEN operator-relayed settlement/proof, not as user-wallet execution.
- Privy connected wallet is used for identity and display, not for signed ownership, mandate authorization, policy activation, or approval proofs.
- No signed mandate architecture exists yet; this is the immediate wallet gap.
- No smart account/session-key architecture exists yet; this is a later execution upgrade, not the current blocker.
- Robinhood support exists at backend/contract level, but frontend treats it as a chain dropdown rather than a guided UX.
- API key scopes are stored in the database but are not enforced as fine-grained permissions in the current guards.
- The approval path and settlement path are split: approving an execution does not itself settle it unless the policy worker or a separate settle/recovery path enqueues settlement.
- The UI reads chain outcomes from database and operator polling; it does not subscribe to or index on-chain events.
- The audit experience is split between off-chain `audit_logs` and on-chain `ValenAuditLog` commitments; users cannot yet verify on-chain commitments from the frontend.

---

## What Is Missing

### User product primitives

- Organization onboarding wizard.
- Agent setup wizard.
- Policy template wizard.
- Permission/mandate editor.
- Budget editor.
- Wallet & Authority page that verifies connected/embedded wallet ownership and shows active mandates.
- Guided chain switch flow.
- Intent builder with natural product actions.
- Pipeline progress view.
- Proof detail page.
- Public proof/share page.
- Robinhood TSLA demo route.
- Refusal receipt UI.
- Payment/budget proof UI.

### Backend/API primitives

- `GET /v1/organizations/:id/agents/:agentId/wallets`
- `GET /v1/organizations/:id/wallets/balances`
- `POST /v1/organizations/:id/onboarding/complete`
- `GET /v1/organizations/:id/setup-state`
- `GET /v1/organizations/:id/policy-templates`
- `POST /v1/organizations/:id/permissions`
- `GET /v1/organizations/:id/permissions`
- `POST /v1/organizations/:id/budgets`
- `GET /v1/organizations/:id/budgets`
- `GET /v1/organizations/:id/executions/:executionId/proof`
- `GET /v1/proofs/executions/:executionId`
- `GET /v1/proofs/refusals/:receiptId`
- `GET /v1/proofs/payments/:paymentProofId`

### Database primitives

These are already planned in `MASTER_EXECUTION_PLAN.md` and should be implemented rather than invented again:

- `refusal_receipts`
- `proof_artifacts`
- `payment_resources`
- `agent_budgets`
- `agent_budget_ledger`
- `payment_proofs`
- `erc8004_agent_bindings`

---

## Wallet Architecture

### Current signing reality

Today:

- Privy authenticates the user and can create an embedded wallet through `embeddedWallets.ethereum.createOnLogin = 'users-without-wallets'`.
- Frontend can read the connected Privy wallet address through `useWallets()`.
- Frontend mutations submit API requests with the Privy bearer token; they do not ask the wallet to sign agent creation, policy creation, wallet linking, intent submission, approval, or settlement.
- Backend uses `PRIVATE_KEY` through `SettlementChainService` to call `submitSettlement`, `approveSettlement`, and `executeSettlement` on `ValenSettlement`.
- Agent wallet linking stores a wallet address in `agent_wallets`, but linking does not prove ownership with an EIP-191/EIP-712 signature.
- API keys let agents submit execution requests, but the current scope model is not yet a signed on-chain/off-chain spending mandate.

### Wallet Architecture Revision

The previous plan said “hybrid” but left too much ambiguity. The corrected recommendation is:

> **Use a signed mandate model now: user-owned Privy/connected wallet for ownership and authorization, agent API keys for intent submission, and the existing backend operator signer only as a settlement/proof relayer.**

This is still hybrid, but it is not “backend signs everything.” The user signs durable authorization. The agent acts only inside that authorization. The backend signs protocol settlement transactions only after it verifies the signed mandate, active policy, compliance, risk, budget, and approval state.

The immediate product should not claim that user wallets directly execute every financial transaction. It should clearly say:

- The user owns the organization and signs mandates.
- The agent submits intents under those mandates.
- VALEN evaluates and records the result.
- VALEN’s operator relayer writes settlement/proof transactions to current testnet contracts.
- Any real value movement outside the current proof/settlement contract requires either an explicit user approval signature for that action or a later smart-account/session-key implementation.

### Industry Research Findings

The market pattern is consistent across wallet infrastructure, AI-agent systems, and financial products:

- Safe Smart Accounts separate owner threshold signatures from modules. Modules can automate execution, but they are security-critical and should enforce rules such as allowances, spending limits, whitelists, and rate limits. Source: [Safe Smart Account overview](https://docs.safe.global/advanced/smart-account-overview), [Safe modules](https://docs.safefoundation.org/smart-account/modules).
- Safe’s own AI-agent spending example uses an allowance module so an agent can spend only a defined token allowance over a defined period, not unrestricted treasury access. Source: [Safe AI agent spending limit](https://docs.safe.global/home/ai-agent-quickstarts/agent-with-spending-limit).
- ZeroDev positions smart accounts around key abstraction, gas abstraction, transaction batching, and session keys for AI agents. That is directionally right for VALEN, but it is a new execution substrate, not the smallest safe change for the current codebase. Source: [ZeroDev docs](https://docs.zerodev.app/).
- Privy embedded wallets are user-owned by default when created client-side, and Privy also supports key quorums where user and server signatures can both be required for sensitive wallet operations. Source: [Privy user-owned wallets](https://docs.privy.io/controls/authorization-keys/owners/configuration/user), [Privy key quorum overview](https://docs.privy.io/controls/key-quorum/overview), [Privy 2-of-2 user/server flow](https://docs.privy.io/recipes/wallets/two-of-two-server-in-the-loop).
- Biconomy, Alchemy, and Rhinestone all converge on the same primitive: session keys or permissions granted by the account owner, constrained by target contracts, function selectors, value/token limits, time windows, and usage limits. Sources: [Biconomy Smart Sessions](https://docs.biconomy.io/new/smart-sessions/introduction), [Alchemy session keys](https://www.alchemy.com/docs/wallets/reference/wallet-apis-session-keys.md), [Rhinestone Smart Sessions](https://docs.rhinestone.dev/smart-wallet/smart-sessions/overview).
- Coinbase AgentKit and Agentic Wallets emphasize agent wallets with programmable guardrails, per-session caps, transaction limits, key isolation, compliance screening, and revocation. Source: [Coinbase Agentic Wallets](https://www.coinbase.com/en-gb/developer-platform/discover/launches/agentic-wallets), [Coinbase AgentKit wallet management](https://docs.cdp.coinbase.com/agent-kit/core-concepts/wallet-management).
- Operator-style AI products require confirmation before sensitive side effects. The useful pattern for VALEN is not approval on every action; it is automatic execution for low-risk authorized actions and human review before consequential or out-of-policy actions. Source: [OpenAI Computer-Using Agent](https://openai.com/index/computer-using-agent/), [OpenAI guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals).
- Stripe, Ramp, Brex, and Mercury do not ask users to approve every transaction manually. They use spend limits, merchant/category restrictions, approval thresholds, role-based access, separation of duties, and auditability. Sources: [Stripe Issuing spending controls](https://docs.stripe.com/issuing/controls/spending-controls), [Ramp spend controls](https://docs.ramp.com/llms-guides/spend-controls.txt), [Brex spend limits](https://www.brex.com/support/manage-budgets-and-spend-limits), [Mercury roles and approvals](https://support.mercury.com/hc/en-us/articles/28768978787860-Understanding-roles-and-permissions).
- Robinhood-like UX sets expectations around chain clarity, trusted devices, 2FA, wallet/address safety, and delays for risky new destinations. VALEN should mirror the clarity, not expose chain IDs and raw addresses as the primary product language. Source: [Robinhood account security](https://www.robinhood.com/us/en/newsroom/keeping-your-robinhood-account-secure), [Robinhood Chain docs](https://docs.robinhood.com/).

### Recommended Wallet Model

Implement **Signed Mandates + Operator Settlement Relayer** now.

| Layer | Current implementation | Correct immediate model |
|-------|------------------------|--------------------------|
| User identity | Privy bearer token | Keep Privy bearer token for app session |
| User ownership | Connected/embedded wallet displayed | Require one-time wallet ownership signature and store signer address |
| Organization authority | Role from backend membership | Role + verified owner/admin wallet |
| Agent creation | Privy-authenticated API call | API call plus audit record; no wallet signature required unless assigning spend authority |
| Policy creation | Privy-authenticated API call | Draft via API; activating/publishing spend-affecting policy requires user wallet signature |
| Mandate/budget | Not implemented as signed authority | New signed EIP-712 mandate: agent, policy, chains, actions, targets, assets, limits, expiration, approval rules |
| Agent intent | Dashboard/API key request | Agent API key submits intent referencing active mandate |
| Human approval | Privy-authenticated approve/reject | Approval requires EIP-712 signature over execution hash when value/risk exceeds threshold |
| Settlement | Backend private key | Backend remains relayer for current `ValenSettlement`, but only after validating mandate and approval proof |
| User funds | Not truly user-wallet executed | Do not move user funds by backend signer; use explicit user signature or defer to smart account/session key phase |

### Why This Model Wins

| Option | Verdict for current VALEN |
|--------|---------------------------|
| A — User signs every execution | Safest for isolated transactions, but defeats autonomous agents and creates too much friction. Use only for high-risk exceptions. |
| B — Backend signs everything | Simplest technically, but unacceptable as the product trust model. Keep backend signer only as protocol relayer after signed authorization. |
| C — Privy embedded wallet only | Good onboarding, not enough authorization by itself. It proves wallet access only when the app actually requests signatures. |
| D — Smart account | Best long-term production wallet model, but too large for the immediate current architecture because it requires deployment/account setup, bundler/paymaster choices, chain support checks, and new execution code. |
| E — Session keys | Best autonomy primitive once smart accounts exist, but unsafe to bolt on before VALEN has signed policies, budgets, revocation, and proof UX. |
| F — Hybrid architecture | Correct only if narrowly defined as signed mandates plus operator relayer now, then smart accounts/session keys later. This is the best fit today. |

This model is safest because the backend cannot honestly claim authority unless a user-signed mandate or approval exists. It is simplest because it does not replace the already-proven Render worker and `ValenSettlement` path. It is easiest for users because they sign setup/changes, not every normal intent. It scales because mandates become the same product primitive that later maps to Safe modules, ZeroDev/Kernel, Biconomy, Alchemy, or Rhinestone sessions.

### Required Changes To Current Plan

Replace the old implementation interpretation:

- Old: “Backend/operator signer initially, future smart wallet/session key.”
- New: “User-signed mandates immediately, backend relayer only for protocol settlement/proof.”

Change the UX language:

- “Connect/create agent wallet” becomes “Verify owner wallet and authorize agent mandate.”
- “Wallet Center” becomes “Wallet & Authority,” showing connected owner wallet, verified status, signed mandates, agent API authority, relayer address, treasury/settlement contracts, and revocation state.
- “Submit Intent” must show the active mandate that permits or blocks the action.
- “Approvals” must show the exact threshold or policy reason requiring human signature.
- “Settlement” must say “VALEN relayer submitted proof transaction” unless a user/smart wallet actually signed the transaction.

Change the backend requirements:

- Add wallet ownership challenge endpoints.
- Add signed mandate creation/storage.
- Add policy/version activation signatures.
- Add approval signatures for high-risk executions.
- Verify signed mandate before queueing or settling executions.
- Store `authorizationHash`, `mandateId`, `mandateSignature`, `approvalSignature`, `signerAddress`, and `relayerAddress` in execution/proof DTOs.

Change the roadmap:

- Smart accounts and session keys remain P2/P3 after mandate proof, not P0.
- The current P0 is not “create smart wallets”; it is “make authority explicit and signed.”

### Updated User Flow

```text
Connect with Privy
→ If no wallet exists, Privy creates embedded wallet
→ User signs wallet ownership challenge
→ Create/select organization
→ Register agent
→ Create policy from template
→ Create mandate: chain + actions + targets + assets + amount limits + approval thresholds + expiration
→ User signs mandate
→ VALEN stores mandate and binds it to agent/API key
→ Agent or user submits intent
→ Backend verifies mandate, role, API key scope, idempotency, and chain support
→ Stylus compliance / eligibility / risk / policy evaluation
→ If inside limits, continue automatically
→ If outside limits, pause for human approval signature
→ Backend operator relayer submits settlement/proof transaction
→ UI shows final proof: user signer, mandate hash, agent request, verdicts, approval proof if any, relayer txs, audit trail
```

### Updated Feature Flows

#### Agents

Users create agents through the existing API flow. Creation itself does not need a wallet signature because it does not grant spend authority. Activation should require readiness checks: active policy, verified owner wallet, signed mandate, and scoped API key. Store creator user ID, creator wallet address if verified, default policy ID, mandate IDs, API key scopes, and audit events.

#### Policies

Policy drafts can be created by organization owners or policy managers with the API session. Policy versions that affect real execution authority must be signed by an owner/admin wallet before activation. Store rules hash, signer address, signature, policy version hash, activation timestamp, and audit event. The active policy becomes part of the mandate hash.

#### Wallets

Wallet linking should become ownership verification, not manual address entry. The app should generate a nonce, ask the connected/embedded wallet to sign a VALEN ownership message, verify it on the backend, and store the wallet as `verified`. Organizations can have owner/admin wallets; agents can reference delegated mandates, but agent wallets should not imply spending authority unless they are covered by a signed mandate.

#### Executions

Agents or users submit intents with an active mandate reference. The backend verifies the mandate before accepting the execution into the pipeline. The agent does not sign every intent in the first implementation; the API key is enough if it is bound to the mandate and its scopes are enforced. High-value or out-of-policy intents pause for approval.

#### Approvals

Human approval is required when the policy says so: amount above threshold, new target/counterparty, unsupported chain, high risk, expired/stale mandate, budget exceeded, sensitive action, team separation-of-duties rule, or manual review mode. Approval should be proven by an EIP-712 signature over the execution hash, decision, reason, approved amount, and expiry. The backend then records the proof and resumes settlement.

#### Settlements

The exact current settlement flow should be:

```text
Intent accepted
→ Mandate verified
→ Compliance/risk/policy/budget checks pass
→ Approval proof exists if required
→ Settlement row created
→ Worker re-checks mandate + latest execution state
→ Backend relayer calls `ValenSettlement.submitSettlement`
→ Backend relayer calls `ValenSettlement.approveSettlement`
→ Backend relayer calls `ValenSettlement.executeSettlement`
→ Submit/approve/execute tx hashes, block, settlement ID, relayer address, mandate hash, and approval hash are persisted
→ Proof page displays that this was VALEN operator-relayed settlement
```

If a future execution would transfer user-owned assets, do not let the backend relayer spend those assets. Require a user approval signature for that specific transfer or wait for smart-account/session-key execution.

#### Audit Logs

Every user-visible action should produce an audit event with actor, actor wallet if available, organization, agent, policy, mandate, execution, hash, and source. The proof page should group events by execution so users can answer: who authorized it, what the agent requested, what VALEN checked, who approved it, which relayer wrote it on-chain, and where the txs are.

---

## User Flow Architecture

### Correct primary flow

```text
Connect with Privy
→ Create/select organization
→ Choose chain goal
→ Register agent
→ Create policy from template
→ Verify owner wallet
→ Define permissions, limits, and approval thresholds
→ Define budget (for paid actions)
→ Sign agent mandate
→ Submit intent
→ Mandate verification
→ Compliance Engine
→ Eligibility Engine
→ Risk Engine
→ Policy Engine
→ Budget Engine
→ Human approval if required
→ VALEN operator-relayed settlement/proof
→ Proof + audit trail
```

### Guided setup state

The frontend should compute a setup state:

| Step | Data source | Complete when |
|------|-------------|---------------|
| Organization | `/v1/me`, `/v1/organizations/:id` | Active org selected |
| Wallet | Privy `useWallets()` + wallet verification API | Connected/embedded wallet has signed ownership challenge |
| Agent | `/agents` | At least one active agent |
| Policy | `/policies` | Active policy/version exists |
| Mandate | new mandates API | Agent has signed mandate for selected policy, action, chain, asset, limits, and expiry |
| Budget | new budgets API | Budget defined for paid action demo |
| First intent | `/executions` | Submitted and visible |
| Proof | proof API | Execution proof generated |

---

## Frontend Architecture

### Keep

- `AuthProvider`, `OrgProvider`, React Query hooks.
- Render-only API client.
- `QueryState`, `PageHeader`, `StatusBadge`, `StatCard`, `ChainBadge`.
- Dashboard pages for Agents, Executions, Approvals, Settlements, Audit Logs.
- Wallet Center, Contracts Center, Treasury, Governance as advanced pages.
- Landing page.

### Remove or demote

- Duplicate `app/dashboard/*` vs `app/(app)/dashboard/*`; keep one route system.
- Governance, Treasury, Contracts, Webhooks, Team, Settings should move under `Advanced` or `Settings`.
- Operator-style raw JSON blocks should not be visible in primary user journeys.
- “Risk Evaluations: Not exposed” should be replaced by “No risk evaluations yet” with setup guidance.

### Add primary product surfaces

- `/onboarding`
- `/dashboard/get-started`
- `/dashboard/mission-control`
- `/dashboard/intent-builder`
- `/dashboard/executions/:id/proof`
- `/dashboard/permissions`
- `/dashboard/budgets`
- `/dashboard/demo/robinhood-tsla`
- `/proofs/:proofId`

### Navigation redesign

Primary nav:

- Home
- Get Started
- Agents
- Policies & Permissions
- Intents
- Approvals
- Proofs

Secondary/advanced nav:

- Settlements
- Wallets
- Audit Logs
- Treasury
- Governance
- Contracts
- Webhooks
- Team
- Settings

---

## Backend Architecture

### Current backend path

1. Frontend calls `POST /v1/organizations/:organizationId/executions`.
2. `ExecutionsService` creates an `executions` row and enqueues intent.
3. `IntentProcessor` attests against live Stylus engines and stores `metadata.onchain`.
4. Compliance, risk, and policy processors persist rows and update status.
5. If approval is needed, execution becomes `approval_required`.
6. User calls approval endpoint.
7. `SettlementService.settle` creates a settlement row and enqueues settlement.
8. `SettlementWorkerService` calls `SettlementChainService.executeSettlement`.
9. Backend persists submit/approve/execute txs, block number, and on-chain settlement ID.
10. Audit logs are appended.

### Required backend changes for product integration

- Expand response DTOs to expose human-readable context.
- Add setup-state endpoint.
- Add wallet ownership challenge/verify endpoints.
- Add mandates endpoint for creating, listing, revoking, and verifying signed EIP-712 mandates.
- Add policy activation signature fields and approval signature fields.
- Add wallet list/balance endpoints.
- Add proof endpoint.
- Add budget/permission endpoints.
- Add Robinhood demo endpoint or template payload builder.
- Add event summary endpoint for dashboard mission timeline.
- Add SSE or polling-friendly status endpoint for execution progress.
- Enforce API key scopes or remove scope claims from the UI until enforcement exists.
- Enforce agent API keys against active mandate scope before accepting executions.
- Add an explicit “approve and settle” endpoint or make the frontend call `approve` then `settle` with clear progress states.

---

## Smart Contract Integration Map

| Contract | Frontend screens | Backend services/endpoints | User actions | Events/UI updates |
|----------|------------------|----------------------------|--------------|-------------------|
| `ValenRegistry` | Contracts, Setup, Chain Status | `OperatorChainService`, deployment manifest API | Select supported chain, verify deployments | Show registered contracts/engines and supported chains |
| `ValenSettlement` | Executions, Settlements, Proof, Contracts | `SettlementChainService`, `SettlementWorkerService` | Submit authorized intent, approve if required, retry failed settlement | Settlement status, relayer address, submit tx, approve tx, execute tx, block, explorer links |
| `ValenGovernance` | Governance, Advanced Settings | `OperatorChainService`, governance scripts/operator endpoints | Create/queue/execute proposal (advanced only) | Proposal status, queued action count, role checks |
| `ValenTreasury` | Treasury, Wallet Center, Dashboard | `OperatorChainService` treasury reads | View protocol treasury and fee state | Balance/fees refreshed by chain read |
| `ValenAuditLog` | Audit Logs, Proof pages | `AuditLogsRepository`, chain audit verification scripts | Inspect proof/audit events | Audit hash, tx hash, entity timeline |
| `ValenPolicyManager` | Policies & Permissions | Policy services and future contract sync | Publish/activate policy version | Active policy version and hash |
| `ValenMandateRegistry` | Wallet & Authority, Permissions, Agent detail | Mandate service now; future mandate chain service | Create/revoke signed mandate for agent permissions | Mandate signer, hash, usable/expired/revoked status |
| `ValenEscrow` | Future budgets/payments | Budget/payment services | Deposit/lock/release funds | Budget/escrow balances |
| `ValenEmergencyGuardian` | Advanced Settings | Admin/operator service | Pause/unpause protocol/org | Safety banner and disabled actions |

---

## Stylus Integration Map

| Engine | Current role | User action reaching it | Backend path | Frontend display |
|--------|--------------|-------------------------|--------------|------------------|
| `ComplianceEngine` | Evaluates compliance verdict/hash | Submit intent | Intent/stylus attestation and compliance processor | Compliance pass/fail, reason code, result hash |
| `EligibilityEngine` | Checks mandate/subject eligibility | Submit intent after permissions exist | `StylusEngineService` live engine calls | Eligibility dimension pass/fail |
| `RiskEngine` | Computes score/tier/approval requirement | Submit intent | Risk processor persists score | Score, tier, factors, approval reason |
| `PolicyEngine` | Evaluates policy rules and approval level | Submit intent with active policy | Policy processor | Policy result, active version, rejected/approval_required |
| Future `BudgetEngine` | Budget/spend check | Paid action request | Budget processor | Budget approved/refused, remaining allowance |

### UX requirement

Stylus should not be shown as “raw engine internals” in the main flow. The execution detail page should show:

- “Compliance passed because counterparty/asset/action are allowed.”
- “Risk is low/medium/high because amount/asset/counterparty factors.”
- “Policy approved because active policy version X allows this action.”
- Hashes and engine addresses in an expandable proof panel.

---

## Robinhood Integration Map

### Current state

- Robinhood Testnet deployments exist.
- Frontend includes chain option `46630`.
- Contracts and Stylus manifests include Robinhood addresses.
- Wallet Center warns on unsupported connected chains.

### Product gap

The frontend does not provide a Robinhood-specific user journey. Users must know to select Robinhood Testnet and choose a target address/action manually.

### Required UX

- Add a `Robinhood TSLA Demo` guided route.
- Explain chain switching without requiring users to know chain ID `46630`.
- Detect wallet chain and show “Switch to Robinhood Testnet” instructions.
- Pre-fill demo action: “Agent requests TSLA exposure / trade intent”.
- Run two scenarios:
  - Allowed TSLA intent under policy/budget.
  - Refused TSLA intent over policy/budget.
- Display Robinhood-specific contract addresses, explorer links, and proof.

---

## Database Integration Map

| Table(s) | Current use | Frontend page | Gap |
|----------|-------------|---------------|-----|
| `users`, `organization_memberships` | Privy identity and org membership | Header, auth, org selector | No full org onboarding screen |
| `organizations` | Active org config | Dashboard, Settings | Settings needs clearer setup controls |
| `agents` | Agent list/detail | Agents | Needs guided setup and agent readiness score |
| `agent_wallets` | Link wallets | Agent detail, Wallet & Authority partial | No list API in frontend; no ownership proof |
| New `wallet_verifications` | Not implemented | Wallet & Authority | Required to store challenge nonce, signature, signer, chain, and verified status |
| New `agent_mandates` | Not implemented | Wallet & Authority, Agents, Intent Builder | Required to store signed authority: agent, policy, chains, actions, targets, limits, expiry, signature, revocation |
| `api_keys` | Agent API keys | Agent detail | Needs “agent connection” instructions and mandate-bound scope enforcement |
| `policies`, `policy_versions` | Policy lifecycle | Policies | Need templates/rule builder and signed activation proof |
| `executions`, `intent_idempotency_keys` | Intent pipeline | Executions, Dashboard | Need richer DTO/progress/proof plus mandate and approval signature references |
| `compliance_checks`, `compliance_attestations` | Compliance result | Execution detail, Compliance | Need explanations/hash details |
| `risk_scores` | Risk score | Execution detail | Need factors/reasoning |
| `settlements` | On-chain settlement | Settlements, Execution detail | DTO must expose submit/approve/execute txs |
| `audit_logs`, `audit_events`, `audit_commitments` | Audit trail | Audit Logs, Proof | Need proof page/export grouped by mandate, execution, approval, and relayer tx |
| `webhooks`, `webhook_deliveries` | Integrations | Webhooks | Works, but secondary |
| `notifications` | Alerts | Not primary | Needs notification center later |
| Future budget/proof tables | Not implemented | Budgets, Proofs | Required for S-tier scope |

---

## API Integration Map

### Auth and organization

- `POST /v1/auth/sync`: Privy token sync and user creation.
- `GET /v1/me`: current user, org memberships, permissions.
- `POST /v1/organizations`: exists, but frontend does not expose first-run org creation clearly.
- `GET/PATCH /v1/organizations/:id`: settings and org context.

### Agent

- `GET/POST /v1/organizations/:id/agents`
- `GET/PATCH /v1/organizations/:id/agents/:agentId`
- `POST /activate`, `/suspend`, `/revoke`
- `POST /wallets`
- `POST /api-keys`

Gap: list wallets, verify wallet ownership, readiness endpoint.
Add: wallet challenge endpoints and mandate readiness in agent detail.

### Policy

- `GET/POST /policies`
- `GET /policies/:policyId`
- `POST /versions`, `/submit`, `/publish`, `/activate`

Gap: frontend only creates a simple policy; no rule builder, template lifecycle, or signed activation proof.

### Wallet and mandate

- `POST /v1/organizations/:id/wallets/challenge`
- `POST /v1/organizations/:id/wallets/verify`
- `GET /v1/organizations/:id/wallets`
- `GET/POST /v1/organizations/:id/mandates`
- `GET /v1/organizations/:id/mandates/:mandateId`
- `POST /v1/organizations/:id/mandates/:mandateId/revoke`
- `POST /v1/organizations/:id/mandates/:mandateId/verify`

Gap: these endpoints do not exist yet. They are the immediate bridge between Privy identity and trustworthy autonomous execution.

### Execution/settlement

- `GET/POST /executions`
- `GET /executions/:executionId`
- `POST /cancel`
- `GET /timeline`
- `GET /executions/:executionId/compliance`
- `GET /executions/:executionId/risk`
- `GET /executions/:executionId/settlement`
- `POST /executions/:executionId/approve`
- `POST /executions/:executionId/settle`
- `POST /settlements/:settlementId/retry`

Gap: proof endpoint, richer settlement DTO, mandate verification fields, approval signature fields, and relayer identity.

### Operator

The frontend uses operator endpoints for treasury/governance/contracts. These require `OPERATOR_DASHBOARD_SECRET` and are better suited for advanced/admin surfaces, not primary user flow.

---

## UX Simplification Plan

### Replace the dashboard homepage

Current: metrics grid.  
Target: mission control.

Top card:

- “You are 5 steps from running your first governed agent.”
- Step 1: Register/activate agent.
- Step 2: Create policy.
- Step 3: Verify wallet and sign mandate.
- Step 4: Submit intent.
- Step 5: View proof.

### Empty states

Every empty state should answer:

- What is this?
- Why is it empty?
- What should I do next?
- Which button starts the action?

### Terminology

Replace operator terms:

- “Execution” → “Intent” in primary UI.
- “Settlement submitted” → “On-chain execution in progress.”
- “Operator treasury” → “Protocol treasury.”
- “Raw contract state” → advanced proof details.

### Visual flow

Execution detail should become a vertical pipeline:

```text
Intent received
Compliance checked
Eligibility checked
Risk scored
Policy evaluated
Budget checked
Approval required / skipped
Settled on-chain
Proof generated
```

---

## Page-by-Page Implementation Plan

### Dashboard

- Works: Render-backed counts for agents, executions, approvals, treasury, governance, audit, policies.
- Partial/mock: `Risk Evaluations` says `Not exposed`; compliance count inferred from audit events.
- Endpoint: `/agents`, `/executions`, `/audit-logs`, `/policies`, `/api/operator/treasury`, `/api/operator/governance/status`.
- Contract: Treasury/Governance through operator read.
- Required actions: start onboarding, run first intent, continue incomplete setup.
- UX change: make it Mission Control, not metrics-only.

### Executions

- Works: list, filter, submit intent link.
- Partial: raw table; no explanation of why no executions exist; no active mandate shown before submission.
- Endpoint: `/executions`.
- Contract: eventual settlement through backend.
- Required actions: guided intent builder, templates, chain switch, active mandate selector, proof link.
- UX change: rename primary UI to `Intents`.

### Approvals

- Works: lists `approval_required`; approve/deny.
- Partial: approval cards lack risk context, policy reason, amount, target, mandate context, and proof preview.
- Endpoint: `/executions?status=approval_required`, `/executions/:id/approve`.
- Contract: approval unlocks operator-relayed settlement.
- Required actions: approve/deny with visible risk/policy rationale and wallet signature proof.
- UX change: show “why approval is required.”

### Settlements

- Works: monitors executions with settlement-relevant statuses.
- Partial: row-level API fetch hides submit/approve/execute tx split because frontend DTO is thin.
- Endpoint: `/executions`, `/executions/:id/settlement`.
- Contract: `ValenSettlement`.
- Required actions: retry failed, open proof, explorer links, show relayer address and mandate hash.
- UX change: move to advanced, surface final status in execution proof as operator-relayed settlement.

### Wallets

- Works: Privy connected wallet, settlement wallet, treasury read, explorer links.
- Partial: connected wallet balance unavailable; org wallet unavailable; ownership is not verified; active mandates are not listed.
- Endpoint: Privy `useWallets`, `/api/operator/treasury`, `/agents`.
- Contract: Treasury/Settlement display only.
- Required actions: connect/switch wallet, sign ownership challenge, list verified wallets, create/revoke signed mandates, show relayer/settlement contract.
- UX change: convert to `Wallet & Authority`, not a generic wallet setup wizard.

### Agents

- Works: list, detail, register, activate/suspend/revoke, link wallet, API key.
- Partial: displays policy ID rather than policy name in list; no readiness score; no mandate-bound authority state.
- Endpoint: `/agents`.
- Contract: no direct contract interaction yet.
- Required actions: create agent, assign policy, sign mandate, create mandate-bound API key, verify readiness.
- UX change: add Agent Readiness checklist with verified wallet, active policy, signed mandate, API key, and last proof.

### Policies

- Works: create/list/detail/version backend exists.
- Partial: frontend create is basic; policy rules are not consumer-editable; activation is not wallet-signed.
- Endpoint: `/policies`, `/policies/:id`, `/versions`.
- Contract: PolicyManager/PolicyEngine relationship is not visible.
- Required actions: template selection, rules editor, publish/activate flow, EIP-712 signature for spend-affecting policy activation.
- UX change: combine with Permissions.

### Compliance

- Works: subject/check reads exist.
- Partial: not a product workflow; mostly inspection.
- Endpoint: `/compliance/subjects/:subjectRef`, execution compliance endpoint.
- Contract/Stylus: ComplianceEngine.
- Required actions: explain verdicts on execution detail.
- UX change: move compliance logs under Execution Proof; keep page advanced.

### Audit Logs

- Works: real audit logs, filtering, export.
- Partial: not tied to proof page; event hashes are truncated and not explained.
- Endpoint: `/audit-logs`, `/audit-exports`.
- Contract: `ValenAuditLog`, audit commitments.
- Required actions: open event proof, export proof pack, filter by mandate/execution/approval/relayer tx.
- UX change: add proof-centric grouping by execution.

### Governance

- Works: operator read for timelock/governance/roles/queued actions.
- Partial: raw JSON and admin semantics.
- Endpoint: `/api/operator/governance/status`.
- Contract: `ValenGovernance`, `ValenTimelock`.
- Required actions: none for normal users.
- UX change: move to Advanced.

### Treasury

- Works: operator read for treasury address/balance/fees.
- Partial: raw wei values, raw JSON.
- Endpoint: `/api/operator/treasury`.
- Contract: `ValenTreasury`.
- Required actions: none for normal users today.
- UX change: advanced page, format values.

### Contracts

- Works: manifest-backed contract/Stylus addresses, explorer links.
- Partial: manifest health only, not live bytecode/admin reads.
- Endpoint: `/api/contracts`.
- Contract: all deployed contracts/engines.
- Required actions: none for normal users.
- UX change: advanced proof/deployment page.

### Webhooks

- Works: list/create/update/delete/test.
- Partial: no setup guidance or event catalog.
- Endpoint: `/webhooks`.
- Required actions: create webhook from template, choose events.
- UX change: advanced integration page.

### Team

- Works: list/invite/update.
- Partial: not central to first-run demo.
- Endpoint: `/team`, `/team/invitations`.
- Required actions: invite teammate.
- UX change: settings area.

### Settings

- Works: org update likely available.
- Partial: should own chain, risk mode, compliance mode, operator status.
- Endpoint: `/organizations/:id`.
- UX change: simplify and move advanced config here.

---

## Priority Order

### P0 = Must Fix Immediately

1. Remove duplicate route trees; keep one canonical `app/(app)/dashboard/*` or `app/dashboard/*`.
2. Confirm Vercel build green and Privy domain configured.
3. Add wallet ownership challenge/verify flow for connected or embedded Privy wallets.
4. Add signed mandate data model/API/UI for agent authority.
5. Enforce active mandate before accepting or settling an execution.
6. Clarify wallet architecture in UI: owner wallet vs signed mandate vs agent API key vs VALEN operator relayer.
7. Add guided empty states on Dashboard, Executions, Approvals, Settlements, Agents, Policies.
8. Add first-run Mission Control checklist.
9. Expand Execution detail UI into pipeline view.
10. Expose richer settlement DTO fields in frontend/API.
11. Add proof view for completed executions.

### P1 = Required For Demo

1. Onboarding route with create/select org, register agent, create policy, submit first intent.
2. Agent readiness checklist.
3. Policy template wizard.
4. Signed policy activation for spend-affecting policy versions.
5. Intent templates for Arbitrum transfer and Robinhood demo.
6. Approval card with risk/policy/compliance/mandate context and wallet signature proof.
7. Settlement/proof page with tx hashes, relayer address, mandate hash, and explorer links.
8. Wallet & Authority flow with chain switching help.
9. Move Governance/Treasury/Contracts into Advanced.

### P2 = Required For Submission

1. Refusal receipts.
2. Proof API and public proof pages.
3. Paid Permissioned Actions with budget checks.
4. Budget Engine and budget dashboard.
5. Smart account/session-key proof-of-concept after mandates and proof pages are stable.
6. MCP server and SDK.
7. ERC-8004 identity integration.
8. Stylus benchmark suite.
9. Robinhood TSLA end-to-end demo.
10. Proof Pack page.

### P3 = Post-Hackathon

1. Full smart account/session key execution across Safe/ZeroDev/Biconomy/Alchemy/Rhinestone-compatible providers.
2. User-paid gas sponsorship management.
3. Multi-org billing.
4. Rich notification center.
5. Live WebSocket/SSE execution streaming.
6. Mainnet governance/admin console.
7. Production compliance provider integrations.

---

## Exact Implementation Order

1. Stabilize Vercel build and canonical dashboard route tree.
2. Add wallet ownership challenge/verify API and UI.
3. Add `Wallet & Authority` page state: verified owner wallet, relayer address, settlement contract, active mandates.
4. Add signed mandate schema/API: agent, policy version, chains, actions, targets, assets, limits, approval thresholds, expiry, signer, signature, status.
5. Add policy template + activation flow, with signature required when activation grants spend/execution authority.
6. Update agent readiness so an agent is not “ready” until it has active policy, signed mandate, and mandate-bound API key.
7. Enforce API key scopes and active mandate checks before execution creation.
8. Update intent builder to select/show the active mandate and explain whether the action is auto-allowed or needs approval.
9. Add approval signatures for executions outside mandate or above threshold.
10. Update settlement worker/service to re-check mandate and approval proof before operator-relayed settlement.
11. Expand settlement/proof DTOs with mandate hash, approval signature, relayer address, submit/approve/execute txs, on-chain settlement ID, and block.
12. Build proof page and group audit logs by execution.
13. Add Robinhood guided demo using the same mandate and proof model.
14. Only after the above is stable, evaluate smart accounts/session keys as P2/P3 execution infrastructure.

---

## Exact Development Sequence

### Sequence 0 — Freeze and clean the route surface

1. Decide canonical route layout.
2. Delete or migrate duplicate dashboard tree.
3. Consolidate provider stack so Privy, React Query, AuthProvider, and OrgProvider initialize exactly once.
4. Run `pnpm --filter frontend build`.
5. Verify screenshots still map to the canonical routes.

### Sequence 1 — Mission Control

1. Add setup-state helper from existing hooks.
2. Replace dashboard top content with guided checklist.
3. Keep metrics below the checklist.
4. Link each incomplete step to the correct page.

### Sequence 2 — Onboarding

1. Add `/onboarding`.
2. If `/v1/me` has no org, show create organization.
3. If org exists but no active agent, show register agent.
4. If no active policy, show policy template.
5. If no execution, show intent builder.

### Sequence 3 — Wallet verification and authority

1. Add wallet ownership challenge endpoint.
2. Add wallet verification endpoint that verifies EIP-191/EIP-712 signature and stores signer, chain, nonce, and status.
3. Convert Wallet Center into `Wallet & Authority`.
4. Show connected/embedded wallet, verified owner wallet, settlement relayer, settlement contract, and treasury contract.
5. Add chain switch UX without requiring users to understand chain IDs.

### Sequence 4 — Signed mandates

1. Add mandate table/repository/API.
2. Define typed-data payload for agent, policy version, allowed chains/actions/assets/targets, amount limits, approval thresholds, and expiry.
3. Add mandate creation UI after policy template selection.
4. Require owner/admin wallet signature to activate mandate.
5. Add mandate revoke flow and audit events.

### Sequence 5 — Agent readiness

1. Show active/draft status.
2. Show policy assignment.
3. Show verified wallet/authority status.
4. Show signed mandate status.
5. Show mandate-bound API key state.
6. Gate “Submit Intent” until agent is ready, with override only for clearly labeled test/demo mode.

### Sequence 6 — Policy and permissions

1. Add templates.
2. Add rule builder for allowed chains/actions/assets/amounts.
3. Add publish/activate flow in UI.
4. Require signature for spend-affecting activation.
5. Surface active policy and mandate in agent and intent builder.

### Sequence 7 — Intent builder

1. Replace raw form with templates.
2. Pre-fill settlement target for demo where appropriate.
3. Validate chain, target, amount, and active mandate before submit.
4. Explain whether the intent is inside mandate or needs approval.
5. Submit mandate ID with execution payload.

### Sequence 8 — Execution pipeline UI

1. Add pipeline timeline component.
2. Bind mandate/compliance/risk/settlement/timeline endpoints.
3. Add polling until terminal state.
4. Show errors with “what failed and next action.”
5. For approval-required executions, request a wallet signature over the approval before settlement resumes.

### Sequence 9 — Settlement/proof detail

1. Expand backend DTO for settlement tx fields.
2. Add mandate hash, approval signature, and relayer address to proof DTOs.
3. Add proof endpoint.
4. Create `/dashboard/executions/:id/proof`.
5. Add public `/proofs/:id`.
6. Link Audit Logs to proof pages.

### Sequence 10 — Settlement relayer guardrails

1. Re-check mandate status in `SettlementService.settle`.
2. Re-check mandate status and approval proof in the worker before `SettlementChainService.executeSettlement`.
3. Fail closed if mandate expired, revoked, mismatched, or approval proof is missing.
4. Persist relayer address and all tx hashes.
5. Document that settlement is VALEN operator-relayed proof unless a user/smart wallet actually signed the transaction.

### Sequence 11 — Robinhood demo

1. Add `/dashboard/demo/robinhood-tsla`.
2. Add chain detection and switch instructions.
3. Preload TSLA-style allowed/refused scenarios.
4. Generate proof for both approval and refusal.

### Sequence 12 — S-tier buildathon features

Execute `MASTER_EXECUTION_PLAN.md` in order:

1. Baseline freeze.
2. Database foundation.
3. Refusal receipt registry and budget vault.
4. Refusal receipt backend and proof API.
5. ERC-8004.
6. SDK.
7. MCP.
8. x402 paid actions.
9. Budget Engine.
10. Mission Control/proof pages.
11. Robinhood TSLA demo.
12. Arbitrum One deployment.
13. Proof Pack and final submission assets.

---

## Final Product Definition

VALEN should not be presented as “a dashboard with agents.” It should be presented as:

> The permission layer that lets autonomous agents request financial actions, proves whether they are allowed, refuses unsafe actions with receipts, and settles approved actions on Arbitrum and Robinhood with a complete audit trail.

The current system already has enough backend/chain power to support that narrative. The frontend must now hide operator complexity, guide users through setup, and make every execution end in a clear proof.

