# MASTER EXECUTION PLAN

VALEN's active buildathon plan has one objective: ship the clearest, strongest, most judge-verifiable version of **The Operating System for Autonomous Finance**.

This is not a second roadmap and not a demo-only plan. It replaces the previous strategy inside this same file and treats every non-mainnet capability as active execution scope. The only scope moved out of active execution is **Arbitrum One mainnet rollout**.

The product story:

> Create an agent, give it a USDC budget and rules, fund it, let it act, and see immutable proof for every approval or refusal.

The buildathon thesis:

> Every autonomous dollar needs identity, rules, budget, settlement, refusal, and proof. VALEN is the operating system that coordinates all of it before an agent moves money.

## Executive Summary

### What VALEN Is

VALEN is an operating system for autonomous finance. It lets a user connect a wallet, create an agent, assign rules, fund that agent with a USDC budget, execute governed financial actions, and verify every outcome through immutable proof.

VALEN already has a real production-shaped baseline:

- Vercel frontend connected to Render API.
- Render backend connected to Supabase, Redis, BullMQ, Privy, Arbitrum Sepolia, and Robinhood Testnet.
- Contracts deployed on Arbitrum Sepolia `421614` and Robinhood Testnet `46630`.
- Four Stylus engines deployed and registered on both chains.
- Wallet verification, signed mandates, mandate-bound API keys, policies, intent builder, settlement, audit, proof pages, balances, and dashboard routes exist.
- Arbitrum Sepolia execution `d872b0a7-e7de-4a86-887b-b6ac682c7173` executed and proved.
- Robinhood Testnet execution `7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c` executed and proved.

### Why VALEN Wins

Competitors mostly own one layer: compliance logs, policy wallets, x402 endpoints, tokenized-asset apps, identity registries, receipts, or Stylus benchmarks. VALEN can own the full agent-money lifecycle:

1. Agent identity.
2. Wallet authority.
3. Signed permission mandate.
4. USDC budget.
5. Policy and risk checks.
6. Settlement or refusal.
7. Proof, receipt, and audit.
8. SDK and MCP access for other agents.

The judge memory hook is simple:

> VALEN checks, settles, refuses, and proves autonomous finance actions.

### Why USDC First Matters

USDC is the default product asset because it is stable, judge-legible, commercially believable, and central to agentic payments. It turns a complex compliance product into an intuitive money-control product:

- A user understands a USDC budget instantly.
- x402 examples are USDC-first.
- Payments, balances, budgets, receipts, and proofs are easier to inspect with a stablecoin than with ETH.
- ETH remains the gas and legacy settlement asset only where the current contract path requires it.

Active plan decision: USDC becomes the default asset in UI, budgets, templates, proof, x402, settlement adapters, and submission narrative. Native ETH stays as a legacy fallback until token settlement is complete.

### Why Robinhood Matters

Robinhood Chain is an Arbitrum Orbit/RWA track signal and a memorable tokenized-assets story. VALEN must not present Robinhood as a side demo. It becomes the headline secondary track:

- Safe tokenized-stock action: allowed, settled, proved.
- Unsafe tokenized-stock action: refused, receipted, proved.
- Tokenized asset metadata: TSLA first, then any Robinhood testnet tokens that are actually documented or discoverable from chain/faucet state.
- UI and proof pages make clear what is a token policy asset versus what settlement asset moved.

### Why Proof Matters

Proof is the product. The demo must always end on evidence:

- Success path: proof page with settlement txs.
- Refusal path: refusal receipt with reason, policy hash, budget evidence, and receipt hash.
- Payment path: x402 payment proof with USDC amount and response hash.
- Identity path: ERC-8004 agent identity visible in proof and SDK/MCP metadata.

### Why Mainnet Is Deferred

Arbitrum One mainnet rollout is future-only because rushed mainnet deployment creates security, role, audit, funding, and demo-reliability risk. Mainnet credibility is valuable, but the buildathon active path should maximize clarity and provable completeness on the already deployed testnet stack.

The active plan must not defer:

- USDC-first product.
- Robinhood complete flow.
- UX simplification.
- Frontend/backend integration.
- Contract/token settlement work.
- Budget engine.
- x402.
- ERC-8004.
- MCP + SDK.
- Proof API, proof pack, refusal receipts.

## Baseline State

### Current Frontend State

Current route surface under `frontend/src/app`:

- Landing and auth: `page.tsx`, `login/page.tsx`, `onboarding/page.tsx`.
- Mission Control: `dashboard/page.tsx`.
- Agent setup: `dashboard/agents/page.tsx`, `dashboard/agents/[agentId]/page.tsx`, `dashboard/register-agent/page.tsx`.
- Rules: `dashboard/policies/page.tsx`, `dashboard/policies/new/page.tsx`, `dashboard/policies/[policyId]/page.tsx`.
- Fund and authority: `dashboard/wallets/page.tsx`.
- Execution and proof: `dashboard/executions/page.tsx`, `dashboard/executions/new/page.tsx`, `dashboard/executions/[executionId]/page.tsx`, `dashboard/executions/[executionId]/proof/page.tsx`.
- Robinhood: `dashboard/demo/robinhood-tsla/page.tsx`.
- Evidence/admin: `dashboard/approvals/page.tsx`, `dashboard/settlements/page.tsx`, `dashboard/compliance/page.tsx`, `dashboard/audit/page.tsx`, `dashboard/governance/page.tsx`, `dashboard/treasury/page.tsx`, `dashboard/contracts/page.tsx`, `dashboard/webhooks/page.tsx`, `dashboard/team/page.tsx`, `dashboard/settings/page.tsx`.

Key frontend files already supporting the product:

- `frontend/src/components/app/sidebar.tsx`
- `frontend/src/components/app/pipeline-timeline.tsx`
- `frontend/src/components/app/wallet-balances-panel.tsx`
- `frontend/src/lib/known-assets.ts`
- `frontend/src/lib/intent-templates.ts`
- `frontend/src/lib/wallet-balances.ts`
- `frontend/src/lib/mandate-match.ts`
- `frontend/src/lib/mandate-typed-data.ts`
- `frontend/src/lib/setup-state.ts`
- `frontend/src/hooks/use-valen-api.ts`
- `frontend/src/types/api.ts`

Current gap: the UI is functional but still exposes too many pages equally. The winning product journey must be visually dominant.

### Current Backend State

Current modules in `backend/src/modules`:

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
- `AdminModule`
- `OperatorModule`
- `HealthModule`

Current queue/runtime baseline:

- BullMQ pipeline workers.
- Render API + worker combined under `VALEN_WORKER_MODE=pipeline`.
- Supabase database.
- Redis/Valkey backing queues.
- Operator validation endpoints.
- Idempotent settlement resume.
- Wallet verification and signed mandate APIs.
- Mandate-bound API keys.

Current gap: no `BudgetModule`, no `ProofsModule`, no first-class `RefusalReceiptsModule`, no `x402` consumer module, no `Erc8004Module`, no external SDK or MCP server.

### Current DB State

Current migrations `001` through `017` include:

- Identity, organizations, users, teams.
- Agents and wallets.
- Policies and versions.
- Executions.
- Compliance checks.
- Risk scores.
- Settlements and nonce locks.
- Audit logs.
- Notifications and webhooks.
- Platform ops.
- RLS and indexes.
- Settlement chain proof fields.
- Wallet verifications.
- Signed mandates.
- API key mandate binding.

Important existing tables:

- `organizations`
- `users`
- `organization_members`
- `agents`
- `agent_wallets`
- `wallet_verifications`
- `policies`
- `policy_versions`
- `mandates`
- `api_keys`
- `executions`
- `compliance_checks`
- `risk_scores`
- `settlements`
- `audit_logs`
- `contract_deployments`
- `nonce_locks`

Active DB additions required:

- `asset_registry`
- `agent_budgets`
- `agent_budget_ledger`
- `budget_checks`
- `refusal_receipts`
- `proof_artifacts`
- `payment_resources`
- `payment_proofs`
- `erc8004_agent_bindings`

### Current Contracts State

Existing Solidity contracts:

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

Deployed testnet artifacts:

- Arbitrum Sepolia: `contracts/deployments/arbitrum-sepolia/deployment.json`
- Robinhood Testnet: `contracts/deployments/robinhood-testnet/deployment.json`

Active contract gap:

- `ValenSettlement` currently executes native ETH through `executeSettlement(... payable)`.
- USDC and TSLA are currently mandate/policy assets, not token-transfer settlement assets.
- Active plan must add a token settlement path without breaking the proven native ETH path.

Required active contract additions:

- `ValenTokenSettlementAdapter` for ERC-20 transfer settlement.
- `ValenBudgetVault` for USDC budget custody/reservation/accounting.
- `RefusalReceiptRegistry` for refusal receipt anchoring.
- Optional upgrade/extension to `ValenAuditLog` for receipt/payment proof event hashes if separate registry is too heavy.

### Current Stylus State

Existing Stylus engines:

- `ComplianceEngine`
- `RiskEngine`
- `EligibilityEngine`
- `PolicyEngine`

Deployment artifacts:

- `stylus/deployments/arbitrum-sepolia/engines.json`
- `stylus/deployments/robinhood-testnet/engines.json`

Active Stylus gap:

- No `BudgetEngine`.
- No benchmark package that gives judges a single Stylus performance number.

Required active Stylus additions:

- `stylus/engines/budget-engine/*`
- Benchmark scripts comparing budget/risk/policy/compliance checks against Solidity or TypeScript baselines.

### Current Deployment State

Render:

- `infra/render/render.yaml`
- `valen-redis` Key Value.
- `valen-api` web service with API + worker.
- `valen-scheduler` cron service.
- Env group `valen-production`.

Vercel:

- Root `vercel.json`.
- `frontend/vercel.json`.
- `frontend/next.config.ts` enforces Render API URL and bundles deployment manifests.

Current live endpoints:

- API: `https://valen-api-m3g4.onrender.com`
- Frontend: `https://valenai.vercel.app`

## Competitive Analysis

### Full Ranking Summary

The census contains several independent ranking passes. The strongest synthesis is:

- **AgentAudit AI**: strongest standards/evidence package; mainnet breadth, ERC-8004, MCP, SDK, compliance narrative.
- **CronStream**: clean milestone payment workflow; x402; strong tests; very legible B2B use case.
- **Mandate**: most memorable Robinhood allow/block flow.
- **Osmium**: clean Robinhood SpendOps/policy story.
- **OBSCURA**: broad technical artifact density with FHE, SDK, MCP.
- **Monaris / MiTanda / GrantOS / Palpitada**: mainnet and real-usage credibility.
- **Collateral Passport / EquiFlow / Vela / RobinUSD / ATLAS / KLIPP**: Robinhood and tokenized asset competitors.
- **VetoVault / Aegis / FortiLayer**: strong Stylus/security/benchmark narratives.
- **RefusalRail / RAMA**: receipt/proof primitives.
- **Joy / Tollkit / ClawLens / ACHIVX / Giggy / Silent Swap / Fangorn**: x402, ERC-8004, MCP, or agent-payment patterns.

VALEN should not copy one competitor. It should combine the best evidence patterns into one simpler product story.

### Key Competitor Clusters

- **Agent safety and permissioning**: AgentAudit, Mandate, Osmium, FortiLayer, VetoVault, RefusalRail, Nyxora, bvcc-wallet-agent.
- **Robinhood tokenized assets**: Mandate, Osmium, Collateral Passport, EquiFlow, Vela, RobinUSD, ATLAS, CorpAction Engine, KLIPP.
- **x402 / agentic payments**: CronStream, Joy, Tollkit, ClawLens, ACHIVX, Giggy, Silent Swap, Fangorn.
- **ERC-8004 / agent identity**: AgentAudit, ACHIVX, Joy, arbi-safe, Fangorn.
- **Stylus benchmark/security**: VetoVault, Aegis, FortiLayer, YieldGeko, VaultPay.
- **Consumer UX/mainnet**: MiTanda, Palpitada, Bundie.
- **Overbroad/copilot risk**: OBSCURA scope risk, Kabon advisory risk, generic AI wrappers.

### What Competitors Do Better

- AgentAudit: standards packaging and multi-mainnet credibility.
- CronStream: one clean event-to-payment flow and strong tests.
- Mandate: simple allowed/refused Robinhood story.
- Osmium: concise SpendOps category claim.
- OBSCURA: artifact density and SDK/MCP visibility.
- Monaris/MiTanda/Palpitada: mainnet and user/value credibility.
- Collateral Passport: Robinhood evidence discipline, SDK, tests, subgraph.
- VetoVault/Aegis: single Stylus benchmark number.
- Joy/Tollkit/ClawLens/ACHIVX: x402 and agent-payment fluency.

### What VALEN Does Better

- VALEN already spans frontend, backend, DB, queues, contracts, Stylus engines, settlement, audit, governance, treasury, wallet verification, mandates, and proof.
- VALEN can show both approved settlement and refused action receipts in one lifecycle.
- VALEN can connect USDC agent payments and Robinhood tokenized assets under one operating-system story.
- VALEN can be agent-native with SDK and MCP while also being judge-friendly through Mission Control and Proof Pack.

### How VALEN Wins

VALEN wins by presenting the larger control plane:

> Competitors build wallets, policy engines, x402 endpoints, identity registries, tokenized asset apps, or receipts. VALEN is the operating system that coordinates identity, USDC budgets, permissions, execution, settlement, refusal, and proof before an autonomous agent moves money.

The winning demo must not be a dashboard tour. It must be one governed action and one refused action, both ending in proof.

## Product Repositioning

### Product Name and Category

VALEN remains VALEN, but the category becomes:

> The Operating System for Autonomous Finance

The product should not be called a compliance dashboard, AI copilot, wallet, or settlement script. Those are components. The product is the control plane that makes autonomous finance governable.

### Sharpened Story

New user version:

> VALEN lets you create an agent, give it a USDC budget and rules, then proves every action it takes or refuses.

Judge version:

> VALEN combines Privy wallet authority, signed mandates, USDC budgets, Stylus checks, settlement, refusal receipts, x402 payments, ERC-8004 identity, SDK/MCP access, and proof pages into one autonomous finance OS.

Developer version:

> Agents call VALEN through SDK or MCP to request financial actions. VALEN checks identity, mandate, budget, policy, compliance, and risk, then returns an execution proof, payment proof, or refusal receipt.

### Product Principles

- USDC first.
- Robinhood headline.
- Proof first.
- One journey.
- No generic copilot.
- Keep admin evidence, demote admin navigation.
- Do not rebuild proven modules; extend them.

## UX Simplification Plan

### Primary Navigation

Primary nav must match the winning flow:

1. Mission Control
2. Create Agent
3. Rules
4. Fund & Authority
5. Execute
6. Proofs
7. Robinhood Assets

Route mapping:

- Mission Control: `frontend/src/app/dashboard/page.tsx`
- Create Agent: `frontend/src/app/dashboard/register-agent/page.tsx`, `frontend/src/app/dashboard/agents/*`
- Rules: `frontend/src/app/dashboard/policies/*`
- Fund & Authority: `frontend/src/app/dashboard/wallets/page.tsx`
- Execute: `frontend/src/app/dashboard/executions/new/page.tsx`, `frontend/src/app/dashboard/executions/page.tsx`
- Proofs: existing execution proof route plus new public proof pack routes.
- Robinhood Assets: `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`

### Secondary/Admin Navigation

Move these under one collapsed section: **Evidence & Admin**.

- Approvals
- Settlements
- Compliance
- Audit Logs
- Governance
- Treasury
- Contracts
- Webhooks
- Team
- Settings

Do not delete these pages. They are proof depth. They should not compete with the primary journey.

### New User Journey

The onboarding path must be:

1. Connect Wallet.
2. Create Agent.
3. Set Rules.
4. Fund Agent with USDC.
5. Execute.
6. See Proof.

Mission Control must show a single progress rail:

- Wallet connected.
- Agent active.
- Rules active.
- Wallet verified.
- Mandate signed.
- USDC budget funded.
- First execution complete.
- Proof available.

### Mission Control Structure

Mission Control should show:

- One-sentence product header.
- Readiness rail.
- USDC budget card.
- Agent identity card.
- Active rules card.
- Fund & Authority card.
- Latest execution card.
- Latest proof card.
- Robinhood proof card.
- Proof Pack CTA.

### What To Hide or Demote

Hide from primary demo path:

- Governance execution controls.
- Treasury internals.
- Webhook setup.
- Team management.
- Contracts page details.
- Audit log table-first views.
- Old failed executions unless explicitly labeled as historical pre-fix runs.

Keep available for judge deep-dive:

- Contract addresses.
- Stylus engine addresses.
- Audit rows.
- Settlement rows.
- Governance/timelock status.
- Treasury reads.
- Webhook delivery proof.

## USDC-First Plan

### USDC Asset Registry

Active work:

- Replace static-only asset definitions with an API-backed registry.
- Store assets in `asset_registry`.
- Use USDC as default for Arbitrum Sepolia.
- Preserve native ETH as gas/legacy settlement.
- Track asset metadata consistently in executions, settlements, budgets, payments, and proofs.

Canonical Arbitrum Sepolia USDC:

- `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`
- Decimals: `6`
- Usage: default budget asset, default action asset, default proof asset, x402 narrative asset.

Files:

- `frontend/src/lib/known-assets.ts`
- `frontend/src/lib/intent-templates.ts`
- `frontend/src/lib/wallet-balances.ts`
- `backend/src/common/utils/execution-asset.util.ts`
- `backend/src/modules/assets/*` (new)
- `backend/supabase/migrations/*_asset_registry.sql` (new)

APIs:

- `GET /v1/assets`
- `GET /v1/assets?chainId=421614`
- `GET /v1/organizations/:organizationId/assets/balances`

Acceptance criteria:

- USDC is first in asset pickers.
- USDC address and decimals are never hardcoded in multiple frontend screens.
- Proof pages show asset symbol, address, decimals, raw amount, and formatted amount.

### USDC Balance Display

Current frontend reads Arbitrum Sepolia USDC balance from chain RPC. Active work makes this product-grade:

- Show connected wallet USDC.
- Show agent budget vault USDC.
- Show spendable/reserved/remaining USDC.
- Show x402 spend history.
- Show "needs testnet USDC" CTA linking to Circle faucet.

Files:

- `frontend/src/components/app/wallet-balances-panel.tsx`
- `frontend/src/app/dashboard/wallets/page.tsx`
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `backend/src/modules/balances/*` (new or under assets)

Tests:

```bash
pnpm --filter frontend build
pnpm --filter backend build
```

Manual:

- Connect wallet.
- Confirm ETH and USDC render for Arbitrum Sepolia.
- Confirm Robinhood ETH and tokenized asset metadata render separately.

### USDC Budgeting

USDC budget is active P0 scope.

Data model:

- `agent_budgets`
- `agent_budget_ledger`
- `budget_checks`

Core fields:

- `organization_id`
- `agent_id`
- `chain_id`
- `asset_address`
- `asset_symbol`
- `asset_decimals`
- `period`
- `period_cap`
- `per_call_cap`
- `spent_amount`
- `reserved_amount`
- `available_amount`
- `window_started_at`
- `window_ends_at`
- `policy_hash`
- `status`

Files:

- `backend/src/modules/budget/*` (new)
- `backend/supabase/migrations/*_agent_budgets.sql` (new)
- `frontend/src/components/app/budget-meter.tsx` (new)
- `frontend/src/app/dashboard/wallets/page.tsx`
- `frontend/src/app/dashboard/agents/[agentId]/page.tsx`
- `frontend/src/app/dashboard/executions/new/page.tsx`

APIs:

- `GET /v1/organizations/:organizationId/agents/:agentId/budgets`
- `POST /v1/organizations/:organizationId/agents/:agentId/budgets`
- `POST /v1/organizations/:organizationId/agents/:agentId/budgets/:budgetId/fund`
- `GET /v1/organizations/:organizationId/agents/:agentId/budget-ledger`
- `POST /v1/budget/check`

Acceptance criteria:

- An agent can have a visible USDC budget before execution.
- Intent builder shows remaining budget before submit.
- Budget pass/refuse is recorded.
- Budget refusal creates a refusal receipt.

### USDC Action Templates

Default templates:

- `USDC Agent Payment`
- `USDC Paid API Call`
- `USDC Budget Breach Refusal`
- `Robinhood TSLA Allowed`
- `Robinhood TSLA Refused`

Files:

- `frontend/src/lib/intent-templates.ts`
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `frontend/src/lib/policy-templates.ts`

Acceptance criteria:

- New user sees USDC action before ETH.
- Native ETH template is labeled "Legacy native settlement".
- Robinhood template clearly states tokenized asset action and settlement behavior.

### USDC Proof Generation

Every proof must include:

- `assetSymbol`
- `assetAddress`
- `assetDecimals`
- `budgetId`
- `budgetEvidenceHash`
- `spentBefore`
- `reservedAmount`
- `remainingAfter`
- Settlement mode: `erc20_transfer`, `x402_payment`, or `native_legacy`.

Files:

- `backend/src/modules/proofs/*` (new)
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`
- `frontend/src/app/proofs/pack/page.tsx` (new)
- `scripts/verify-proof-pack.ts` (new)

### USDC Settlement Strategy

Active implementation path:

1. Keep `ValenSettlement` native ETH path for existing proofs and fallback.
2. Add `ValenTokenSettlementAdapter` for ERC-20 transfers.
3. Add `ValenBudgetVault` for USDC custody/reservation and transfer execution.
4. Extend backend settlement to select `settlementMode`:
   - `native_legacy`
   - `erc20_transfer`
   - `x402_payment`
   - `refusal_only`
5. Persist token settlement tx hash and asset metadata.
6. Proof page shows exactly what moved.

Contract files:

- `contracts/src/settlement/ValenTokenSettlementAdapter.sol` (new)
- `contracts/src/treasury/ValenBudgetVault.sol` (new)
- `contracts/src/interfaces/IValenTokenSettlementAdapter.sol` (new)
- `contracts/src/interfaces/IValenBudgetVault.sol` (new)
- `contracts/test/ValenTokenSettlementAdapter.test.ts` (new)
- `contracts/test/ValenBudgetVault.test.ts` (new)

Backend files:

- `backend/src/modules/settlement/chain.service.ts`
- `backend/src/modules/settlement/settlement.service.ts`
- `backend/src/modules/budget/*`
- `backend/supabase/migrations/*_token_settlement.sql`

Tests:

```bash
pnpm --filter @valen/contracts test
pnpm --filter backend test -- --runInBand
pnpm --filter backend build
pnpm --filter frontend build
```

Acceptance criteria:

- USDC transfer settlement works on Arbitrum Sepolia for a small amount.
- Native ETH settlement remains backward compatible.
- Proof page does not claim a token moved unless a token transfer tx exists.

## Robinhood Token Plan

### Supported Robinhood Assets

Current proven support:

- Chain: Robinhood Testnet `46630`
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`
- Native gas asset: ETH
- Current VALEN tokenized demo label: `TSLA`
- Current known Robinhood stablecoin faucet asset from docs: `USDG`

Active registry strategy:

- Treat `TSLA` as the first-class tokenized-stock metadata object, even if no ERC-20 contract address is proven.
- Add `USDG` as a stablecoin metadata object only when faucet/chain contract address is confirmed.
- Add `AMZN`, `PLTR`, `NFLX`, `AMD` only as "planned metadata" until contract addresses or faucet support are verified.
- Every asset must carry `supportLevel`:
  - `settlement_ready`
  - `policy_ready`
  - `metadata_only`
  - `unverified`

Do not pretend unverified token contracts are live.

### Token Metadata Strategy

Data model: extend `asset_registry`.

Fields:

- `chain_id`
- `symbol`
- `name`
- `asset_type`
- `contract_address`
- `decimals`
- `support_level`
- `source`
- `source_url`
- `verified_at`
- `settlement_modes`
- `metadata`

Files:

- `backend/src/modules/assets/*`
- `frontend/src/lib/known-assets.ts`
- `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`
- `frontend/src/app/dashboard/executions/new/page.tsx`

Acceptance criteria:

- Robinhood page shows TSLA as a tokenized asset track, not a generic custom action.
- UI distinguishes policy metadata from token transfer settlement.
- All unverified assets are labeled honestly.

### Safe Demo Path

Safe path:

1. Agent: `Robinhood Token Agent`.
2. Chain: `46630`.
3. Asset: `TSLA`.
4. Amount: safe demo amount.
5. Checks pass.
6. Settlement executes through current native legacy path or token adapter if available.
7. Proof page labels the exact settlement mode.

Files:

- `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`
- `frontend/src/lib/intent-templates.ts`
- `frontend/src/lib/mandate-match.ts`
- `backend/src/modules/mandates/mandates.service.ts`
- `backend/src/modules/stylus/mandate-chain.service.ts`
- `backend/src/common/constants/onchain.constants.ts`

Acceptance criteria:

- Latest executed Robinhood proof is visible from Mission Control.
- Robinhood allowed action can be run from Intent Builder.
- Proof page links to Robinhood explorer txs.

### Unsafe / Refused Path

Refused path:

1. Same agent attempts a TSLA action over budget, over per-call cap, or outside allowed asset/target.
2. Compliance/risk/budget/policy produces a refusal.
3. No settlement executes.
4. Refusal receipt is created.
5. Receipt is anchored and visible on proof page.

Files:

- `backend/src/modules/refusal-receipts/*` (new)
- `contracts/src/audit/RefusalReceiptRegistry.sol` (new)
- `frontend/src/app/proofs/refusals/[receiptId]/page.tsx` (new)
- `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx`

Acceptance criteria:

- Robinhood demo page shows allowed and refused cards.
- Refused action returns a receipt URL, not a generic failed execution.
- Receipt proves no settlement tx was sent.

### Proof Page Strategy

Robinhood proof page must show:

- Chain ID `46630`.
- Asset symbol `TSLA`.
- Asset support level.
- Agent identity.
- Mandate ID.
- Policy hash.
- Budget evidence if applicable.
- Settlement tx for allowed action.
- Refusal receipt for refused action.
- Explorer links.

## Identity / Permission / Mandate Plan

### Wallet Verification

Already exists and stays:

- `backend/src/modules/organizations/wallet-verifications.*`
- `backend/supabase/migrations/20260101000015_wallet_verifications.sql`
- `frontend/src/app/dashboard/wallets/page.tsx`

Active improvements:

- Show wallet verification in Mission Control.
- Bind wallet verification to budget funding authority.
- Proof pages show verified signer, chain, and verification time.

### Signed Mandates

Already exists and stays:

- `backend/src/modules/mandates/*`
- `backend/supabase/migrations/20260101000016_signed_mandates.sql`
- `frontend/src/lib/mandate-typed-data.ts`
- `frontend/src/lib/mandate-match.ts`
- `frontend/src/app/dashboard/wallets/page.tsx`

Active improvements:

- Mandate must include USDC budget binding.
- Mandate must include asset support level.
- Mandate must distinguish `transfer`, `paid_resource_access`, and `tokenized_asset_action`.
- Mandate proof must appear on every proof page.

### Agent Identity

Active work:

- Add ERC-8004 binding.
- Add agent-card metadata endpoint.
- Show identity badge across Mission Control, Agent Detail, Execution Detail, Proof, SDK, and MCP.

Files:

- `backend/src/modules/erc8004/*` (new)
- `backend/supabase/migrations/*_erc8004_agent_identity.sql` (new)
- `frontend/src/components/app/erc8004-badge.tsx` (new)
- `frontend/src/app/dashboard/agents/[agentId]/page.tsx`
- `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx`

### Policy Binding

Current policy templates exist. Active work:

- Policies become "Rules" in user-facing copy.
- Policy template must default to USDC budget controls.
- Robinhood policy template must include safe/refused TSLA paths.
- Policy hash must appear in proof and receipt.

Files:

- `frontend/src/lib/policy-templates.ts`
- `backend/src/modules/policies/*`
- `backend/src/modules/settlement/*`

### Budget Binding

Active work:

- Mandates reference budget ID or budget policy hash.
- Executions reference budget check ID.
- Proofs reference budget evidence hash.
- SDK/MCP returns budget state.

## Execution / Settlement / Proof Plan

### Intent Builder

The intent builder must become the primary execution surface.

Files:

- `frontend/src/app/dashboard/executions/new/page.tsx`
- `frontend/src/lib/intent-templates.ts`
- `frontend/src/lib/known-assets.ts`
- `frontend/src/lib/mandate-match.ts`
- `frontend/src/hooks/use-valen-api.ts`

Active changes:

- Default to `USDC Agent Payment`.
- Show budget before amount.
- Show mandate match.
- Show settlement mode.
- Show proof outcome before submission: execution proof or refusal receipt.

### Approval Flow

Current approval signatures exist. Active work:

- Approval pages must lead to proof after approve/reject.
- Rejection becomes refusal receipt.
- Wallet-signed approval proof is included in Proof Pack.

Files:

- `frontend/src/app/dashboard/approvals/page.tsx`
- `frontend/src/lib/approval-signature.ts`
- `backend/src/modules/settlement/*`

### Settlement Flow

Active modes:

- Native legacy settlement: already proven.
- USDC ERC-20 settlement: active build.
- x402 payment settlement: active build.
- Refusal-only path: active build.

Backend dispatch:

- `settlementMode = native_legacy` uses current `ValenSettlement`.
- `settlementMode = erc20_transfer` uses `ValenTokenSettlementAdapter` / `ValenBudgetVault`.
- `settlementMode = x402_payment` uses x402 module and payment proof.
- `settlementMode = refusal_only` creates receipt and stops.

### Refusal Receipt Flow

Receipt fields:

- `receipt_id`
- `execution_id`
- `organization_id`
- `agent_id`
- `erc8004_agent_id`
- `chain_id`
- `action_type`
- `target_address`
- `asset_address`
- `asset_symbol`
- `amount`
- `budget_id`
- `policy_id`
- `policy_version_id`
- `policy_hash`
- `risk_score_id`
- `risk_tier`
- `compliance_check_id`
- `reason_code`
- `reason_label`
- `engine`
- `engine_version`
- `payload_hash`
- `calldata_hash`
- `receipt_hash`
- `anchor_tx_hash`
- `created_at`

APIs:

- `GET /v1/refusal-receipts/:receiptId`
- `GET /v1/organizations/:organizationId/executions/:executionId/refusal-receipt`
- `GET /v1/proofs/refusals/:receiptId`
- `POST /v1/proofs/refusals/:receiptId/verify`

### Proof Flow

Proof pages must be public-safe and tenant-safe.

APIs:

- `GET /v1/proofs/pack`
- `GET /v1/proofs/executions/:executionId`
- `GET /v1/proofs/refusals/:receiptId`
- `GET /v1/proofs/payments/:paymentProofId`
- `POST /v1/proofs/verify`

Frontend:

- `frontend/src/app/proofs/pack/page.tsx` (new)
- `frontend/src/app/proofs/executions/[executionId]/page.tsx` (new)
- `frontend/src/app/proofs/refusals/[receiptId]/page.tsx` (new)
- `frontend/src/app/proofs/payments/[paymentProofId]/page.tsx` (new)

### Proof Pack Flow

Proof Pack must include:

- Latest Arbitrum execution proof.
- Latest Robinhood execution proof.
- USDC budget proof.
- Refusal receipt proof.
- x402 payment proof.
- ERC-8004 identity.
- Contracts.
- Stylus engines.
- SDK snippet.
- MCP command.
- Verifier script output.

## x402 Plan

### x402 Consumer Role

VALEN is not an x402 facilitator or merchant for buildathon active scope. VALEN is a governed x402 consumer:

1. Agent requests a paid resource.
2. Resource returns HTTP `402 Payment Required`.
3. VALEN checks compliance, risk, budget, and policy.
4. If allowed, VALEN signs/settles the USDC payment path.
5. VALEN retries request with payment header.
6. VALEN stores response hash and payment proof.
7. If refused, no payment is made and a refusal receipt is created.

This avoids facilitator scope creep while proving agentic payment control.

### Paid Action Flow

New action type:

- `paid_resource_access`

DB enum migration required:

- Extend `action_type` enum with `paid_resource_access`.

Files:

- `backend/src/modules/x402/*` (new)
- `backend/src/modules/payments/*` (new)
- `backend/src/modules/budget/*`
- `backend/supabase/migrations/*_x402_payments.sql`
- `frontend/src/app/dashboard/executions/new/page.tsx`
- `frontend/src/app/dashboard/payments/page.tsx` (new or folded into Activity)

APIs:

- `POST /v1/organizations/:organizationId/payments/request-access`
- `GET /v1/organizations/:organizationId/payment-resources`
- `GET /v1/organizations/:organizationId/payments/proofs/:paymentProofId`
- `GET /v1/proofs/payments/:paymentProofId`

### Payment Proof Flow

Payment proof fields:

- `payment_proof_id`
- `execution_id`
- `agent_id`
- `resource_url`
- `provider`
- `method`
- `network`
- `asset_address`
- `asset_symbol`
- `asset_decimals`
- `amount`
- `x402_requirement_hash`
- `payment_header_hash`
- `payment_tx_hash`
- `response_hash`
- `budget_check_id`
- `policy_hash`
- `proof_hash`

Acceptance criteria:

- Approved paid action creates a payment proof.
- Refused paid action spends no USDC.
- Proof Pack shows approved and refused paid actions side by side.

### How x402 Works With Testnet

Evidence from current x402 docs:

- x402 uses HTTP `402 Payment Required`.
- Clients sign payment authorization, commonly USDC.
- EIP-3009 USDC is the smoothest path where supported.
- Public testnet facilitator support is strongest on Base Sepolia, with CDP facilitator supporting production/testnet networks.
- Arbitrum USDC support exists for production via CDP, while Arbitrum Sepolia x402 support must be verified before claiming live facilitator settlement.

Active buildathon plan:

- Implement protocol-compatible x402 consumer abstraction.
- Use real 402 negotiation and signed payment headers where facilitator/network support is available.
- If Arbitrum Sepolia facilitator support is not available, run x402 test against supported testnet and anchor the VALEN permission/proof on Arbitrum Sepolia.
- Keep USDC as the user-visible budget/payment asset.
- Be explicit in proof whether the payment tx is on x402-supported network or VALEN Arbitrum proof anchor.

### How x402 Works With USDC Budgets

Budget check precedes payment:

1. `budget.available >= price`
2. `price <= per_call_cap`
3. `spent + price <= period_cap`
4. Provider/category allowed by policy.
5. x402 payment proceeds.
6. Budget ledger records reserved/spent.
7. Payment proof includes budget evidence hash.

## ERC-8004 Plan

### Agent Identity Binding

ERC-8004 defines agent identity through an on-chain identity registry and metadata URI. Active VALEN integration:

- Register the demo agent or bind to an existing ERC-8004 agent ID.
- Store `agentRegistry`, `erc8004AgentId`, `agentUri`, `agentWallet`, and registration tx.
- Use agent metadata JSON with VALEN proof, MCP, SDK, and service endpoints.

Files:

- `backend/src/modules/erc8004/*` (new)
- `backend/supabase/migrations/*_erc8004_agent_identity.sql`
- `frontend/src/components/app/erc8004-badge.tsx`
- `frontend/src/types/api.ts`

APIs:

- `GET /v1/erc8004/agents/:agentId/metadata`
- `POST /v1/organizations/:organizationId/agents/:agentId/erc8004/register`
- `GET /v1/organizations/:organizationId/agents/:agentId/erc8004`

### Metadata Strategy

Agent metadata must include:

- name
- description
- image/logo
- wallet address
- VALEN organization/agent refs that are safe to expose
- services:
  - Proof API
  - MCP server
  - SDK docs
- supportedTrust:
  - identity
  - proof
  - refusal-receipts
  - payment-proofs

Do not expose tenant secrets, API keys, private endpoints, or full user metadata.

### Proof Integration

Every proof and receipt should include:

- VALEN agent ID.
- ERC-8004 agent ID if registered.
- Agent URI.
- Agent wallet.
- Registration tx or registry reference.

### SDK / MCP Visibility

SDK:

- `client.agents.getIdentity(agentId)`
- `client.proofs.getExecutionProof(executionId)` includes `erc8004`.

MCP:

- `list_agent_permissions` returns identity.
- `get_proof` returns identity fields.

## MCP + SDK Plan

### Minimal Tool Set

MCP tools:

- `create_execution`
- `get_execution_status`
- `get_proof`
- `get_refusal_receipt`
- `list_agent_permissions`
- `get_budget`
- `request_paid_action`
- `get_payment_proof`
- `verify_proof`

Resources:

- `valen://agents/{agentId}/permissions`
- `valen://proofs/pack`
- `valen://executions/{executionId}/proof`

Prompts:

- `submit-safe-usdc-action`
- `submit-refused-robinhood-action`
- `request-paid-usdc-action`

### Typed SDK Surface

Package: `@valen/sdk`

Files:

- `packages/sdk/package.json`
- `packages/sdk/src/client.ts`
- `packages/sdk/src/types.ts`
- `packages/sdk/src/proofs.ts`
- `packages/sdk/src/payments.ts`
- `packages/sdk/examples/submit-usdc-action.ts`
- `packages/sdk/examples/robinhood-allowed-refused.ts`
- `packages/sdk/examples/request-paid-action.ts`

Minimum API:

```ts
const valen = new ValenClient({ apiKey, baseUrl });

await valen.agents.list();
await valen.budgets.get(agentId);
await valen.executions.create({ agentId, actionType, chainId, asset, amount, target });
await valen.executions.get(executionId);
await valen.proofs.getExecution(executionId);
await valen.receipts.get(receiptId);
await valen.payments.requestAccess({ agentId, resourceUrl, maxPrice, asset });
```

### How Agents Call VALEN

Agents should call VALEN through:

- API key bound to mandate.
- SDK for app/dev integration.
- MCP for model/tool integration.

No agent gets raw signing authority without:

- Verified wallet.
- Active mandate.
- Budget.
- Policy.
- Audit trail.

### How Judges Can Inspect It

Judges should be able to run:

```bash
pnpm --filter @valen/sdk build
pnpm --filter @valen/mcp-server build
pnpm --filter @valen/mcp-server inspect
ts-node scripts/verify-proof-pack.ts
```

Proof Pack shows:

- SDK snippet.
- MCP tool list.
- Example calls.
- Live proof URLs.

## Contract / Backend / Frontend Plan

### Existing Pieces That Stay

Frontend:

- Current dashboard route tree.
- Privy auth.
- Wallet verification.
- Signed mandate UI.
- Agent/policy/intent/proof pages.
- Live balance panel.
- Robinhood demo page.

Backend:

- Auth/org/agent/policy/mandate/compliance/risk/settlement/stylus/audit/operator modules.
- BullMQ pipeline.
- Render health/operator validation.
- Existing settlement native ETH path.
- Existing proof page data.

Contracts:

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

Stylus:

- Compliance/Risk/Eligibility/Policy engines.

### Existing Pieces That Change

Frontend:

- Navigation hierarchy.
- USDC default templates.
- Proof pages.
- Mission Control cards.
- Robinhood page.
- Wallets page.

Backend:

- Execution DTOs include asset/budget/settlement mode.
- Settlement service routes by settlement mode.
- Policy/risk pipeline creates refusal receipts.
- Proof API becomes public-safe.
- Audit logs include refusal/payment/proof events.

Contracts:

- Add token settlement and budget contracts.
- Add refusal registry.
- Optional update deployment scripts to deploy/register new contracts on testnets.

Stylus:

- Add `BudgetEngine`.
- Add benchmark scripts and outputs.

### New Modules / Contracts / APIs Required

Backend modules:

- `AssetsModule`
- `BudgetModule`
- `RefusalReceiptsModule`
- `ProofsModule`
- `PaymentsModule`
- `X402Module`
- `Erc8004Module`

Contracts:

- `ValenTokenSettlementAdapter`
- `ValenBudgetVault`
- `RefusalReceiptRegistry`

Packages:

- `packages/sdk`
- `packages/mcp-server`

New frontend:

- `frontend/src/app/proofs/pack/page.tsx`
- `frontend/src/app/proofs/executions/[executionId]/page.tsx`
- `frontend/src/app/proofs/refusals/[receiptId]/page.tsx`
- `frontend/src/app/proofs/payments/[paymentProofId]/page.tsx`
- `frontend/src/components/app/budget-meter.tsx`
- `frontend/src/components/app/erc8004-badge.tsx`

### How Everything Connects Cleanly

Core flow:

1. User connects wallet through Privy.
2. User creates agent.
3. User creates rules.
4. User verifies wallet.
5. User signs mandate.
6. User funds USDC budget.
7. Agent or user submits intent.
8. Backend checks mandate, compliance, risk, budget, policy.
9. If approved:
   - native legacy settlement, ERC-20 settlement, or x402 payment executes.
   - proof artifact is created.
10. If refused:
   - no settlement executes.
   - refusal receipt is created and anchored.
11. Proof Pack aggregates the result.

## Required Research Index

Every phase below references this index. Engineers MUST read the linked materials before writing a single line of code for that phase. The index is canonical: do not invent alternate sources, do not cite older versions, do not skip the security or audited reference repos.

### Core Chains

- Arbitrum docs: https://docs.arbitrum.io
- Arbitrum Solidity quickstart: https://docs.arbitrum.io/build-decentralized-apps/quickstart-solidity-hardhat
- Arbitrum Stylus overview: https://docs.arbitrum.io/stylus
- Arbitrum Stylus quickstart: https://docs.arbitrum.io/stylus/quickstart
- Stylus by Example: https://stylus-by-example.org
- Robinhood Chain docs: https://docs.robinhood.com/chain/
- Robinhood Chain connecting: https://docs.robinhood.com/chain/connecting/
- Robinhood Chain ToS (testnet asset list): https://docs.robinhood.com/chain/terms-of-service/
- Robinhood Chain testnet faucet: https://faucet.testnet.chain.robinhood.com
- Robinhood block explorer: https://explorer.testnet.chain.robinhood.com
- Robinhood Chain Arbitrum announcement: https://blog.arbitrum.io/robinhood-chain-testnet/

### Smart Contract & Stylus Repositories

- arbitrum-sdk: https://github.com/OffchainLabs/arbitrum-sdk
- cargo-stylus: https://github.com/OffchainLabs/cargo-stylus
- stylus-sdk-rs: https://github.com/OffchainLabs/stylus-sdk-rs
- OpenZeppelin Solidity contracts: https://github.com/OpenZeppelin/openzeppelin-contracts
- OpenZeppelin Rust/Stylus contracts: https://github.com/OpenZeppelin/rust-contracts-stylus

### USDC, Payments, Receipts

- Circle USDC contracts on EVM: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
- Circle EIP-3009 transfer-with-authorization reference: https://eips.ethereum.org/EIPS/eip-3009
- Circle faucet: https://faucet.circle.com
- USDC on Arbitrum Sepolia: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d (decimals: 6)
- USDC on Arbitrum One: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 (decimals: 6, future-only)
- x402 protocol: https://docs.x402.org and https://x402.org
- x402 GitHub (Coinbase reference): https://github.com/coinbase/x402
- x402 Arbitrum facilitator reference: https://github.com/hummusonrails/x402-facilitator
- x402 multi-chain facilitator (Arbitrum/Base/ETH): https://github.com/Sperax/x402-facilitator

### Account Abstraction & Session Keys

- ZeroDev intro: https://docs.zerodev.app
- ZeroDev permissions / session keys: https://docs.zerodev.app/smart-accounts/permissions/intro
- ZeroDev plugins: https://docs.zerodev.app/smart-accounts/use-plugins/overview
- Privy embedded wallet: https://docs.privy.io
- ERC-4337 reference EntryPoint: https://eips.ethereum.org/EIPS/eip-4337
- ERC-7715 wallet permissions: https://eips.ethereum.org/EIPS/eip-7715
- ERC-7579 modular smart accounts: https://eips.ethereum.org/EIPS/eip-7579
- Robinhood Chain bundler/gas manager (built-in AA): https://docs.robinhood.com/chain/connecting/

### Identity, Agents, MCP

- ERC-8004 (agent identity): https://eips.ethereum.org/EIPS/eip-8004
- Model Context Protocol spec: https://modelcontextprotocol.io
- MCP SDK (TypeScript): https://github.com/modelcontextprotocol/typescript-sdk
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
- Anthropic agent payments / commerce examples: https://www.anthropic.com/news (search "agent payments")

### Indexing & Data

- The Graph: https://thegraph.com
- Goldsky (Arbitrum Sepolia supported): https://docs.goldsky.com/chains/supported-networks
- Goldsky instant subgraphs: https://docs.goldsky.com/subgraphs/reference/instant-subgraph

### Oracles (only where evidence requires it)

- Chainlink: https://chain.link
- Pyth: https://pyth.network
- RedStone: https://redstone.finance

### RPC Providers

- Alchemy: https://www.alchemy.com
- QuickNode: https://www.quicknode.com
- Infura: https://www.infura.io
- Ankr: https://www.ankr.com

### Best Practice Reference Projects (the Census class we must beat)

- ARBITRUM_LONDON_ALL_PROJECTS_CENSUS_AND_RERANK_V2 d89153c727754938b8839ffa18eb81af.md (in-repo)
- Coinbase x402 demo: https://github.com/coinbase/x402
- Robinhood Chain examples (read explorer + faucet flows directly)
- Privy/ZeroDev session-key sample apps (linked above)

## Phase Plan

This is the IMPLEMENTATION BIBLE. Every phase below has the same 17 fields. A new engineer must be able to execute the phase using only this section and the Required Research Index above. The order is the production order. Phases A–C are unblockers, D–I deliver the differentiators, J–M deliver SDK, cockpit, and submission.

Each phase header is followed by:

1. **Objective**
2. **Business Value**
3. **Why Judges Care**
4. **Frontend Work**
5. **Backend Work**
6. **Database Work**
7. **Contract Work**
8. **Stylus Work**
9. **APIs**
10. **Tests**
11. **Deployment**
12. **Acceptance Criteria**
13. **Risks**
14. **Required Documentation**
15. **Required Repositories**
16. **Example Implementations**
17. **Official Resources**

---

### Phase A — Current State Audit & Baseline Lock

**1. Objective**
Freeze the proven baseline as a judge-readable, demoable, regression-free starting point. Do nothing destructive: this phase only documents and validates what already works on Arbitrum Sepolia (`421614`) and Robinhood Testnet (`46630`).

**2. Business Value**
Eliminates "it works on my laptop" risk. Every later phase ships against a known good state with locked contract addresses, known tx hashes, and reproducible build commands. Reduces demo failure probability to near zero by giving us fallback proofs we can show even if the live demo breaks.

**3. Why Judges Care**
Judges are pattern-matching for credibility in seconds. A locked baseline means the moment a judge asks "show me proof", we open a public, dated, on-chain transaction with a readable proof page. Most buildathon projects fail this test.

**4. Frontend Work**
- Walk every route under `frontend/src/app/**` and tag each as `primary` (Connect → Agent → Rules → Fund → Execute → Proof) or `evidence/admin`.
- Capture screenshots of: marketing landing, dashboard, agents list, intent builder, executions list, success proof page, refusal proof page, Robinhood demo page, balances panel.
- Confirm dashboard pulls real data from `/api/v1/proofs/...` and not stubs.

**5. Backend Work**
- Run `pnpm --filter backend build` and `pnpm --filter backend test -- --runInBand`. Capture output.
- Verify Render env groups and worker health by hitting `/api/v1/health` and `/api/v1/status` (or equivalents).
- Confirm settlement worker is idempotent against the Sepolia RPC by replaying one already-settled execution and observing "already settled" branch.

**6. Database Work**
- Query Supabase for executions where `status='settled'` on each chain; record IDs, mandate IDs, settlement tx hashes, block numbers.
- Run `select count(*) from refusal_receipts;` and `select count(*) from settlements;`.
- Snapshot schema with `pg_dump --schema-only` and store in `docs/proofs/baseline-schema.sql`.

**7. Contract Work**
- Read `contracts/deployments/arbitrum-sepolia/deployment.json` and `contracts/deployments/robinhood-testnet/deployment.json` and confirm every address resolves on the explorer.
- For each deployed contract, run `cast code <addr> --rpc-url $RPC` to confirm bytecode present.
- Re-run `pnpm --filter @valen/contracts test`.

**8. Stylus Work**
- Confirm engines registered in `stylus/deployments/*/engines.json` resolve with `cast call` for `policyHash()` (or equivalent read).
- Run `cd stylus && cargo test` and capture results.

**9. APIs**
- `GET /api/v1/proofs/executions/:id` returns 200 for both baseline executions.
- `GET /api/v1/proofs/refusals/:id` returns 200 for at least one refusal.
- `GET /api/v1/proofs/pack` returns a public-safe JSON pack (will be expanded in Phase I but must already exist).

**10. Tests**
```bash
pnpm --filter frontend build
pnpm --filter backend build
pnpm --filter backend test -- --runInBand
pnpm --filter @valen/contracts test
cd stylus && cargo test
```
- Capture output to `docs/proofs/baseline-test-output.txt`.

**11. Deployment**
- No new deployment. Confirm Vercel and Render are green; confirm Render keyvalue (Redis) is healthy.

**12. Acceptance Criteria**
- Both baseline execution IDs (`d872b0a7-e7de-4a86-887b-b6ac682c7173` Arbitrum Sepolia, `7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c` Robinhood) are documented with chain, asset, mandate ID, settlement tx hash, block number, and public proof URL.
- Every frontend route is classified primary or evidence/admin in `docs/summary.md`.
- All five test commands above exit 0.
- Old failed executions are visibly labelled "historical pre-fix" so judges never confuse them with current state.

**13. Risks**
- *Drift between deployment.json and explorer state*. Mitigation: re-verify with `cast code`.
- *Stale Render keys*. Mitigation: rotate before any new phase begins.

**14. Required Documentation**
- Arbitrum docs (network basics): https://docs.arbitrum.io
- Robinhood Chain connecting: https://docs.robinhood.com/chain/connecting/
- This file's Baseline State section.

**15. Required Repositories**
- This repo only.
- `arbitrum-sdk` for sanity-checking RPC patterns.

**16. Example Implementations**
- `contracts/reports/e2e-*.json` (existing).
- `docs/proofs/PROOF_PACK.md` (template lives here).

**17. Official Resources**
- Arbitrum Sepolia explorer: https://sepolia.arbiscan.io
- Robinhood Chain testnet explorer: https://explorer.testnet.chain.robinhood.com
- Vercel deploy logs and Render service logs (internal).

---

### Phase B — UX Simplification & Single User Journey

**1. Objective**
Make the entire product understandable in ≤ 60 seconds by collapsing navigation around the canonical journey **Connect Wallet → Create Agent → Set Rules → Fund Agent → Execute → See Proof**. Demote every admin/evidence surface behind a single side menu. Promote Mission Control as the only landing dashboard.

**2. Business Value**
Most rejection from buildathon judges is "I don't get what this product is in the first screen." A single journey converts a complex compliance product into an intuitive money-control product. UX clarity is the highest leverage in the entire plan.

**3. Why Judges Care**
Judges spend < 90 seconds per project on first contact. A cluttered admin dashboard kills score regardless of technical depth. A clean six-step journey signals product maturity, founder discipline, and commercial intuition.

**4. Frontend Work**
- Refactor `frontend/src/components/app/sidebar.tsx` into two groups: `Primary` (Mission Control, Agents, Rules, Wallets, Executions, Proof) and `Evidence & Admin` (Mandates, Audit, Treasury, Governance, Settings).
- Rebuild `frontend/src/app/dashboard/page.tsx` as Mission Control: 1 hero CTA ("Run a governed action"), 1 status row (agent, budget, last proof), 1 latest proof card per chain.
- Rewrite `frontend/src/app/onboarding/page.tsx` as a 4-step flow card: Connect → Create Agent → Set Rules → Fund Agent.
- Rewrite the marketing landing `frontend/src/app/page.tsx` and `frontend/src/components/marketing/hero-section.tsx` to lead with: "The operating system for autonomous finance. Create an agent, give it USDC and rules, see proof for every move."
- Audit `frontend/src/app/dashboard/wallets/page.tsx` and `executions/new/page.tsx` so the path Fund → Execute is one click each.
- Replace the words "compliance", "policy engine", "engine evaluation" in primary screens with "rules", "approval", "refusal".
- Add a sticky "Latest Proof" pill in the top header that always links to the most recent proof for the current org.

**5. Backend Work**
- Add `GET /api/v1/dashboard/summary` returning the Mission Control payload: agentId, USDC balance, ETH balance, current budget remaining, last execution and last refusal per chain.
- Make sure the response is cacheable for 5 seconds (Redis) so Mission Control is fast.

**6. Database Work**
- No schema change. Add `agent_summary_v` view in Supabase that selects the fields above.

**7. Contract Work**
- None.

**8. Stylus Work**
- None.

**9. APIs**
- `GET /api/v1/dashboard/summary` (new, public-safe for the authed org).

**10. Tests**
- Frontend: Playwright smoke that verifies the 6-step nav order and a one-click path to the latest proof.
- Backend: `dashboard.summary.spec.ts` returns 200 with required keys.
- Visual regression: snapshot Mission Control before/after.

**11. Deployment**
- Vercel preview from a feature branch. Promote to production only after the 60-second test (described below) passes with two non-engineer testers.

**12. Acceptance Criteria**
- Primary nav follows the six-step order on every viewport.
- A first-time visitor can describe what VALEN does in ≤ 60 seconds after viewing only the landing page and Mission Control.
- Admin routes are reachable but never visible above the fold.
- Latest proof is always one click from Mission Control.

**13. Risks**
- *UX regression for power users*. Mitigation: the Evidence & Admin menu still shows the full feature set unchanged.
- *Information loss on dashboard*. Mitigation: Mission Control links into existing detail pages.

**14. Required Documentation**
- Privy embedded wallet UX: https://docs.privy.io
- Modern fintech onboarding patterns (study Robinhood, Linear, Stripe Atlas).
- Vercel previews: https://vercel.com/docs/deployments/preview-deployments.

**15. Required Repositories**
- shadcn/ui (already in repo) — keep visual language.
- Tailwind v4 (already in repo).

**16. Example Implementations**
- Linear onboarding flow.
- Stripe Atlas signup wizard (multi-step + status row).
- Robinhood mobile app top nav (clear primary actions, no secondary clutter).

**17. Official Resources**
- Next.js App Router docs: https://nextjs.org/docs/app
- Tailwind: https://tailwindcss.com/docs
- Privy: https://docs.privy.io

---

### Phase C — USDC-First Experience (Frontend, Backend, Asset Registry)

**1. Objective**
Make USDC the default asset everywhere a user, an agent, or a proof page sees an asset. Wire the asset registry so the entire stack speaks "asset → metadata → settlement adapter" rather than hardcoded ETH.

**2. Business Value**
USDC is the unit of measure for autonomous finance. A USDC-first product is instantly legible to anyone (judge, partner, customer). It also unlocks every downstream feature: budgets, x402, payment receipts, and Robinhood swap settlement adapters.

**3. Why Judges Care**
Stablecoin-denominated agent budgets are the universal commercial story. Native ETH transfer demos look toy-grade in 2026. USDC-first is what every Coinbase/Stripe/Visa agent commerce announcement uses. We must visibly ride that narrative.

**4. Frontend Work**
- Update `frontend/src/lib/known-assets.ts` so `ARBITRUM_SEPOLIA_USDC` (`0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`, 6 decimals) is the default. Add `support_level: "demo-ready"` and `category: "stablecoin"`.
- Update `frontend/src/lib/intent-templates.ts`: every default template uses USDC; ETH templates labeled "Legacy / Gas only".
- Update `frontend/src/lib/wallet-balances.ts` to read ERC-20 balanceOf(USDC) and decimals=6, plus ETH for gas.
- Add `frontend/src/components/app/wallet-balances-panel.tsx` showing USDC and ETH side-by-side, with USDC primary.
- Add USDC chip + amount + decimals everywhere the user picks an asset.
- Show "Settlement asset: USDC" inside proof pages.

**5. Backend Work**
- New module `backend/src/modules/assets/` with: `assets.controller.ts`, `assets.service.ts`, `dto/asset.dto.ts`. Resolves chainId + symbol → metadata + adapter address.
- Update `backend/src/common/utils/execution-asset.util.ts` to consult the registry instead of returning ETH zero-address.
- Update `backend/src/modules/settlement/chain.service.ts` so it dispatches to a per-asset adapter (native vs ERC-20). Native ETH path remains intact.
- Update `backend/src/modules/mandates/mandates.service.ts` so policy check is asset-aware (asset symbol, decimals, chainId).

**6. Database Work**
- New migration `backend/supabase/migrations/<ts>_asset_registry.sql`:
  - Table `assets`: `chain_id`, `symbol`, `address`, `decimals`, `category`, `support_level`, `metadata jsonb`.
  - Seed rows: USDC on `421614`, USDC on `46630` (if listed), TSLA/AMZN/PLTR/NFLX/AMD on `46630` with `support_level='metadata-only'` until verified.
- Migration `<ts>_executions_asset_link.sql`: ensure `executions.asset_address` is FK-soft-linked to assets via composite (`chain_id`, `asset_address`).
- Migration `<ts>_settlement_status_enum.sql`: add `'erc20_pending'`, `'erc20_settled'` values to settlement status enum.

**7. Contract Work**
- Add `contracts/src/settlement/ValenTokenSettlementAdapter.sol`: thin adapter that takes `(token, from, to, amount, idempotencyKey)`, verifies caller is `ValenSettlement`, executes `safeTransferFrom`, and emits `TokenSettled(execId, token, amount, to)`.
- Update `contracts/src/settlement/ValenSettlement.sol` to dispatch to the adapter when asset != address(0).
- Keep native path unchanged; add an explicit branch + event so proof pages can render either mode.

**8. Stylus Work**
- None for Phase C (the BudgetEngine in Phase F builds on this work).

**9. APIs**
- `GET /api/v1/assets?chainId=` → list of supported assets with metadata.
- `GET /api/v1/assets/:chainId/:symbol` → single asset with adapter address.
- `POST /api/v1/executions` accepts `assetSymbol` instead of (or in addition to) `assetAddress`.

**10. Tests**
- Backend unit tests for `AssetsService` resolution per chain.
- Backend integration test: create execution with USDC on Arbitrum Sepolia, verify adapter dispatch path is selected.
- Contract Foundry test: `forge test` for `ValenTokenSettlementAdapter` happy path, idempotency replay, and unauthorized-caller revert.
- Frontend Playwright: balances panel shows USDC by default; intent builder picks USDC by default.

**11. Deployment**
- Deploy `ValenTokenSettlementAdapter` on Arbitrum Sepolia and Robinhood Testnet.
- Update `contracts/deployments/<chain>/deployment.json`.
- Roll backend with new env: `ASSET_REGISTRY_DEFAULT_CHAIN_ID=421614`, `ASSET_REGISTRY_DEFAULT_SYMBOL=USDC`.
- Vercel rebuild after asset registry env values land.

**12. Acceptance Criteria**
- Default asset everywhere is USDC.
- USDC balance shows for the user wallet on both chains where applicable.
- A USDC execution executes end-to-end with token settlement (or, if token settlement is gated to Phase D for Robinhood, native USDC stub on testnet is allowed and clearly labelled).
- Proof page shows: settlement asset = USDC, decimals = 6, amount in human-readable units.
- Native ETH still works on a clearly labelled "Legacy" template.

**13. Risks**
- *Adapter introduces re-entrancy or stuck approvals*. Mitigation: use OpenZeppelin SafeERC20, no approvals stored on adapter, single-call settle flow.
- *Decimal mismatch*. Mitigation: UI strictly reads `decimals()` from the asset registry.

**14. Required Documentation**
- USDC contract docs: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
- EIP-3009: https://eips.ethereum.org/EIPS/eip-3009
- OpenZeppelin SafeERC20: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20

**15. Required Repositories**
- OpenZeppelin contracts: https://github.com/OpenZeppelin/openzeppelin-contracts
- Circle USDC reference: https://github.com/centrehq/centre-tokens

**16. Example Implementations**
- Sperax x402 facilitator (USDC EIP-3009 settlement reference): https://github.com/Sperax/x402-facilitator
- Hummus on Rails facilitator: https://github.com/hummusonrails/x402-facilitator

**17. Official Resources**
- Circle USDC faucet: https://faucet.circle.com
- Arbitrum Sepolia USDC: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
- Robinhood Chain RPC + bridge guide: https://docs.robinhood.com/chain/connecting/

---

### Phase D — Robinhood Token Experience (Headline Feature)

**1. Objective**
Make Robinhood Chain a first-class, headline integration of VALEN — not a side demo. Support every documented Robinhood testnet stock token (TSLA, AMZN, PLTR, NFLX, AMD) end-to-end: registry metadata → policy/risk evaluation → allowed and refused execution paths → on-chain proof on chain `46630`.

**2. Business Value**
Robinhood Chain is a sponsored Arbitrum Orbit chain, has its own buildathon prize track, and represents the highest-profile RWA story in the cohort. Owning a complete tokenized-asset governance flow on it puts VALEN in front of Robinhood's developer team and unlocks the prize track in addition to the Arbitrum prize track.

**3. Why Judges Care**
A tokenized-asset agent with rules, refusals, and proofs is the canonical demo a Robinhood judge wants to see. Five real ticker symbols on the demo card — TSLA, AMZN, PLTR, NFLX, AMD — are visceral and memorable. A refused TSLA action with on-chain receipt is the strongest possible single demo screen.

**4. Frontend Work**
- Replace `frontend/src/app/dashboard/demo/robinhood-tsla/page.tsx` with a generalized `dashboard/demo/robinhood/page.tsx` showing a tile grid for all 5 supported tokens.
- Each tile shows: ticker, asset metadata badge ("Tokenized Stock — Robinhood Testnet"), supported scenarios ("Allowed transfer", "Refused over-limit", "Refused outside hours"), a CTA "Run governed action".
- Add a `dashboard/demo/robinhood/[ticker]/page.tsx` per-asset detail page with: explanation of the policy that governs it, a launch-into-intent-builder CTA prefilled with that asset, and a "Latest proof for this asset" panel.
- Add `frontend/src/components/app/asset-pill.tsx` rendering ticker + chain + support level. Use everywhere asset is displayed.
- Update `frontend/src/lib/intent-templates.ts` to add 10 templates for Robinhood: 2 per token (one allowed, one refusal-triggering).
- Update `frontend/src/lib/known-assets.ts` so all 5 Robinhood assets are registered with: `chainId: 46630`, `symbol`, `decimals: 18` (until docs confirm otherwise — record in `support_level: "metadata-only"` until contract addresses are verified through faucet+explorer), `support_level`, `category: "rwa-stock-token"`.
- Honest UI: when `support_level === "metadata-only"`, the run button is enabled but labelled "Demo (metadata only)" and the resulting proof clearly states "settlement asset = native ETH (testnet); policy asset = TSLA token (metadata only)".

**5. Backend Work**
- Extend `backend/src/modules/assets/` to load Robinhood asset rows.
- Implement an asset discovery script `scripts/robinhood/discover-assets.ts` that takes a faucet wallet, mints faucet tokens, walks the resulting transfer logs on the explorer, and writes the discovered token addresses into the migration file as a one-time bootstrap. Document the procedure in `docs/robinhood-discovery.md`.
- Update `backend/src/modules/mandates/mandates.service.ts` so `actionType=robinhood_token_transfer` is a valid action with policy checks: max-per-asset, allowed-tickers list, time window, max-USD-equivalent (priced via a static demo oracle in `assets` metadata).
- Add `backend/src/modules/risk/robinhood.policy.ts` with deterministic refusal cases: over-limit, outside-window, denylisted-ticker.
- Add `RobinhoodTokenAdapter` in `backend/src/modules/settlement/adapters/` that, when `support_level='settlement-ready'`, dispatches through `ValenTokenSettlementAdapter` from Phase C; otherwise falls back to native ETH settlement and labels metadata-only.

**6. Database Work**
- Migration `<ts>_robinhood_assets.sql` seeds TSLA, AMZN, PLTR, NFLX, AMD on chain `46630`.
- Migration `<ts>_action_type_enum.sql` adds `'robinhood_token_transfer'` to `action_type` enum.
- Migration `<ts>_robinhood_demo_scenarios.sql` seeds 10 demo intent templates so they render even on a fresh DB.

**7. Contract Work**
- Reuse `ValenTokenSettlementAdapter` from Phase C.
- Deploy a Robinhood-specific `RobinhoodAssetRegistry.sol` on chain `46630` storing canonical token address + ticker mapping + verified flag. This makes the integration visible on the Robinhood explorer.
- Wire the registry into `ValenMandateRegistry` so a mandate that specifies "ticker=TSLA" is resolved against the registry at evaluation time.

**8. Stylus Work**
- Extend the existing PolicyEngine Stylus contract with a small additional view fn `evaluateRobinhoodPolicy(bytes32 mandate, bytes32 assetKey, uint256 amount, uint256 timestamp) → uint8 verdict`. Verdicts: 0=allow, 1=refuse-window, 2=refuse-cap, 3=refuse-asset.
- Keep this in the existing PolicyEngine crate to avoid a new deployment.

**9. APIs**
- `GET /api/v1/robinhood/assets` → 5 tokens with metadata.
- `GET /api/v1/robinhood/assets/:ticker` → single asset detail + scenarios.
- `POST /api/v1/executions` accepts `actionType=robinhood_token_transfer` with `ticker`, `amount`, `recipient`.
- `GET /api/v1/proofs/refusals/by-asset/:ticker` → latest refusal for a given ticker.

**10. Tests**
- Foundry tests for `RobinhoodAssetRegistry`.
- Stylus `cargo test` for `evaluateRobinhoodPolicy` covering all 4 verdicts.
- Backend e2e test that runs `allowed TSLA` and `refused TSLA over cap` and asserts proof + receipt.
- Frontend Playwright: tile grid renders 5 tokens; clicking any tile leads to a working intent builder.

**11. Deployment**
- Deploy `RobinhoodAssetRegistry` on chain `46630`.
- Update `contracts/deployments/robinhood-testnet/deployment.json`.
- Run `scripts/robinhood/discover-assets.ts` once with the project faucet wallet to bootstrap the metadata table.
- Promote backend migration. Vercel rebuild for new pages.

**12. Acceptance Criteria**
- All 5 tokens (TSLA, AMZN, PLTR, NFLX, AMD) appear with consistent metadata and a clearly labeled support level.
- One allowed Robinhood execution and one refused Robinhood execution are recorded on chain `46630` and have public proof URLs.
- The Robinhood demo page is one click from Mission Control.
- Submission video lists Robinhood as a headline feature.
- A judge can see the same TSLA refused-over-limit proof at the same URL after the live demo (proof persistence).

**13. Risks**
- *Robinhood does not publish stable token contract addresses*. Mitigation: discovery script via faucet; metadata-only mode until verified; honest labelling.
- *Robinhood faucet rate limits stall demo*. Mitigation: pre-fund the demo wallet during the night before submission.
- *Bridge friction*. Mitigation: keep the demo flows native to chain `46630` only.

**14. Required Documentation**
- Robinhood Chain docs index: https://docs.robinhood.com/chain/
- Robinhood Chain testnet ToS (asset list): https://docs.robinhood.com/chain/terms-of-service/
- Robinhood Chain connecting: https://docs.robinhood.com/chain/connecting/
- Robinhood Chain Arbitrum announcement: https://blog.arbitrum.io/robinhood-chain-testnet/
- Arbitrum Orbit overview: https://docs.arbitrum.io/launch-orbit-chain/orbit-gentle-introduction

**15. Required Repositories**
- arbitrum-sdk: https://github.com/OffchainLabs/arbitrum-sdk
- OpenZeppelin contracts (registry pattern): https://github.com/OpenZeppelin/openzeppelin-contracts
- stylus-sdk-rs: https://github.com/OffchainLabs/stylus-sdk-rs

**16. Example Implementations**
- Reading Robinhood faucet flows: faucet → wallet → explorer → token transfer logs.
- Coinbase x402 examples (USDC settlement on Arbitrum).
- Census top RWA projects: review the highest-ranked tokenization entries in `ARBITRUM_LONDON_ALL_PROJECTS_CENSUS_AND_RERANK_V2 d89153c727754938b8839ffa18eb81af.md` and exceed each one on UX, refusal flow, and proof completeness.

**17. Official Resources**
- Robinhood Chain testnet faucet: https://faucet.testnet.chain.robinhood.com
- Robinhood Chain testnet explorer: https://explorer.testnet.chain.robinhood.com
- Arbitrum Bridge: https://bridge.arbitrum.io

---

### Phase E — Identity / Mandates / Permissions (with ERC-8004 binding)

**1. Objective**
Bind every governed action to: (a) a verified user wallet, (b) a signed EIP-712 mandate, (c) a frozen policy hash, (d) an organization, and (e) an ERC-8004 agent identity. Make these visible in proof and queryable from SDK/MCP.

**2. Business Value**
This is the layer that makes "agent did X" provable in court-grade terms. Without it, autonomous finance is just chat-driven on-chain transfers. With it, every action is tied to identity, intent, and authority.

**3. Why Judges Care**
Identity + permission + policy + proof is the missing piece in nearly every other buildathon project. Judges from Coinbase, Robinhood, and Arbitrum recognize the pattern instantly because it's how their internal AML/risk teams think.

**4. Frontend Work**
- Update `frontend/src/app/dashboard/agents/[agentId]/page.tsx` to show: ERC-8004 identity (or "registration pending"), bound wallet, current mandates with signer, expiry, scopes.
- Add `frontend/src/components/app/erc8004-badge.tsx` rendering ERC-8004 token URI metadata if available.
- Update proof page `frontend/src/app/dashboard/executions/[executionId]/proof/page.tsx` to show the full chain-of-trust block: agent → mandate → policy → wallet → settlement.
- Add a "Sign new mandate" UX with EIP-712 typed-data preview.

**5. Backend Work**
- Module `backend/src/modules/erc8004/`: client to the ERC-8004 registry, register/lookup/sync agent identity. Cache TokenURI metadata.
- Tighten `backend/src/modules/mandates/mandates.service.ts`: enforce mandate signer == bound wallet; enforce mandate expiry, action scope, asset scope, chain scope, and target whitelist before any execution proceeds.
- Worker `backend/src/modules/erc8004/sync.worker.ts`: refresh ERC-8004 metadata daily.

**6. Database Work**
- Migration `<ts>_erc8004_agent_identity.sql`: table `agent_identity (agent_id, registry_address, token_id, chain_id, owner_address, token_uri, metadata jsonb, last_synced_at)`.
- Migration `<ts>_mandate_indexes.sql`: composite index on `(agent_id, chain_id, action_type, expires_at)` for fast policy resolution.

**7. Contract Work**
- Confirm `ValenMandateRegistry` exposes `mandateOf(agentId, chainId, actionType)` returning the active mandate hash and signer.
- Add `ValenIdentityResolver.sol` (thin contract on Arbitrum Sepolia) that maps internal agentId → ERC-8004 (registry, tokenId). Used so the proof page can produce a single canonical agent badge from contract state.

**8. Stylus Work**
- None new. Confirm existing PolicyEngine reads mandate hash from MandateRegistry.

**9. APIs**
- `GET /api/v1/agents/:agentId/identity` → `{erc8004, mandates[], walletBindings[]}`.
- `POST /api/v1/agents/:agentId/mandates` accepts EIP-712 signed payload, verifies signer, stores it.
- `POST /api/v1/agents/:agentId/erc8004/register` initiates the optional registration.

**10. Tests**
- Backend unit tests: signature verification, mandate scope enforcement, ERC-8004 sync caching.
- Foundry tests for `ValenIdentityResolver`.
- Frontend Playwright: signing a mandate populates the agent profile.

**11. Deployment**
- Deploy `ValenIdentityResolver` on Arbitrum Sepolia.
- Wire backend env: `ERC8004_REGISTRY_ADDRESS`, `ERC8004_REGISTRY_CHAIN_ID`.
- If ERC-8004 reference contract is not yet deployed on Arbitrum Sepolia, deploy a minimal compatible registry from OpenZeppelin templates.

**12. Acceptance Criteria**
- The demo agent has either an ERC-8004 token registered on Arbitrum Sepolia, or a documented "registration pending" state with all the metadata ready.
- Every proof page renders agent, mandate signer, policy hash, and identity in one block.
- Mandate-bound API keys still work end-to-end.
- Mandate-mismatch (wrong chain, action, asset, or target) produces a refusal with receipt.

**13. Risks**
- *ERC-8004 spec drift*. Mitigation: store metadata as jsonb and treat the contract as canonical; regenerate from spec when changes land.
- *Signer recovery edge cases*. Mitigation: use viem `verifyTypedData` with explicit domain.

**14. Required Documentation**
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- EIP-712 typed structured data: https://eips.ethereum.org/EIPS/eip-712
- Privy embedded wallet signing: https://docs.privy.io/wallets/usage/eip712

**15. Required Repositories**
- OpenZeppelin contracts (ERC-721, AccessControl): https://github.com/OpenZeppelin/openzeppelin-contracts
- viem (typed data): https://github.com/wevm/viem

**16. Example Implementations**
- Reference implementations of EIP-712 mandates from session-key wallet projects (ZeroDev, Rhinestone).
- Existing in-repo `contracts/src/registry/ValenMandateRegistry.sol`.

**17. Official Resources**
- viem docs: https://viem.sh
- ZeroDev permissions: https://docs.zerodev.app/smart-accounts/permissions/intro
- ERC-7715 wallet permissions: https://eips.ethereum.org/EIPS/eip-7715

---

### Phase F — Budget Engine (USDC Budget as a Core Primitive)

**1. Objective**
Treat USDC budget as a first-class on-chain financial primitive: a per-agent, per-period spending envelope that produces deterministic on-chain refusals when violated. Implement it as a Stylus engine + Solidity vault and surface a real-time budget meter in the UI.

**2. Business Value**
A USDC budget is the most legible commercial concept in agent finance. It maps directly to "give my agent $1,000 per day". It is the single highest-ROI feature for partner conversations and the cleanest "no" the system can produce.

**3. Why Judges Care**
A live, shrinking USDC budget meter that produces an on-chain refusal receipt the instant the budget is exceeded is the most demoable governance moment in the entire stack. Nobody else in the cohort ships this end-to-end.

**4. Frontend Work**
- New component `frontend/src/components/app/budget-meter.tsx` showing: agent, asset (USDC), period (rolling 24h or "today"), spent, remaining, projected, last topup tx. Live updates via SWR + revalidate-on-mutation.
- Place the meter on Mission Control, Agent Detail, and the intent builder (real-time validation).
- Intent builder: when an action would breach the budget, show inline "This action will be refused (budget exceeded)" with the projected refusal receipt URL.
- Treasury → Fund Agent flow: USDC top-up tx that emits a `BudgetTopUp` event the meter consumes.

**5. Backend Work**
- New module `backend/src/modules/budget/` with: `budget.service.ts`, `budget.controller.ts`, `budget.evaluator.ts`. Resolves period, computes spent vs cap, returns `{allow, remaining, evidenceHash}`.
- Hook the evaluator into the execution pipeline: every execution must pass budget check before settlement worker picks it up. Refusal short-circuits to `RefusalReceipt`.
- Worker `budget.snapshot.worker.ts`: every period boundary, snapshot budget state to DB for proof reproducibility.

**6. Database Work**
- Migration `<ts>_agent_budgets.sql`: table `agent_budgets (agent_id, chain_id, asset, period, period_started_at, cap, spent, evidence_hash, updated_at)`.
- Migration `<ts>_budget_events.sql`: append-only `budget_events (agent_id, execution_id, kind, amount, before, after, evidence_hash, ts)`.
- Materialized view `agent_budget_status_v` for fast UI reads.

**7. Contract Work**
- New contract `contracts/src/treasury/ValenBudgetVault.sol`: ERC-20 vault holding USDC for a single agent, with deposit/withdraw, period-tracked accounting, and a `commitSpend(execId, amount)` that is callable only by `ValenSettlement`. Emits `BudgetTopUp`, `BudgetSpend`, `BudgetExceeded`.
- Update `ValenSettlement` to call `commitSpend` before transferring on token settlements.

**8. Stylus Work**
- New crate `stylus/engines/budget-engine/`: `lib.rs` exposes `evaluate(agentKey, period, cap, spent, amount) → Verdict { Allow, RefuseCap, RefusePeriodReset }`.
- `Cargo.toml` mirrors the patterns in the existing 4 engines.
- `cargo stylus check && cargo stylus deploy` once before merge.

**9. APIs**
- `GET /api/v1/budget/:agentId` → live meter payload.
- `POST /api/v1/budget/:agentId/topup` → on-chain top-up flow returning tx hash.
- `GET /api/v1/budget/:agentId/events` → paginated history.
- Internal: `BudgetService.evaluate(execution)` callable from execution pipeline.

**10. Tests**
- Stylus `cargo test` covering allow/refuse-cap/period-reset.
- Foundry tests for `ValenBudgetVault`: deposit, commitSpend, unauthorized caller, period boundary.
- Backend integration: under-cap allowed → settlement; over-cap → refusal receipt with budget evidence hash.
- Frontend Playwright: meter updates after top-up; meter blocks intent submission when projected over-cap.

**11. Deployment**
- Deploy BudgetEngine Stylus contract on Arbitrum Sepolia and Robinhood Testnet.
- Deploy `ValenBudgetVault` per-agent (factory pattern) on both chains.
- Update `contracts/deployments/*/deployment.json` and `stylus/deployments/*/engines.json`.

**12. Acceptance Criteria**
- A USDC budget pass is recorded with `evidenceHash`.
- A USDC budget refusal generates a public refusal receipt with the budget evidence hash and the engine result.
- Mission Control shows a live budget meter for the demo agent.
- Stylus engine compiles and tests pass.

**13. Risks**
- *Stylus deployment friction*. Mitigation: use existing engine pipeline; mirror an already-deployed engine's structure exactly.
- *Race conditions between top-up tx and execution evaluation*. Mitigation: evaluator reads on-chain state at evaluation time and stamps `evidence_hash` from that read.

**14. Required Documentation**
- Arbitrum Stylus quickstart: https://docs.arbitrum.io/stylus/quickstart
- Stylus by Example: https://stylus-by-example.org
- OpenZeppelin Stylus: https://github.com/OpenZeppelin/rust-contracts-stylus
- OpenZeppelin SafeERC20: https://docs.openzeppelin.com/contracts/5.x/api/token/erc20

**15. Required Repositories**
- stylus-sdk-rs: https://github.com/OffchainLabs/stylus-sdk-rs
- cargo-stylus: https://github.com/OffchainLabs/cargo-stylus
- rust-contracts-stylus: https://github.com/OpenZeppelin/rust-contracts-stylus

**16. Example Implementations**
- The repo's existing 4 Stylus engines (Compliance/Risk/Eligibility/Policy).
- OpenZeppelin Vault patterns (`ERC4626` for budget accounting inspiration; we don't need yield, just envelope semantics).

**17. Official Resources**
- Stylus docs: https://docs.arbitrum.io/stylus
- Arbitrum Stylus by Example: https://stylus-by-example.org

---

### Phase G — x402 Paid Actions (USDC Permission-Before-Payment)

**1. Objective**
Make VALEN the permission and refusal layer **before** an x402 payment is signed and settled. Issue x402 USDC payments only after mandate, policy, risk, and budget pass; produce a public payment proof for every settled payment and a refusal receipt for every blocked payment.

**2. Business Value**
x402 is becoming the de-facto agentic-payments standard. The first product that ships "every agent payment is permission-checked, refused if needed, and proven on-chain" wins the agentic-commerce narrative.

**3. Why Judges Care**
A live demo where an agent attempts a USDC payment, VALEN refuses, and emits a verifiable refusal receipt — then approves a different payment and emits an EIP-3009 settlement tx — is unforgettable. It's the "why this matters" moment.

**4. Frontend Work**
- New section in `frontend/src/app/dashboard/executions/new/page.tsx` for `actionType=x402_payment` with: target URL (or merchant), USDC amount, recipient address (from x402 challenge), max-fee.
- New page `frontend/src/app/proofs/payments/[paymentProofId]/page.tsx` showing: merchant, requested amount, settled amount, EIP-3009 nonce, settlement tx, response hash.
- Mission Control "Latest payment proof" pill.

**5. Backend Work**
- New module `backend/src/modules/x402/` with: `x402-client.service.ts` (x402 challenge negotiation), `x402-pay.service.ts` (orchestrates mandate + budget + signing + facilitator settle), `x402.controller.ts`.
- New module `backend/src/modules/payments/` storing payment intents and proofs.
- Use viem to construct EIP-3009 `transferWithAuthorization` typed-data, sign with the agent's bound key, and submit to a facilitator (default: configurable `X402_FACILITATOR_URL`).
- Refusal short-circuit emits a refusal receipt of `kind=x402_refusal`.

**6. Database Work**
- Migration `<ts>_x402_payments.sql`: table `x402_payments (id, agent_id, mandate_id, chain_id, recipient, asset, amount, nonce, eip3009_authorization, facilitator_response_hash, settlement_tx, status, created_at)`.
- Migration `<ts>_payment_proof_index.sql`: index by `agent_id`, `status`, `chain_id`.

**7. Contract Work**
- No new contract required. Use canonical USDC EIP-3009 path on Arbitrum Sepolia (`0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`).
- Add a thin `ValenPaymentLogger.sol` contract (optional but high-leverage) that emits `PaymentProof(agentId, paymentId, txHash, amount)` so payments are also discoverable via the Valen contract event index.

**8. Stylus Work**
- None.

**9. APIs**
- `POST /api/v1/x402/initiate` body: `{merchantUrl, maxAmount, asset, recipient}` → returns x402 challenge result and budget evaluation.
- `POST /api/v1/x402/execute` body: `{paymentIntentId}` → signs EIP-3009 + submits to facilitator; returns settlement tx + payment proof URL.
- `GET /api/v1/proofs/payments/:id` → public-safe payment proof.

**10. Tests**
- Backend integration test against a local x402 facilitator stub (use the open-source reference) verifying happy path and budget refusal.
- E2E test on Arbitrum Sepolia: real EIP-3009 USDC settlement of $0.10.
- Frontend Playwright: payment flow renders proof URL and refusal receipt URL.

**11. Deployment**
- Set `X402_FACILITATOR_URL` to either: (a) a self-hosted instance of `Sperax/x402-facilitator` configured with `ENABLE_ARBITRUM_SEPOLIA=true`, or (b) `hummusonrails/x402-facilitator` with the Arbitrum Sepolia config.
- Deploy `ValenPaymentLogger` if used; update `deployment.json`.
- Vercel rebuild for new pages.

**12. Acceptance Criteria**
- One USDC x402 payment is settled on Arbitrum Sepolia using EIP-3009; the proof URL returns 200 with all evidence.
- One x402 refusal is recorded with refusal receipt URL.
- Proof Pack includes both the payment proof and the refusal proof.
- The demo can be re-run within the same hour (idempotency / replay safety).

**13. Risks**
- *Facilitator availability*. Mitigation: self-host a facilitator in advance and document the URL.
- *Nonce / replay edge cases*. Mitigation: enforce one nonce per (agent, recipient, amount) and reject duplicates server-side.

**14. Required Documentation**
- x402 docs: https://docs.x402.org
- x402 network/token support: https://docs.x402.org/core-concepts/network-and-token-support
- EIP-3009: https://eips.ethereum.org/EIPS/eip-3009
- USDC on Arbitrum Sepolia: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d

**15. Required Repositories**
- coinbase/x402: https://github.com/coinbase/x402
- Sperax/x402-facilitator: https://github.com/Sperax/x402-facilitator
- hummusonrails/x402-facilitator: https://github.com/hummusonrails/x402-facilitator

**16. Example Implementations**
- gosuda/x402-facilitator (CAIP-2 multi-scheme reference): https://github.com/gosuda/x402-facilitator
- fastxyz/fast-sdk x402 facilitator package.

**17. Official Resources**
- x402.org: https://x402.org
- Coinbase developer agentic payments: https://www.coinbase.com/developer-platform/products/agentkit
- Circle USDC Arbitrum docs: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks

---

### Phase H — ERC-8004 Agent Identity Visibility

**1. Objective**
Make every VALEN agent ecosystem-readable. Publish ERC-8004 metadata, expose a public agent-identity endpoint, and embed identity into every proof page and SDK/MCP response.

**2. Business Value**
A persistent, standards-compliant agent identity means VALEN agents are trusted by other agents and other tools. It is the precondition for being included in agent-marketplace and agent-commerce ecosystems.

**3. Why Judges Care**
An agent that has an on-chain identity, an off-chain metadata profile, and a verifiable proof page is the canonical "agentic infrastructure" demo. ERC-8004 is being talked about by every track sponsor; few projects implement it.

**4. Frontend Work**
- Render `<ERC8004Badge />` on agent detail and on every proof page header.
- Public agent profile page `frontend/src/app/agents/[agentSlug]/page.tsx` (no auth) showing identity, public metadata, link to latest proof, link to refusal receipts.

**5. Backend Work**
- Module `backend/src/modules/erc8004/` (started in Phase E) gains `public.controller.ts` exposing `GET /api/v1/public/agents/:agentSlug`.
- Resolver caches token URI metadata in Redis with 10-minute TTL.
- Sync worker upserts `agent_identity` row.

**6. Database Work**
- Reuse Phase E migrations; add `agent_public_slug` index for public lookup.

**7. Contract Work**
- Use existing ERC-8004-compatible registry.
- If no Arbitrum Sepolia ERC-8004 registry is publicly available at submission time, deploy a minimal compatible registry from OpenZeppelin templates and document it as VALEN's transitional registry.

**8. Stylus Work**
- None.

**9. APIs**
- `GET /api/v1/public/agents/:agentSlug` (no auth, public-safe).
- `GET /api/v1/agents/:agentId/erc8004` (auth) → richer detail.

**10. Tests**
- Backend: cache hit/miss, registry unreachable fallback.
- Frontend: badge renders metadata; missing metadata renders "registration pending" honestly.
- SDK: `valen.identity.get(agentSlug)` returns the public profile.

**11. Deployment**
- Deploy minimal ERC-8004 registry on Arbitrum Sepolia if needed.
- Update env: `ERC8004_REGISTRY_ADDRESS`, `ERC8004_REGISTRY_CHAIN_ID`.

**12. Acceptance Criteria**
- The demo agent's public profile resolves at `/agents/<slug>` with no auth.
- Every proof page shows the ERC-8004 identity badge or the honest "pending" badge.
- SDK and MCP read identity from the public endpoint.

**13. Risks**
- *Spec churn*. Mitigation: store metadata as jsonb; treat the contract canonical fields conservatively.

**14. Required Documentation**
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- OpenZeppelin ERC-721 metadata: https://docs.openzeppelin.com/contracts/5.x/erc721

**15. Required Repositories**
- openzeppelin-contracts: https://github.com/OpenZeppelin/openzeppelin-contracts

**16. Example Implementations**
- ENS metadata pattern (well-known JSON profile fields).
- Lens/Farcaster profile resolvers (off-chain JSON cached server-side).

**17. Official Resources**
- ENS metadata service: https://metadata.ens.domains
- ERC-721 metadata standard: https://eips.ethereum.org/EIPS/eip-721

---

### Phase I — Proof API, Proof Pack, Refusal Receipts (the One URL Judges Trust)

**1. Objective**
Ship one canonical, public, schema-frozen proof surface that turns every execution, refusal, payment, and identity into a single inspectable URL. Provide a CLI verifier that re-checks every hash on-chain.

**2. Business Value**
"Proof is the product" stops being a slogan and becomes a daily-use commercial deliverable. Auditors, merchants, and other agents query VALEN's proof URLs the same way they query Stripe receipts.

**3. Why Judges Care**
A public, dated, hash-verified, on-chain-anchored proof URL with no auth is unbeatable. It works during the demo, after the demo, and across any judge's device.

**4. Frontend Work**
- New unified shell `frontend/src/app/proofs/(public)/layout.tsx` with branding, hash badges, "Verify with CLI" snippet, and copy-link.
- Pages: `proofs/executions/[id]`, `proofs/refusals/[id]`, `proofs/payments/[id]`, `proofs/pack` (index of latest one of each per chain).
- Print-friendly stylesheet so a judge can save proofs as PDFs.
- Search box that takes a tx hash, execution id, or payment id and routes to the right proof page.

**5. Backend Work**
- Module `backend/src/modules/proofs/` implementing canonical schema. Strict allowlist for fields: id, chainId, timestamp, action, asset, amount, mandate signer, policy hash, identity, settlement tx, evidence hashes. NEVER include raw policy payloads, raw user data, or internal IDs beyond the public id.
- Module `backend/src/modules/refusal-receipts/` with the same canonical hash policy.
- Append a `proofVersion: "1.0"` field. Document the schema in `docs/proofs/PROOF_SCHEMA.md`.
- Verifier `scripts/verify-proof-pack.ts`: takes a proof JSON, recomputes hashes, queries chain, returns OK/FAIL.

**6. Database Work**
- Migration `<ts>_proof_views.sql`: read-only views `public_executions_v`, `public_refusals_v`, `public_payments_v` with only public-safe fields.
- Add `published_at` columns so we can time-travel a proof.

**7. Contract Work**
- None new. Use existing `ValenSettlement` events + new `ValenPaymentLogger` (Phase G).

**8. Stylus Work**
- None.

**9. APIs**
- `GET /api/v1/public/proofs/executions/:id`
- `GET /api/v1/public/proofs/refusals/:id`
- `GET /api/v1/public/proofs/payments/:id`
- `GET /api/v1/public/proofs/pack` returns one-of-each latest, both chains.

**10. Tests**
- Backend: schema lock test (snapshot of every public proof).
- Backend: privacy test (asserts internal fields never appear).
- CLI verifier integration test against a known good execution.
- Frontend Playwright: every proof URL returns 200 unauthenticated.

**11. Deployment**
- Render rebuild. Vercel rebuild.

**12. Acceptance Criteria**
- Public proof pack returns 200 with no secrets.
- The CLI verifier re-validates every canonical hash.
- The demo video and submission link to a single Proof Pack URL.

**13. Risks**
- *Accidentally exposing tenant data*. Mitigation: views + schema lock + automated test.

**14. Required Documentation**
- JSON schema (RFC 8259): https://www.rfc-editor.org/rfc/rfc8259
- viem hashing utilities: https://viem.sh/docs/utilities/keccak256

**15. Required Repositories**
- viem: https://github.com/wevm/viem
- ajv (JSON schema validator) for the verifier: https://github.com/ajv-validator/ajv

**16. Example Implementations**
- Stripe receipt URLs (public, hash-stable, dated).
- Coinbase x402 verification flow.

**17. Official Resources**
- Arbiscan transaction page (cross-link from proofs).
- Robinhood Chain explorer.

---

### Phase J — MCP Server + TypeScript SDK

**1. Objective**
Let agents and judges call VALEN directly. Ship a typed TypeScript SDK and an MCP server that expose the nine highest-leverage tools: `valen.execute`, `valen.refuse.replay`, `valen.proof.fetch`, `valen.proof.pack`, `valen.budget.get`, `valen.budget.topup`, `valen.identity.get`, `valen.payments.x402`, `valen.assets.list`.

**2. Business Value**
Every other VALEN feature becomes accessible to any AI agent or backend with a single dependency. This converts VALEN from a UI to a platform.

**3. Why Judges Care**
A working `claude mcp add valen ...` demo, where Claude live-queries a VALEN proof, is uniquely memorable. MCP is the agentic-tooling lingua franca going into 2026.

**4. Frontend Work**
- Add a `Connect Agent` page `frontend/src/app/dashboard/sdk/page.tsx` showing copy-paste snippets for npm install + MCP config + first call.
- Render the live MCP tool list pulled from the running server.

**5. Backend Work**
- Workspace package `packages/sdk/`:
  - `src/index.ts` exports `Valen` class with the 9 methods above.
  - Token-bound auth (mandate-bound API keys reused).
  - viem-typed return shapes.
  - 100% TS, zero deps beyond viem and zod.
- Workspace package `packages/mcp-server/`:
  - Implements the MCP protocol with the official TypeScript SDK.
  - Translates each tool to the SDK call.
  - Audit-logs every tool call into the existing audit log.
  - Distributable as a single `npx valen-mcp` binary.

**6. Database Work**
- Migration `<ts>_sdk_audit.sql`: append `tool_name` and `client_kind` columns to `audit_log`.
- Index `audit_log` by `tool_name`.

**7. Contract Work**
- None.

**8. Stylus Work**
- None.

**9. APIs**
- All existing `/api/v1/*` endpoints reused.
- New `GET /api/v1/sdk/manifest` returns the live MCP tool list.

**10. Tests**
- SDK unit tests for each method.
- MCP integration: launch server, run MCP Inspector, list tools, call each one with a test token, assert audit log row appears.
- Bad-token rejection test.

**11. Deployment**
- Publish `@valen/sdk` and `@valen/mcp-server` to a private npm scope (or to the public npm if we are confident). Provide `npx @valen/mcp-server`.
- Render adds a separate "mcp" service that exposes a streamable HTTP MCP endpoint as a backup transport.

**12. Acceptance Criteria**
- `npx @valen/mcp-server` works against the production API with a mandate-bound token.
- MCP Inspector lists the 9 tools and successfully runs each one.
- Bad token is rejected.
- The audit log contains a row for every tool call.

**13. Risks**
- *MCP spec churn*. Mitigation: pin to the most recent stable SDK version; track upstream weekly.
- *SDK surface bloat*. Mitigation: lock to 9 methods; everything else goes through `valen.raw.fetch`.

**14. Required Documentation**
- Model Context Protocol: https://modelcontextprotocol.io
- MCP TypeScript SDK README.
- viem: https://viem.sh

**15. Required Repositories**
- modelcontextprotocol/typescript-sdk: https://github.com/modelcontextprotocol/typescript-sdk
- modelcontextprotocol/inspector: https://github.com/modelcontextprotocol/inspector

**16. Example Implementations**
- Stripe MCP server (read-only inspirational pattern).
- GitHub's official MCP server (auth + tool design pattern).

**17. Official Resources**
- npm scope: https://www.npmjs.com
- pnpm workspace: https://pnpm.io/workspaces

---

### Phase K — Mission Control (Cockpit Dashboard)

**1. Objective**
Make the dashboard feel like an autonomous-finance cockpit. One screen tells the entire story: agent identity, USDC budget, recent allowed action, recent refusal, recent payment, primary CTA.

**2. Business Value**
Mission Control is the first impression for every paid customer and every judge. It must render the entire value prop without scrolling.

**3. Why Judges Care**
A cockpit is what every product manager dreams of building. The judge should leave Mission Control able to sketch the architecture from memory.

**4. Frontend Work**
- Replace `frontend/src/app/dashboard/page.tsx` with a layout of 5 cards:
  1. **Agent Identity** (ERC-8004 badge + bound wallet).
  2. **Budget** (live budget meter + USDC balance).
  3. **Last Allowed Action** (link to proof).
  4. **Last Refusal** (link to refusal receipt).
  5. **Last Payment** (link to payment proof).
- 1 hero CTA: "Run governed action" → intent builder prefilled with a 1-USDC TSLA refusal demo.
- Top header pill "Latest Proof" deep-links to the most recent proof of any kind.
- Mobile-friendly stacked layout.

**5. Backend Work**
- Reuse `GET /api/v1/dashboard/summary` from Phase B; extend with budget snapshot and last-payment fields.

**6. Database Work**
- Reuse `agent_summary_v` view; extend with the new fields.

**7. Contract Work**
- None.

**8. Stylus Work**
- None.

**9. APIs**
- `GET /api/v1/dashboard/summary` returns the cockpit payload.
- `GET /api/v1/dashboard/last-of-each` returns latest execution / refusal / payment for the current org.

**10. Tests**
- Frontend Playwright: load Mission Control as a brand-new user (post-onboarding) and assert all 5 cards render with real data after demo seed.
- Performance: Mission Control p95 first paint < 2s on a cold cache.

**11. Deployment**
- Vercel rebuild.

**12. Acceptance Criteria**
- A judge can describe what VALEN does after looking at Mission Control alone.
- Latest proof and Robinhood proof are one click away.
- The hero CTA always lands on a proof-producing flow.

**13. Risks**
- *Cluttering the cockpit with secondary metrics*. Mitigation: hard limit of 5 cards.

**14. Required Documentation**
- Refer to Phase B's UX index.

**15. Required Repositories**
- shadcn/ui dashboard examples.

**16. Example Implementations**
- Stripe Dashboard cockpit.
- Vercel project home.

**17. Official Resources**
- shadcn/ui: https://ui.shadcn.com

---

### Phase L — Demo Packaging (Reliable, Judge-Friendly Demo)

**1. Objective**
Make the demo unbreakable. Define a 30-second pitch, a 2-minute demo path, fallback proof URLs, a screenshot checklist, and a written submission narrative — all reproducible across hardware.

**2. Business Value**
A reliable demo is force-multiplied evidence. Every prior phase's work is judged through this lens.

**3. Why Judges Care**
Most projects are evaluated in a single sitting where the demo is what the judge sees. A clean demo with fallback assets converts technical depth into score.

**4. Frontend Work**
- Add a `frontend/src/app/demo/page.tsx` "Demo Mode" route that runs through the canonical 2-minute flow with prefilled state.
- Add an in-app Demo Reset button that re-seeds the demo agent + budget + USDC top-up to known good state.

**5. Backend Work**
- `POST /api/v1/demo/reset` (auth-gated) that re-seeds the demo agent.
- `GET /api/v1/demo/state` returns whether demo state is good.
- A scheduled job that re-seeds nightly so morning-of-demo state is always fresh.

**6. Database Work**
- Read-only check queries (no schema changes).

**7. Contract Work**
- None.

**8. Stylus Work**
- None.

**9. APIs**
- `POST /api/v1/demo/reset`
- `GET /api/v1/demo/state`

**10. Tests**
- E2E: run the 2-minute demo path top-to-bottom on Vercel preview and on production. Capture timing and final proof URLs.
- Manual: rehearse pitch with two non-engineer testers; revise copy until 30-second pitch lands cleanly.

**11. Deployment**
- Pin demo seed wallet credentials in Render env (read-only on chain).
- Pre-fund the demo wallet from Circle and Robinhood faucets.
- Capture and check in golden screenshots and a recorded 90-second screen capture.

**12. Acceptance Criteria**
- 30-second pitch rehearsed and locked.
- 2-minute demo path runs end-to-end on production with no manual intervention.
- Fallback proof URLs (one allowed Arbitrum, one allowed Robinhood, one refusal, one payment) are documented in `docs/submission/demo-runbook.md`.
- Submission copy never claims mainnet shipped.

**13. Risks**
- *Wifi flakiness during live demo*. Mitigation: pre-record a 90-second screen capture and embed it on the landing page.
- *Faucet drain*. Mitigation: top up before submission window.

**14. Required Documentation**
- Vercel preview deployments.
- Render service logs.

**15. Required Repositories**
- Built-in only.

**16. Example Implementations**
- Top buildathon submissions ranked in the Census file: study the highest-scoring projects' demo formats.

**17. Official Resources**
- Loom / quicktime for screen capture.
- Hackquest submission portal (per buildathon rules).

---

### Phase M — Submission Package

**1. Objective**
Ship the final artifact set on time, with no missing pieces, no broken links, and a submission narrative that maps to the buildathon scoring rubric.

**2. Business Value**
The final 1% that converts everything before it into a top-ranked entry.

**3. Why Judges Care**
The submission is the only artifact the judges definitely consume. A clean, complete submission is a score multiplier.

**4. Frontend Work**
- Final pass on landing page copy and demo CTA.
- Embed the 90-second screen capture and a "Verify proofs" button.

**5. Backend Work**
- Final smoke test: every public endpoint returns 200; verifier passes.
- Lock environment variables (read-only) and document the matrix.

**6. Database Work**
- Snapshot: dump `assets`, `mandates`, `executions` (settled), `refusal_receipts`, `x402_payments`, `agent_identity` into `docs/proofs/submission-snapshot.sql`.

**7. Contract Work**
- Confirm every contract address resolves on its respective explorer; add explorer links to README.

**8. Stylus Work**
- Confirm every Stylus engine resolves on the explorer.

**9. APIs**
- Submission-time `GET /api/v1/public/proofs/pack` returns the final pack.

**10. Tests**
- Run all tests one final time.
- Run the verifier CLI against the final pack.

**11. Deployment**
- No new deployments. Lock production at a tagged release `v1.0-submission`.

**12. Acceptance Criteria**
- Submission includes: 30-second pitch, 2-minute demo video, README, proof pack URL, contract addresses, Stylus engine addresses, SDK and MCP install instructions, dual-chain proof URLs, refusal proof URL, payment proof URL, screenshot pack.
- Mainnet appears only in Future Phases.
- Every link in the submission resolves.

**13. Risks**
- *Last-minute regression*. Mitigation: tag and freeze; only roll forward via documented hotfix process.

**14. Required Documentation**
- Buildathon submission rubric and form fields.
- Hackquest submission portal.

**15. Required Repositories**
- Built-in only.

**16. Example Implementations**
- Highest-ranked Census projects' submissions (study the structure of their READMEs).

**17. Official Resources**
- Arbitrum Open House London buildathon page.
- Robinhood Chain Open House track page.

---

## Future Phases (Active Plan Defers ONLY These)

The active plan defers exactly one set of items: Arbitrum One mainnet rollout. Two additional optional phases (Indexer/Subgraph and Advanced Governance UI) are documented here as future scope, not because they are blockers, but because the active scope already covers their value through Proof API and existing governance reads.

### Future Phase 1 — Arbitrum One Mainnet Rollout

**Scope**

- Formal audit or third-party review of: `ValenSettlement`, `ValenTokenSettlementAdapter`, `ValenBudgetVault`, `ValenMandateRegistry`, `ValenIdentityResolver`, and the BudgetEngine Stylus contract.
- Role migration to multisig + timelock.
- Dedicated relayer key, separate from any user/deployer wallet.
- Explorer source-code verification on Arbiscan.
- Production Redis durability upgrade (managed Redis with persistence + replica).
- Mainnet USDC funding limits with daily caps.
- Mainnet contract deployment.
- One tiny allowed mainnet execution; one mainnet refusal receipt; mainnet proof pack update.

**Reason for deferral**

Mainnet is credibility-positive but security- and demo-risky under a buildathon deadline. Deferral protects active scope and demo reliability while keeping mainnet a 1–2 week followup post-buildathon.

### Future Phase 2 — Optional Indexer / Subgraph (Goldsky)

**Scope**

- Goldsky instant subgraph against `ValenSettlement`, `ValenPaymentLogger`, `ValenBudgetVault`, `RefusalReceiptRegistry` on Arbitrum Sepolia (slug `arbitrum-sepolia`) and Robinhood Testnet if Goldsky supports it.
- Public search page indexed by tx hash, agent slug, asset symbol.
- Analytics dashboard fed by the subgraph.

**Reason it is optional**

The Proof API + verifier CLI are sufficient for submission. The subgraph is a force multiplier we will ship after submission to make proofs searchable at scale.

### Future Phase 3 — Advanced Governance UI

**Scope**

- Proposal lifecycle UI (create → vote → queue → execute).
- Queue/execute UI for short-delay dev deployments.
- Treasury withdrawal demo with timelock countdown.

**Reason it is optional**

Current governance/timelock state is readable and execute is intentionally delayed. The active plan ships proof-grade evidence around governance reads without needing the full UI.

## Risks / Mitigations

### Too Many Pages

Risk: judges see an admin dashboard instead of the product.

Mitigation: primary nav is the six-step journey; admin pages live behind Evidence & Admin; Mission Control carries the demo.

### USDC Settlement Risk

Risk: the ERC-20 settlement adapter introduces contract or security risk.

Mitigation: keep native settlement intact; isolate token transfer in `ValenTokenSettlementAdapter`; use `SafeERC20`; keep amounts tiny in demo; proof clearly labels settlement mode.

### Robinhood Asset Risk

Risk: Robinhood testnet stock token contract addresses are not publicly stable, easily verifiable, or guaranteed to remain available.

Mitigation: registry with `support_level` field; honest UI labelling; metadata-only mode that still produces valid governance proofs without a real token transfer; faucet-based discovery script kept current.

### x402 Scope Creep

Risk: building a facilitator/merchant derails the core product.

Mitigation: VALEN is an x402 consumer only; we host (or point at) one open-source facilitator; we do not build a payment network.

### MCP / SDK Scope Creep

Risk: too many client methods and tools delay proof.

Mitigation: ship the locked 9 methods; add more only after the buildathon.

### Proof Leakage Risk

Risk: public proof endpoints accidentally expose tenant or internal data.

Mitigation: Postgres views constrain fields; schema lock test in CI; the verifier consumes only public-safe fields.

### Mainnet Risk

Risk: rushed mainnet introduces key, audit, role, relayer, or funding failures.

Mitigation: mainnet remains Future Phase only.

### Demo Reliability Risk

Risk: live demo fails on judge laptop.

Mitigation: pre-recorded 90-second screen capture + persistent proof URLs + Demo Reset button + nightly seed job.

### Dependency Drift

Risk: ERC-8004, MCP, x402 specs evolve mid-build.

Mitigation: pin versions; track upstream weekly; jsonb metadata everywhere we don't fully control the schema.

## Final Recommendation

**Product thesis:** VALEN is the USDC-first operating system for autonomous finance: identity, rules, budgets, execution, refusal, and proof for every agent action — and it is the only project in the cohort that ships every layer end-to-end across both Arbitrum Sepolia and Robinhood Testnet.

**Judge thesis:** VALEN wins by showing the complete lifecycle competitors only show in pieces — an agent is allowed, settled, refused, and proven across USDC payments and Robinhood tokenized assets — with a public proof URL for every claim and a working SDK + MCP that any judge can `npx` in seconds.

**Buildathon thesis:** Defer only Arbitrum One mainnet. Actively ship USDC-first product, complete Robinhood integration, ERC-20 token settlement adapter, BudgetEngine and ValenBudgetVault, x402 paid actions with EIP-3009 USDC settlement, ERC-8004 agent identity, MCP server + TypeScript SDK, refusal receipts, Proof Pack with verifier CLI, Mission Control cockpit, and the locked submission package.

**Execution order is non-negotiable:** A → B → C → D → E → F → G → H → I → J → K → L → M. Phases C–G cannot start until B is shipped to a Vercel preview that passes the 60-second test. Phases I–M cannot start until F and G have produced at least one allowed and one refused proof.

The plan above is the single source of truth. Every engineer, designer, and operator on VALEN executes from it without needing additional planning. Anything not in this plan is out of buildathon scope.
