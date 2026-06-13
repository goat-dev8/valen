# MASTER EXECUTION PLAN

VALEN's active buildathon roadmap is now optimized for one outcome: win Arbitrum Open House London.

This is not a greenfield implementation plan. It assumes the current product baseline is real and proven:

- Frontend connected to Render through Vercel.
- Backend connected to Supabase, Redis, BullMQ, Privy, Arbitrum Sepolia, and Robinhood Testnet.
- Contracts deployed on Arbitrum Sepolia and Robinhood Testnet.
- Four Stylus engines deployed and registered on both chains.
- Settlement pipeline proven on Render.
- Wallet verification, signed mandates, policy templates, intent builder, approval signatures, proof page, wallet balances, and dashboard pages exist.
- Robinhood Testnet execution `7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c` is proven executed.
- Arbitrum Sepolia execution `d872b0a7-e7de-4a86-887b-b6ac682c7173` is proven executed.
- `docs/summary.md` remains the running proof log.

The active product narrative changes from:

> complex compliance infrastructure

to:

> VALEN is the operating system for autonomous finance.

The 60-second explanation:

> Create an agent, give it a USDC budget and rules, fund it, let it act, and see an immutable proof for every approval or refusal.

## Non-Negotiable Product Decisions

1. **USDC first.** USDC becomes the primary product asset, demo asset, policy asset, budget asset, proof asset, and x402 payment asset. Native ETH remains only the gas and legacy settlement rail.
2. **Robinhood is a headline feature.** Robinhood is not a sidebar demo. It is the tokenized-asset track: safe TSLA action settled, unsafe TSLA action refused, both proven.
3. **Mainnet is not active execution.** Arbitrum One rollout is moved to Future Phases. The buildathon active plan prioritizes clarity, demo reliability, USDC, proof, and submission packaging over mainnet deployment risk.
4. **One user journey wins.** User flow is: Connect Wallet -> Create Agent -> Set Rules -> Fund Agent -> Execute -> See Proof.
5. **Admin surfaces are secondary.** Governance, Treasury, Contracts, Audit, Team, Webhooks, and Operator data support judge confidence. They must not compete with the primary user journey.
6. **Proof is the product.** Every winning screen should answer: what happened, why was it allowed or refused, what funds were at risk, and where is the proof?
7. **No generic copilot.** Do not add chat, generic AI assistant, strategy advice, or unrelated dashboard complexity before submission.

## Current Baseline Audit

### Product Surface

Primary routes:

- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/app/dashboard/agents/page.tsx`
- `frontend/src/app/dashboard/register-agent/page.tsx`
- `frontend/src/app/dashboard/policies/page.tsx`
- `frontend/src/app/dashboard/policies/new/page.tsx`
- `frontend/src/app/dashboard/wallets/page.tsx`
- `frontend/src/app/dashboard/executions/page.tsx`
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `frontend/src/app/dashboard/executions/[executionId]/page.tsx`
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`
- `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`

Supporting routes:

- `frontend/src/app/dashboard/approvals/page.tsx`
- `frontend/src/app/dashboard/settlements/page.tsx`
- `frontend/src/app/dashboard/compliance/page.tsx`
- `frontend/src/app/dashboard/audit/page.tsx`
- `frontend/src/app/dashboard/governance/page.tsx`
- `frontend/src/app/dashboard/treasury/page.tsx`
- `frontend/src/app/dashboard/contracts/page.tsx`
- `frontend/src/app/dashboard/webhooks/page.tsx`
- `frontend/src/app/dashboard/team/page.tsx`
- `frontend/src/app/dashboard/settings/page.tsx`

Decision: keep the supporting routes, but visually subordinate them under "Evidence & Admin" after the winning flow is polished.

### Backend Surface

Current active modules:

- `AuthModule`
- `OrganizationsModule`
- `AgentsModule`
- `PoliciesModule`
- `MandatesModule`
- `ComplianceModule`
- `RiskModule`
- `SettlementModule`
- `StylusModule`
- `AuditModule`
- `NotificationsModule`
- `WebhooksModule`
- `OperatorModule`

Decision: add new modules only when they create judge-visible primitives: USDC settlement, budgets, x402 paid actions, ERC-8004 identity, MCP, SDK, and proof pack.

### Contract Architecture

Existing contracts:

- `ValenRegistry`
- `ValenPolicyManager`
- `ValenMandateRegistry`
- `ValenSettlement`
- `ValenTreasury`
- `ValenEscrow`
- `ValenGovernance`
- `ValenAuditLog`
- `ValenEmergencyGuardian`
- `ValenTimelock`

Active deployments:

- Arbitrum Sepolia `421614`: `contracts/deployments/arbitrum-sepolia/deployment.json`
- Robinhood Testnet `46630`: `contracts/deployments/robinhood-testnet/deployment.json`

Decision: do not deploy Arbitrum One during active buildathon execution. Improve the existing two-chain proof system first.

### Stylus Engines

Existing engines:

- `ComplianceEngine`
- `RiskEngine`
- `EligibilityEngine`
- `PolicyEngine`

Active deployment artifacts:

- `stylus/deployments/arbitrum-sepolia/engines.json`
- `stylus/deployments/robinhood-testnet/engines.json`

Decision: add `BudgetEngine` only if it directly supports USDC budget/x402 proof and benchmark narrative. Do not add engines for vanity.

### Current Gap

The product works, but the story is too broad. Judges see too many pages before they see the winning primitive. The roadmap must compress the product into one memorable operating system:

Agent identity + USDC budget + rules + execution + proof.

## Competitive Ranking Report

The census contains multiple rankings from different agents. The active VALEN strategy uses our own judge-weighted ranking, not the previous order.

### Likely Overall Finalists

1. **AgentAudit AI** — strongest overall evidence package: mainnet breadth, ERC-8004, MCP, SDK, compliance narrative.
2. **CronStream** — milestone payroll is concrete, x402 appears, tests/coverage and workflow are easy to understand.
3. **Mandate** — best simple Robinhood agent-safety demo: allowed action vs blocked action.
4. **Osmium** — cleanest Robinhood + agent SpendOps positioning.
5. **OBSCURA** — largest technical surface and privacy ambition.
6. **Monaris** — real Arbitrum One volume and commercial PayFi.
7. **Collateral Passport** — serious Robinhood evidence, SDK, tests, subgraph.
8. **Aegis / VetoVault / FortiLayer cluster** — strongest Stylus/security proof narratives.
9. **MiTanda** — best consumer UX and real mainnet use.
10. **RefusalRail** — narrow but owns "NO receipt" language.

### Category Clusters

- **Agent safety and permissioning:** AgentAudit, Mandate, Osmium, FortiLayer, VetoVault, RefusalRail, Nyxora, bvcc-wallet-agent.
- **Robinhood RWA/tokenized assets:** Mandate, Osmium, Collateral Passport, ATLAS, RobinUSD, EquiFlow, Vela, CorpAction Engine.
- **x402/agentic commerce:** CronStream, Joy, Tollkit, ClawLens, ACHIVX, Giggy, Silent Swap, Fangorn.
- **FHE/privacy:** OBSCURA, PHANTOM, kura, Bluff & Barrel, Shielded, ShadowBid.
- **Consumer UX/mainnet:** MiTanda, Palpitada, Bundie.
- **Overengineered or unfocused:** OBSCURA risk from breadth, HyperDex regulatory overreach, OmniVault legal risk, ArbiGame generated-code security risk, generic yield/DEX aggregators.

### What Competitors Do Better

- AgentAudit: standard package of SDK + MCP + ERC-8004 + mainnet proof.
- CronStream: very clean event-to-payment demo and test proof.
- Mandate: simplest Robinhood story.
- Osmium: sharper SpendOps category claim.
- OBSCURA: artifact density and technical ambition.
- Monaris/MiTanda: live mainnet/value credibility.
- Collateral Passport: evidence discipline, tests, SDK, subgraph.
- VetoVault/Aegis: single benchmark number judges remember.

### What VALEN Does Better

- VALEN already combines identity, policy, mandates, compliance, risk, settlement, audit, dashboard, and proof in one operating layer.
- VALEN can show both "YES, funds moved" and "NO, funds did not move" instead of only auditing after the fact.
- VALEN can bridge two judge narratives: USDC agent payments and Robinhood tokenized assets.
- VALEN's existing dashboard is broader than most competitors, but must be simplified into a sharper flow.

### How VALEN Dominates

VALEN should not try to beat each competitor on its own terrain. It should define the larger category:

> Competitors build wallets, policies, receipts, x402 endpoints, tokenized-asset apps, or compliance logs. VALEN is the operating system that coordinates all of them before an autonomous agent moves money.

## Feature Gap Analysis

| Gap | Current Status | Buildathon Decision |
| --- | --- | --- |
| USDC as primary asset | USDC shown as policy-scope asset; settlement is native ETH | Make USDC first-class in UI, budgets, proof, and x402; implement ERC-20 settlement if time allows |
| Robinhood headline story | Working execution exists but page is a supporting demo | Promote to primary demo card and submission narrative |
| Refusal receipts | Audit/failure exists; no first-class receipt primitive | Add refused-action proof object/page/API |
| ERC-8004 identity | Not implemented | Add minimal identity binding and proof badge |
| SDK | Not implemented | Ship typed client covering agent, execution, proof, receipt |
| MCP | Not implemented | Ship tools agents can call during demo |
| x402 paid actions | Not implemented | Add USDC paid-action request as Agentic headline if core flow remains stable |
| Proof pack | Proof page exists per execution | Add public proof pack page + JSON endpoint + verifier script |
| UX hierarchy | Many routes visible equally | Reorder around one user journey and demote admin routes |
| Mainnet | Not deployed | Future phase; not active buildathon execution |

## Product Repositioning

### Category

VALEN is **The Operating System for Autonomous Finance**.

### Primary Customer

Teams allowing autonomous agents to spend, trade, rebalance, buy data, or call paid APIs without losing control of capital.

### Primary Asset

USDC.

Why:

- It is judge-legible.
- It is stable.
- It is the dominant asset in x402 examples and agentic commerce.
- It avoids the confusion of "TSLA label but ETH transfer."
- It makes budgets intuitive.
- It supports a commercial story: every agent needs a monthly USDC budget.

### Secondary Asset

Robinhood tokenized assets.

Why:

- Robinhood Chain is a reserved-prize path.
- Tokenized stocks make the safety story memorable.
- TSLA is a more visual demo than abstract compliance.

## UX Audit

### Screens To Promote

- Dashboard -> Mission Control
- Onboarding
- Agents
- Policies
- Wallets
- Intent Builder
- Execution Detail
- Proof
- Robinhood Demo

### Screens To Demote

- Governance
- Treasury
- Contracts
- Compliance
- Audit
- Webhooks
- Team
- Settings

These are important, but judges should see them after the core flow.

### Screens To Merge Conceptually

- `Wallets` should become **Fund & Authority**: balances, wallet verification, mandate signing, and funding state in one place.
- `Policies` should become **Rules** in user-facing copy.
- `Executions` should become **Activity** in user-facing copy, while retaining internal route names.
- `Robinhood Demo` should become **Tokenized Stocks** or **Robinhood Assets**.

### New User Flow

1. Connect Wallet.
2. Create Agent.
3. Set Rules.
4. Fund Agent with USDC.
5. Execute USDC action or Robinhood asset action.
6. See Proof.

Everything else is supporting evidence.

## Priority Matrix

| Priority | Work | Judge Impact | Risk | Decision |
| --- | --- | --- | --- | --- |
| P0 | UX simplification into one flow | Very high | Low | Do first |
| P0 | USDC-first copy, templates, balances, proof | Very high | Low/Medium | Do first |
| P0 | Robinhood as headline demo | Very high | Low | Do first |
| P0 | Proof Pack page/API | Very high | Medium | Do before SDK/MCP demo |
| P1 | Refusal receipts | Very high | Medium | Do after proof pack or in parallel |
| P1 | ERC-8004 identity badge | High | Medium | Do minimal, proof-first |
| P1 | Policy + Budget engine | High | Medium | USDC budget needed for OS story |
| P1 | x402 paid actions | High | Medium/High | Keep scoped as x402 consumer |
| P2 | SDK | Medium/High | Medium | Ship minimal typed client |
| P2 | MCP | High for Agentic | Medium | Ship minimal tools |
| P3 | Extra governance/treasury UI | Low | Low | Defer |
| Future | Arbitrum One mainnet | High credibility, high risk | High | Move out of active plan |

## Demo Narrative

### 30 Seconds

> VALEN is the operating system for autonomous finance. An agent gets a USDC budget and rules. It tries to act. VALEN checks compliance, risk, budget, and policy through Stylus and contracts. If the action is safe, it settles and produces proof. If it is unsafe, it refuses and produces a receipt. The same system powers USDC agent spending and Robinhood tokenized-stock actions.

### 2 Minutes

1. Start on Mission Control: setup complete, agent ready.
2. Show Fund & Authority: wallet verified, USDC balance visible, active mandate.
3. Submit a USDC-first action: agent spends under rule.
4. Open execution: Compliance -> Risk -> Policy -> Settlement.
5. Open proof: tx hashes, agent, mandate, policy, verdict.
6. Switch to Robinhood Assets: TSLA safe action executed.
7. Show refused/budget-breaching scenario if available.
8. End on Proof Pack: one page proving contracts, engines, txs, and API state.

### Judge Memory Hook

> Every autonomous dollar needs an operating system. VALEN is it.

## Judge Scoring Strategy

| Judging Dimension | VALEN Strategy |
| --- | --- |
| Technical execution | Show live Render, Supabase, Redis, contracts, Stylus engines, dual-chain txs |
| Product clarity | Lead with one flow and one sentence |
| Arbitrum alignment | Stylus engines + Arbitrum Sepolia + Robinhood Orbit |
| Agentic AI | MCP tool call + ERC-8004 identity + agent budget |
| Robinhood | Headline tokenized-asset execution and proof |
| Business potential | USDC budget and payment OS for agents |
| UX | Fintech-style setup checklist, funding state, proof link |
| Security | Permissioned mandates, policy/risk/compliance checks, refusal receipts |
| Traction/proof | Proof Pack with real tx hashes and verifier |

## Active Execution Phases

# PHASE A — Current State Audit

## Goals

- Freeze the proven product baseline.
- Convert current evidence into a judge-readable baseline.
- Identify which screens confuse the primary flow.

## Files

- `docs/summary.md`
- `MASTER_EXECUTION_PLAN.md`
- `frontend/src/components/app/sidebar.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`
- `contracts/deployments/*/deployment.json`
- `stylus/deployments/*/engines.json`

## Dependencies

None.

## Migrations

None.

## APIs

Read only:

- `GET /health/live`
- `GET /health/ready`
- `GET /v1/operator/validate/full`
- Existing execution, settlement, mandate, policy, wallet endpoints.

## Frontend Changes

- Add a "Buildathon Proof Baseline" section to Mission Control.
- Surface latest Arbitrum and Robinhood successful executions.
- Add "Proof Pack" as a primary CTA once Phase I exists.

## Backend Changes

- No runtime changes.
- Ensure existing proof fields are returned consistently.

## Tests

```bash
cd frontend && pnpm build
cd backend && pnpm build
cd backend && pnpm test -- --runInBand
```

Production checks:

```bash
curl -fsS https://valen-api-m3g4.onrender.com/health/ready
```

## Acceptance Criteria

- Current Arbitrum and Robinhood execution IDs are documented.
- Every active route is categorized as primary flow or support.
- `docs/summary.md` records the audit and verdict.

# PHASE B — UX Simplification

## Goals

- Make the value understandable in under 60 seconds.
- Reorder navigation around the winning user flow.
- Reduce "admin dashboard" feeling.

## Files

- `frontend/src/components/app/sidebar.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/app/dashboard/wallets/page.tsx`
- `frontend/src/app/dashboard/policies/page.tsx`
- `frontend/src/app/dashboard/executions/page.tsx`
- `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`
- `frontend/src/components/marketing/hero-section.tsx`
- `frontend/src/app/page.tsx`

## Dependencies

- Phase A.

## Migrations

None.

## APIs

No new APIs.

## Frontend Changes

- Rename user-facing copy:
  - Policies -> Rules.
  - Wallets -> Fund & Authority.
  - Executions -> Activity.
  - Robinhood Demo -> Robinhood Assets.
- Keep route paths stable to avoid breaking existing links.
- Move secondary pages into "Evidence & Admin".
- Add a top-level 6-step progress rail:
  - Wallet connected.
  - Agent created.
  - Rules active.
  - Funded with USDC.
  - Execution run.
  - Proof available.

## Backend Changes

None.

## Tests

```bash
cd frontend && pnpm build
```

Browser:

- Login.
- Confirm new navigation hierarchy.
- Complete path from dashboard to intent proof in under 6 clicks.

## Acceptance Criteria

- A new user can explain VALEN as "rules + budget + execution proof for autonomous agents."
- Admin pages no longer distract from the primary flow.
- No existing route breaks.

# PHASE C — USDC First Experience

## Goals

- Make USDC the primary product asset.
- Remove confusion between token policy labels and native ETH settlement.
- Prepare for true ERC-20 settlement while improving demo clarity immediately.

## Files

- `frontend/src/lib/known-assets.ts`
- `frontend/src/lib/intent-templates.ts`
- `frontend/src/lib/wallet-balances.ts`
- `frontend/src/components/app/wallet-balances-panel.tsx`
- `frontend/src/app/dashboard/wallets/page.tsx`
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`
- `backend/src/common/utils/execution-asset.util.ts`
- `backend/src/modules/settlement/chain.service.ts`
- `contracts/src/settlement/ValenSettlement.sol`
- `contracts/src/interfaces/IValenSettlement.sol`

## Dependencies

- Phase B.

## Migrations

If implementing true ERC-20 settlement:

- Add columns to `settlements`:
  - `asset_address`
  - `asset_symbol`
  - `asset_decimals`
  - `settlement_mode`
  - `token_transfer_tx_hash`

If staying UI/proof-only for submission:

- No migration.

## APIs

Extend existing DTOs:

- Execution create accepts `assetAddress`, `assetSymbol`, `assetDecimals`, `settlementMode`.
- Settlement response returns asset metadata.

Optional:

- `GET /v1/organizations/:organizationId/wallets/balances`

## Frontend Changes

- Default template: "USDC Agent Payment".
- Show USDC balance before amount entry.
- Explain:
  - "USDC governed by policy" when ERC-20 settlement is not active.
  - "USDC transfer executed" when ERC-20 settlement is active.
- Replace generic token copy with stablecoin budget copy.

## Backend Changes

- Canonicalize USDC address `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` for Arbitrum Sepolia.
- Persist asset metadata in execution and settlement records.
- If implementing ERC-20 settlement, add token transfer path with allowance/balance checks and idempotent retry.

## Contract Changes

If true USDC settlement is in active scope:

- Add ERC-20 transfer execution mode or deploy `ValenTokenSettlementAdapter`.
- Do not break current native settlement.
- Emit asset address and amount in events.

## Tests

```bash
cd frontend && pnpm build
cd backend && pnpm test -- --runInBand
cd contracts && pnpm test
```

Manual:

- Wallets page shows Arbitrum ETH + USDC.
- Intent Builder defaults to USDC.
- Proof page shows asset clearly.

## Acceptance Criteria

- Judges see USDC before any generic token.
- The UI never implies TSLA/USDC was transferred if only ETH was transferred.
- If ERC-20 settlement ships, USDC transfer tx is shown in proof.

# PHASE D — Robinhood Asset Experience

## Goals

- Promote Robinhood from side demo to headline tokenized-asset experience.
- Beat Mandate's simple allow/block demo with proof depth.

## Files

- `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `frontend/src/lib/intent-templates.ts`
- `frontend/src/lib/mandate-match.ts`
- `backend/src/modules/mandates/mandates.service.ts`
- `backend/src/modules/stylus/mandate-chain.service.ts`
- `backend/src/common/constants/onchain.constants.ts`
- `docs/summary.md`

## Dependencies

- Phase B.
- Current Robinhood execution proof.

## Migrations

Optional:

- Add `demo_scenarios` table only if demo state must be persisted.

Preferred:

- No migration; use existing executions and proof records.

## APIs

Optional operator endpoint:

- `POST /v1/operator/demo/robinhood/run`

If not implemented, use existing execution API and template flow.

## Frontend Changes

- Rename page to "Robinhood Assets".
- Add two cards:
  - Safe TSLA-style action.
  - Unsafe/budget-breaching action.
- Show live mandate count for chain `46630`.
- Link latest successful Robinhood proof.
- Clarify TSLA is tokenized-asset policy scope; current settlement sends native test ETH unless token settlement adapter exists.

## Backend Changes

- Keep `custom`/`transfer` mandate matching compatibility.
- Keep idempotent settlement resume for Robinhood.
- Add structured demo metadata:
  - `demoTrack: "robinhood-assets"`
  - `assetNarrative: "TSLA"`
  - `proofRole: "allowed" | "refused"`

## Tests

```bash
cd backend && pnpm test -- --runInBand
cd frontend && pnpm build
```

Production:

- Submit Robinhood 0.001 action.
- Confirm executed.
- Open proof.

## Acceptance Criteria

- Robinhood appears in the pitch and dashboard as a core feature.
- Latest Robinhood proof is one click from Mission Control.
- Judges can compare VALEN directly to Mandate and see more proof depth.

# PHASE E — Agent Identity (ERC-8004)

## Goals

- Make VALEN agents ecosystem-readable.
- Close the AgentAudit/Joy/ACHIVX identity gap.

## Files

- `backend/src/modules/agents/*`
- `backend/src/modules/erc8004/*` (new)
- `backend/src/app.module.ts`
- `backend/supabase/migrations/*_erc8004_agent_identity.sql`
- `frontend/src/app/dashboard/agents/[agentId]/page.tsx`
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`
- `frontend/src/components/app/erc8004-badge.tsx` (new)
- `frontend/src/types/api.ts`

## Dependencies

- Phase B.
- Existing agent and wallet records.

## Migrations

Create `erc8004_agent_bindings`:

- `id`
- `organization_id`
- `agent_id`
- `chain_id`
- `identity_registry_address`
- `agent_registry`
- `erc8004_agent_id`
- `agent_uri`
- `agent_wallet`
- `registration_tx_hash`
- `status`
- `metadata`
- timestamps

## APIs

- `GET /v1/erc8004/agents/:agentId/metadata`
- `POST /v1/organizations/:organizationId/agents/:agentId/erc8004/register`
- `GET /v1/organizations/:organizationId/agents/:agentId/erc8004`

## Frontend Changes

- Add badge on Agent Detail, Execution Detail, Proof, Mission Control.
- Copy: "Agent has an ERC-8004 identity."

## Backend Changes

- Serve agent metadata JSON with services:
  - Proof API
  - MCP endpoint
  - SDK docs
- Bind identity to verified/active agent wallet.

## Tests

```bash
cd backend && pnpm test -- --runInBand erc8004
cd backend && pnpm build
cd frontend && pnpm build
```

## Acceptance Criteria

- Demo agent has an ERC-8004 binding.
- Proof page includes identity fields.
- Agent URI is public and does not expose secrets.

# PHASE F — Policy + Budget Engine

## Goals

- Turn VALEN from permission checks into financial operating controls.
- Add a judge-legible "USDC monthly budget" primitive.

## Files

- `backend/src/modules/budget/*` (new)
- `backend/src/queues/processors/budget.processor.ts` (new if queued)
- `backend/src/modules/policies/*`
- `backend/supabase/migrations/*_agent_budgets.sql`
- `stylus/engines/budget-engine/*` (optional but recommended)
- `frontend/src/app/dashboard/wallets/page.tsx`
- `frontend/src/app/dashboard/agents/[agentId]/page.tsx`
- `frontend/src/components/app/budget-meter.tsx` (new)

## Dependencies

- Phase C.
- Phase E recommended but not required.

## Migrations

Create:

- `agent_budgets`
- `agent_budget_ledger`
- `budget_checks`

Core fields:

- `agent_id`
- `chain_id`
- `asset_address`
- `period`
- `period_cap`
- `per_call_cap`
- `spent_amount`
- `reserved_amount`
- `window_started_at`
- `window_ends_at`
- `policy_hash`
- `status`

## APIs

- `GET /v1/organizations/:organizationId/agents/:agentId/budgets`
- `POST /v1/organizations/:organizationId/agents/:agentId/budgets`
- `GET /v1/organizations/:organizationId/agents/:agentId/budget-ledger`

## Frontend Changes

- Budget meter on Mission Control and Agent Detail.
- USDC cap setup during "Set Rules".
- Show remaining USDC before execution.

## Backend Changes

- Add budget check before policy/settlement.
- Produce deterministic `budgetEvidenceHash`.
- Refuse if per-call or period cap is exceeded.

## Stylus Changes

Optional but high impact:

- Add `BudgetEngine` that computes pass/refuse and evidence hash.
- Add benchmark against Solidity baseline.

## Tests

```bash
cd backend && pnpm test -- --runInBand budget
cd stylus && cargo test
cd frontend && pnpm build
```

## Acceptance Criteria

- Agent has visible USDC budget.
- Budget pass/refuse is recorded.
- Refusal path creates proof/receipt when Phase I is complete.

# PHASE G — Paid Actions (x402)

## Goals

- Make VALEN the permission layer for agent payments.
- Show agentic finance beyond tokenized-stock trades.

## Files

- `backend/src/modules/x402/*` (new)
- `backend/src/modules/payments/*` (new)
- `backend/src/modules/budget/*`
- `backend/supabase/migrations/*_x402_payments.sql`
- `frontend/src/app/dashboard/payments/page.tsx` (new or folded into Activity)
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `packages/sdk/*` after Phase H
- `packages/mcp-server/*` after Phase H

## Dependencies

- Phase C.
- Phase F.
- Phase I for proof output.

## Migrations

Create:

- `payment_resources`
- `payment_proofs`

Fields:

- provider
- resource URL
- method
- category
- network
- asset address
- amount
- x402 requirement hash
- payment payload hash
- tx hash
- response hash
- proof hash

## APIs

- `POST /v1/organizations/:organizationId/payments/request-access`
- `GET /v1/organizations/:organizationId/payment-resources`
- `GET /v1/organizations/:organizationId/payments/proofs/:paymentProofId`
- `GET /v1/proofs/payments/:paymentProofId`

## Frontend Changes

- Add "Paid API Call" USDC template.
- Show approved payment proof and refused payment receipt side by side.
- Do not build a merchant/facilitator product.

## Backend Changes

- Consume x402 as a client.
- Never pay before compliance/risk/budget/policy pass.
- Store response hash, not sensitive response body.

## Tests

```bash
cd backend && pnpm test -- --runInBand x402
cd backend && pnpm test -- --runInBand payments
cd frontend && pnpm build
```

## Acceptance Criteria

- Approved x402 action creates payment proof.
- Refused x402 action spends no USDC.
- Proof Pack shows both outcomes.

# PHASE H — MCP + SDK

## Goals

- Make VALEN callable by agents and developers.
- Close the AgentAudit/Joy/CronStream integration gap.

## Files

- `packages/sdk/*` (new)
- `packages/mcp-server/*` (new)
- `pnpm-workspace.yaml`
- `package.json`
- `backend/src/modules/audit/*`
- `infra/render/render.yaml` if hosting MCP separately
- `frontend/src/app/dashboard/page.tsx`

## Dependencies

- Phase I API shape stabilized.
- Phase E recommended.
- Phase G if `request_paid_action` is included.

## Migrations

No new tables if API keys and audit logs are reused.

## APIs

SDK wraps existing APIs.

MCP tools:

- `create_execution`
- `get_execution_status`
- `get_proof`
- `get_refusal_receipt`
- `list_agent_permissions`
- `get_budget`
- `request_paid_action`
- `verify_proof`

## Frontend Changes

- Add "Agent can call VALEN" card.
- Show MCP command and SDK snippet in Proof Pack.

## Backend Changes

- Add API key scopes if missing.
- Audit MCP tool calls:
  - `mcp.tool.called`
  - `mcp.tool.completed`
  - `mcp.tool.failed`

## Tests

```bash
pnpm --filter @valen/sdk build
pnpm --filter @valen/mcp-server build
pnpm --filter @valen/mcp-server test
```

## Acceptance Criteria

- MCP inspector lists tools.
- SDK can read proof and create execution.
- Bad token is rejected.
- Tool calls write audit events.

# PHASE I — Proof API + Proof Pack

## Goals

- Convert implementation into judge-verifiable proof.
- Create the one link judges can open after the demo.

## Files

- `backend/src/modules/proofs/*` (new or extended)
- `backend/src/modules/settlement/*`
- `backend/src/modules/audit/*`
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`
- `frontend/src/app/proofs/pack/page.tsx` (new)
- `frontend/src/app/proofs/executions/[executionId]/page.tsx` (new public route)
- `scripts/verify-proof-pack.ts` (new)
- `docs/proofs/PROOF_PACK.md` (new if desired; not a replacement for this plan)

## Dependencies

- Phase A.
- Phase C.
- Phase D.
- Phase E/F/G enrich proof but are not blockers.

## Migrations

Create `proof_artifacts`:

- `kind`
- `status`
- `entity_type`
- `entity_id`
- `canonical_hash`
- `chain_id`
- `tx_hash`
- `block_number`
- `explorer_url`
- `api_url`
- `public_url`
- `payload`
- timestamps

## APIs

- `GET /v1/proofs/pack`
- `GET /v1/proofs/executions/:executionId`
- `GET /v1/proofs/payments/:paymentProofId`
- `GET /v1/proofs/refusals/:receiptId`
- `POST /v1/proofs/verify`

## Frontend Changes

- Public Proof Pack page.
- Cards:
  - Arbitrum execution proof.
  - Robinhood execution proof.
  - Contracts.
  - Stylus engines.
  - USDC balance/policy.
  - ERC-8004 identity.
  - x402 paid action, if shipped.
  - Refusal receipt, if shipped.
  - SDK/MCP commands.

## Backend Changes

- Canonical JSON hashing.
- Public proof endpoints without tenant secrets.
- Verifier script consumes public endpoints.

## Tests

```bash
cd backend && pnpm test -- --runInBand proofs
cd frontend && pnpm build
ts-node scripts/verify-proof-pack.ts
```

## Acceptance Criteria

- One public URL proves the build.
- Every displayed proof links to live API data or explorer txs.
- No secrets or tenant-private metadata are exposed.

# PHASE J — Mission Control

## Goals

- Make the app feel like an autonomous finance OS.
- Show the entire system state without forcing route-hopping.

## Files

- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/lib/setup-state.ts`
- `frontend/src/components/app/mission-control-panel.tsx` (new optional)
- `frontend/src/components/app/budget-meter.tsx`
- `frontend/src/components/app/wallet-balances-panel.tsx`

## Dependencies

- Phase B.
- Phase C.
- Phase I.

## Migrations

None.

## APIs

Use existing aggregate hooks and proof endpoints.

Optional:

- `GET /v1/organizations/:organizationId/mission-control`

## Frontend Changes

- Hero status: "Your autonomous finance OS is ready."
- Primary cards:
  - Agent identity.
  - USDC budget.
  - Active rules.
  - Latest execution.
  - Latest proof.
  - Robinhood asset proof.
- Secondary evidence drawer for contracts, governance, treasury.

## Backend Changes

Optional aggregate endpoint only.

## Tests

```bash
cd frontend && pnpm build
```

Browser:

- Mission Control loads under 5 seconds after API warm.
- Latest proof visible without opening table views.

## Acceptance Criteria

- Judges can understand product state from the dashboard alone.
- Primary CTA leads to a proof-producing action.

# PHASE K — Judge Demo Story

## Goals

- Package the live demo into a reliable sequence.
- Avoid confusing or risky paths during judging.

## Files

- `docs/submission/video-script.md` (new)
- `docs/submission/demo-runbook.md` (new)
- `frontend/src/app/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/proofs/pack/page.tsx`
- `docs/summary.md`

## Dependencies

- Phase I.
- Phase J.

## Migrations

None.

## APIs

No new APIs.

## Frontend Changes

- Add demo-safe links:
  - "Run USDC demo."
  - "Open Robinhood proof."
  - "Open Proof Pack."
- Add fallback proof links if live execution is slow.

## Backend Changes

- Optional demo fixture endpoint only if it returns existing real proofs.
- Do not fake outcomes.

## Tests

Manual timed rehearsal:

- 30-second pitch.
- 2-minute demo.
- 5-minute deep-dive path.

## Acceptance Criteria

- Demo can be completed with existing proof links if chains/API are slow.
- No judge sees a failed old execution unless explaining recovery history.

# PHASE L — Submission Package

## Goals

- Turn the build into a winning submission.
- Give judges all proof, copy, and screenshots.

## Files

- `docs/submission/hackquest-copy.md` (new)
- `docs/submission/video-script.md`
- `docs/submission/screenshot-checklist.md` (new)
- `docs/proofs/PROOF_PACK.md`
- `README.md`
- `docs/summary.md`

## Dependencies

- Phase K.

## Migrations

None.

## APIs

No new APIs.

## Frontend Changes

- Ensure landing page headline uses:
  - "The Operating System for Autonomous Finance"
  - "USDC budgets, Robinhood assets, proof for every action."

## Backend Changes

None.

## Tests

- Verify every public link.
- Verify screenshots match live UI.
- Verify proof pack returns 200.

## Acceptance Criteria

- Submission includes one-sentence pitch, 30-second opening, 2-minute demo, proof pack, contract addresses, tx hashes, and roadmap.
- No active submission copy mentions Arbitrum One mainnet as shipped.

## Future Phases

These are valuable but not active buildathon execution.

### Future Phase 1 — Arbitrum One Mainnet Rollout

Move all previous Arbitrum One mainnet deployment tasks here.

Scope:

- Third-party audit or formal review.
- Multisig/timelock role migration.
- Dedicated relayer key separate from user/deployer wallet.
- Source verification.
- Production Redis durability upgrade.
- Mainnet USDC funding and limits.
- One tiny allowed execution and one refusal receipt.

Reason for deferral:

Mainnet is credibility-positive but demo-risky. The current deadline rewards clarity, reliability, and proof over rushed mainnet deployment.

### Future Phase 2 — Full ERC-20 Settlement

Scope:

- ERC-20 settlement adapter.
- USDC transfer mode.
- Token allowance UX.
- Token proof events.
- TSLA/tokenized asset adapter when real token contract addresses are available.

### Future Phase 3 — Advanced Governance

Scope:

- Dashboard queue/execute UI.
- Proposal templates.
- Treasury withdrawal demos.
- Full timelock lifecycle on short-delay test deployment.

### Future Phase 4 — Subgraph / Indexer

Scope:

- Index settlement and receipt events.
- Public proof search.
- Dune/Goldsky dashboard.

## Risk Analysis

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Mainnet deployment breaks demo | High | Keep mainnet future-only |
| USDC transfer not implemented before submission | Medium | Be honest: USDC is policy/budget asset; native settlement is current rail |
| Robinhood chain switching confusion | Medium | Provide latest proof fallback and clearer chain copy |
| x402 consumes too much time | Medium/High | Keep as consumer-only; do not build facilitator |
| MCP/SDK overrun | Medium | Minimal tools/client only |
| Too many dashboard pages confuse judges | High | Reorder nav and Mission Control |
| Old failed executions visible | Low/Medium | Label as pre-fix historical runs; show latest executed proofs first |
| Relayer/user same key nonce races | Medium | Dedicated relayer key in future; nonce retry already exists |
| Proof Pack leaks secrets | High | Public canonical proof only |

## Final Recommendation

Do not chase breadth. Do not ship generic AI. Do not rush Arbitrum One.

The strongest winning version of VALEN is:

> A USDC-first operating system for autonomous finance where agents have identity, rules, budgets, funding, execution, and proof, with Robinhood tokenized assets as the headline secondary demo.

Active execution order:

1. Phase A — Current State Audit.
2. Phase B — UX Simplification.
3. Phase C — USDC First Experience.
4. Phase D — Robinhood Asset Experience.
5. Phase I — Proof API + Proof Pack.
6. Phase J — Mission Control.
7. Phase K — Judge Demo Story.
8. Phase L — Submission Package.
9. Phase E/F/G/H only if the core proof/demo path remains stable.

The judge conclusion we are optimizing for:

> This is the most complete, memorable, commercially viable, and technically impressive autonomous finance project in the buildathon.
