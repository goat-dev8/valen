# VALEN Phase A Baseline Lock

Generated: 2026-06-13

Phase A objective: freeze the proven baseline as a judge-readable, demoable, regression-free starting point. This file records what exists before Phase B starts. It does not create new product behavior.

## Baseline Status

Current state is production-shaped and dual-chain:

- Frontend route tree exists under `frontend/src/app`.
- Render backend is live at `https://valen-api-m3g4.onrender.com`.
- Supabase database is reachable from the backend environment.
- Redis/Valkey is reachable from Render readiness checks.
- Solidity deployments exist on Arbitrum Sepolia (`421614`) and Robinhood Testnet (`46630`).
- Four Stylus engines are deployed and activated on both chains.
- Native legacy settlement path is proven.
- Refusal receipts, public Proof API, Proof Pack, USDC budget, token settlement, x402, ERC-8004, SDK, and MCP are not yet active implementation. They start in later phases.

## Live Health Verification

Actual production health routes are not `/api/v1/health`; they are:

- `GET https://valen-api-m3g4.onrender.com/health/live` -> `200`
- `GET https://valen-api-m3g4.onrender.com/health/ready` -> `200`
- `GET https://valen-api-m3g4.onrender.com/health/deep` -> `200`

Latest observed readiness:

- Process: `ok`
- Database: `ok`
- Redis: `ok`

## Proof Endpoint Gap

The Phase A plan expected these public endpoints to exist:

- `GET /api/v1/proofs/executions/:id`
- `GET /api/v1/proofs/refusals/:id`
- `GET /api/v1/proofs/pack`

Production currently returns `404` for those routes. This is a real Phase A baseline gap, not hidden. Phase I must implement the public Proof API and Proof Pack. Until then, proof evidence comes from:

- Supabase execution/settlement rows in `docs/proofs/phase-a-db-baseline.json`.
- On-chain tx hashes in those rows.
- Contract reports in `contracts/reports/e2e-*.json`.
- Deployment manifests in `contracts/deployments/*/deployment.json`.
- Stylus engine manifests in `stylus/deployments/*/engines.json`.

## Baseline Executions

The two canonical execution IDs from `MASTER_EXECUTION_PLAN.md` are present in Supabase and are both executed/confirmed:

| Chain | Execution ID | Mandate ID | Asset | Value | Settlement Status | Tx Hash | Block |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Arbitrum Sepolia `421614` | `d872b0a7-e7de-4a86-887b-b6ac682c7173` | `6ef127ee-c1f2-494a-ba3a-fee940623242` | native legacy (`null`) | `1000000000000000` wei | `confirmed` | `0x02eaa3d90a289a1bc9a63a2a96b8d9beb18f2c2a07625261fdb7975a16b81bed` | `276595222` |
| Robinhood Testnet `46630` | `7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c` | `aab33461-c700-4df7-bbc2-742019d49354` | `TSLA` metadata / native legacy settlement | `1000000000000000` wei | `confirmed` | `0x200a90a225d6ddb73705174b2367afca9357831c5e70a604ef38e9265b5c1f30` | `74414881` |

Latest DB snapshot also found 20 recent executed/confirmed rows. See `docs/proofs/phase-a-db-baseline.json`.

## Database Snapshot

`docs/proofs/phase-a-db-baseline.json` was generated from Supabase via the backend environment without writing any secret values.

Counts at snapshot time:

- `executions`: 36
- `settlements`: 30
- `audit_logs`: 1808
- `mandates`: 4
- `agent_wallets`: 3
- `wallet_verifications`: 3
- `refusal_receipts`: `table_missing`

Status model:

- Execution complete state: `executed`
- Settlement complete state: `confirmed`
- There is no current enum value named `settled`; future docs and code should use the deployed status model until a migration changes it.

Schema snapshot:

- `docs/proofs/baseline-schema.sql`
- Generated through `information_schema` and `pg_indexes` because `pg_dump` is not installed in the local tool environment.

## Contract Deployment Lock

Deployment manifests:

- `contracts/deployments/arbitrum-sepolia/deployment.json`
- `contracts/deployments/robinhood-testnet/deployment.json`

Bytecode verification artifact:

- `docs/proofs/phase-a-chain-verification.json`

Verification method:

- `viem getCode` through backend RPC configuration.
- Secrets were not written to disk.

Observed result:

- Arbitrum Sepolia: 17 contract/proxy/implementation addresses had bytecode, plus 4 Stylus engines.
- Robinhood Testnet: 17 contract/proxy/implementation addresses had bytecode, plus 4 Stylus engines.

## Stylus Engine Lock

Arbitrum Sepolia engines:

- ComplianceEngine `0xf6d515f09b1e14adb891c72605e1df12c7f5db6b`
- RiskEngine `0x8eb252ff6f05b1ee767bb816e5786ad72e5b4073`
- EligibilityEngine `0x03e00644c2bbb45ab4566e34c30929dd017ee5bd`
- PolicyEngine `0x3eb88dde893288faea417b413a55a5b4d3256108`

Robinhood Testnet engines:

- ComplianceEngine `0x2c1db0c436b72d94a4112f321dfbd13a976d8831`
- RiskEngine `0xae57003e42e3548a9d39cd55bcdfac04363b1d63`
- EligibilityEngine `0x1f3fb438824140b7e1125502f80b686d95072939`
- PolicyEngine `0xe1ae5ec5b4416e7d725981946e11af0a44bf4ecd`

## Frontend Route Classification

Primary routes:

| Route | Classification | Notes |
| --- | --- | --- |
| `/` | Primary | Marketing landing / first impression. |
| `/login` | Primary | Wallet/auth entry. |
| `/onboarding` | Primary | New-user setup. |
| `/dashboard` | Primary | Mission Control. |
| `/dashboard/register-agent` | Primary | Create agent. |
| `/dashboard/agents` | Primary | Agent list. |
| `/dashboard/agents/[agentId]` | Primary | Agent detail. |
| `/dashboard/policies` | Primary | Rules list. |
| `/dashboard/policies/new` | Primary | Create rules. |
| `/dashboard/policies/[policyId]` | Primary | Rule detail. |
| `/dashboard/wallets` | Primary | Fund and authority. |
| `/dashboard/executions` | Primary | Execution history. |
| `/dashboard/executions/new` | Primary | Intent builder. |
| `/dashboard/executions/[executionId]` | Primary | Execution detail. |
| `/dashboard/executions/[executionId]/proof` | Primary | Current proof surface until public Proof API ships. |
| `/dashboard/demo/robinhood-tsla` | Primary | Robinhood headline path, currently TSLA-specific. |

Evidence/Admin routes:

| Route | Classification | Notes |
| --- | --- | --- |
| `/dashboard/approvals` | Evidence/Admin | Approval operations and evidence. |
| `/dashboard/settlements` | Evidence/Admin | Settlement operational evidence. |
| `/dashboard/compliance` | Evidence/Admin | Compliance checks. |
| `/dashboard/audit` | Evidence/Admin | Audit log evidence. |
| `/dashboard/governance` | Evidence/Admin | Governance reads/lab. |
| `/dashboard/treasury` | Evidence/Admin | Treasury reads/lab. |
| `/dashboard/contracts` | Evidence/Admin | Contract addresses and manifests. |
| `/dashboard/webhooks` | Evidence/Admin | Integration/admin surface. |
| `/dashboard/team` | Evidence/Admin | Organization admin. |
| `/dashboard/settings` | Evidence/Admin | App/admin settings. |

## Historical Failed Executions

Old failed or stuck executions must be labelled as historical pre-fix runs. They are valuable engineering evidence but should not be shown as current product failures during judge flow.

Current recommended label:

> Historical pre-fix run: kept for audit continuity, not representative of current baseline.

## Phase A Artifacts

- `docs/proofs/PHASE_A_BASELINE_LOCK.md`
- `docs/proofs/PROOF_PACK.md`
- `docs/proofs/phase-a-db-baseline.json`
- `docs/proofs/baseline-schema.sql`
- `docs/proofs/phase-a-chain-verification.json`
- `docs/proofs/baseline-test-output.txt` (written after test run)

## Phase A Blockers / Gaps To Carry Forward

- Public Proof API and Proof Pack endpoints return `404`; Phase I must implement them.
- `refusal_receipts` table is missing; Phase I must add it, while Phase D/F/G need to generate receipts once the module exists.
- `pg_dump`, `psql`, and `cast` are not installed locally; Phase A used Node/pg and viem equivalents.
- Phase A does not deploy anything. Later phases must not treat this baseline lock as a deployment.

