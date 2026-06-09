# VALEN Recovery Analysis

**Date:** 2026-06-09  
**Environment:** WSL2 (Linux), repository at `/mnt/d/route/valen`  
**Method:** Reconstructed exclusively from repository files and live WSL verification commands. No prior chat history assumed.

---

## Executive Summary

VALEN is a monorepo with a **production-shaped NestJS backend**, **9 UUPS Solidity contracts**, and **4 Stylus engines**. Phase 5.1 completed critical Solidity audit fixes and deployed all core contracts to **Arbitrum Sepolia** and **Robinhood Testnet**. The backend API runs locally against Supabase PostgreSQL and embedded Redis.

**Primary blocker:** Stylus engines are **not deployed or registered**. `cargo stylus` is installed on WSL but **`cargo stylus check` fails** because the workspace is missing a root `Stylus.toml` and per-engine manifests use a pre–0.10.7 format. Until Stylus activation succeeds, on-chain settlement cannot validate live engines.

**Exact production readiness score: 58/100** (testnet protocol path; not mainnet-ready).

| Layer | Implementation | Integration | Tests | Deploy | Weighted readiness |
|-------|----------------|-------------|-------|--------|-------------------|
| Backend API | 85% | 45% | 5% | 40% | **62%** |
| Solidity contracts | 84% | 55% | 40% | 80% | **72%** |
| Stylus engines | 80% | 10% | 30% | 0% | **35%** |
| End-to-end flow | — | 20% | 0% | 15% | **20%** |
| DevOps / CI | 50% | — | 0% | 30% | **40%** |
| **Overall** | **~78%** | **~35%** | **~25%** | **~45%** | **58/100** |

---

## 1. Current Implementation Status

### 1.1 Monorepo structure

| Directory | Status | Notes |
|-----------|--------|-------|
| `backend/` | ✅ Complete skeleton | 12 NestJS modules, 17 repositories, BullMQ (12 queues), Privy auth, Sentry/PostHog |
| `contracts/` | ✅ Complete | 9 Solidity implementations + 13 interfaces + 3 libraries + proxy |
| `stylus/` | ✅ Source complete | 4 engines + `valen-stylus-common` crate, SDK 0.10.2 |
| `frontend/` | ⚠️ Scaffold only | Next.js app shell (`page.tsx`, layout); no dashboard flows |
| `infra/` | ⚠️ Partial | Render blueprint + docker-compose; no GitHub Actions CI |
| `scripts/` | ⚠️ Minimal | `bootstrap.ps1`, `run-migrations.mjs` only |
| `docs/` | ✅ | `summary.md` + phase reports |

### 1.2 Backend (NestJS)

**Verified from source:**

- **Modules:** auth, organizations, agents, policies, compliance, risk, settlement, audit, notifications, webhooks, admin, observability, health
- **Database:** 13 Supabase migrations (`20260101000001`–`013`) + seed + RLS
- **Queues:** intent, compliance, risk, policy, settlement, confirmation, audit, notification, vendor, indexer, maintenance, dead-letter (BullMQ-safe names with `{valen}` prefix)
- **Auth:** Privy JWT + API key guards
- **Config (`config.types.ts`):** RPC URLs for Sepolia/Robinhood only — **no contract address env vars**

**Critical integration gap:** `SettlementWorkerService.processSettlement()` writes a **synthetic tx hash** (`0x${Date.now()...}`) and never submits on-chain transactions. Backend settlement is **off-chain simulation**, not live contract integration.

```233:252:backend/src/modules/settlement/settlement.service.ts
  async processSettlement(settlementId: string): Promise<void> {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) return;
    // ...
    const txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;
    await this.settlementsRepository.updateStatus(settlementId, 'confirmed', {
      txHash,
      confirmedAt: new Date(),
    });
```

**AlchemyService bug:** Robinhood testnet (chain 46630) uses `arb-sepolia` Alchemy network slug — incorrect for Robinhood RPC.

### 1.3 Solidity contracts

**9 core contracts** (OpenZeppelin 5.x UUPS where applicable):

| Contract | Path | Phase 5.1 fixes |
|----------|------|-----------------|
| ValenRegistry | `registry/ValenRegistry.sol` | Baseline (85%) |
| ValenPolicyManager | `settlement/ValenPolicyManager.sol` | Unchanged |
| ValenMandateRegistry | `settlement/ValenMandateRegistry.sol` | MAN-01/02 fixed |
| ValenSettlement | `settlement/ValenSettlement.sol` | SET-01–07 fixed — registry-resolved engine calls, approval gate, calldata execution, scoped pauses, fee accrual |
| ValenEscrow | `escrow/ValenEscrow.sol` | Unchanged (ESC-01/02 remain) |
| ValenTreasury | `treasury/ValenTreasury.sol` | TRS-01/02 fixed |
| ValenGovernance | `governance/ValenGovernance.sol` | GOV-01/02 fixed — real timelock schedule/execute |
| ValenTimelock | `governance/ValenTimelock.sol` | OZ TimelockController wrapper |
| ValenAuditLog | `audit/ValenAuditLog.sol` | AUD-01/02 fixed |
| ValenEmergencyGuardian | `emergency/ValenEmergencyGuardian.sol` | EMG-01–03 fixed |

**Compile/tests (WSL, 2026-06-09):** `pnpm --filter @valen/contracts test` → **10 passing**.

### 1.4 Stylus engines

| Engine | Crate | Unit test | WASM build |
|--------|-------|-----------|------------|
| ComplianceEngine | `engines/compliance-engine` | ✅ | ✅ |
| RiskEngine | `engines/risk-engine` | ✅ | ✅ |
| EligibilityEngine | `engines/eligibility-engine` | ✅ | ✅ |
| PolicyEngine | `engines/policy-engine` | ✅ | ✅ |

**Phase 5.1 hardening applied:** non-zero `authorized_caller` required at init; PolicyEngine hash-only auto-pass removed.

**Stylus tests (WSL):** `cargo test` in `stylus/` → **4 engine tests pass** (328s compile on first run with rust-toolchain 1.91.0).

**SDK:** `stylus-sdk = 0.10.2`, `alloy-primitives/sol-types = 1.5.7`.

---

## 2. Current Deployment Status

### 2.1 Solidity — LIVE on both testnets

Artifacts:

- `contracts/deployments/arbitrum-sepolia/deployment.json` (chain 421614)
- `contracts/deployments/robinhood-testnet/deployment.json` (chain 46630)

Deployer: `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3`

#### Arbitrum Sepolia (421614)

| Contract | Proxy |
|----------|-------|
| ValenTimelock | `0xAe853e326bCF38f6f9131eA0f5298C88084D72bc` |
| ValenRegistry | `0x53EeC68c869E06B659A87b9e049a379ba3a5FA0F` |
| ValenPolicyManager | `0x72eB4D7e57D4b582c5B05d255c1faE723507a03d` |
| ValenMandateRegistry | `0xC3B422d77aBE0B7D3c8930d7f1FCFCa4657d41F2` |
| ValenSettlement | `0x993622D55Ea095aB71165Caf191B21E6e3A71D4A` |
| ValenTreasury | `0x094B10D817f4603e9a4734B52c4c7A1Bf389658D` |
| ValenEscrow | `0x485eba92e9Bf0e035216726A0EC194dd397311BC` |
| ValenGovernance | `0xF7623E69a21ad43f3678a9FA2bA931e59f7F1574` |
| ValenAuditLog | `0xBe1b5F1055C21D715185612947f681059B585cEE` |
| ValenEmergencyGuardian | `0x3424a2ea234Ba819FceF1Beea32Ab39C42e235d9` |

#### Robinhood Testnet (46630)

| Contract | Proxy |
|----------|-------|
| ValenTimelock | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` |
| ValenRegistry | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` |
| ValenPolicyManager | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |
| ValenMandateRegistry | `0x3122B8446044E87A683C1104dc80f32d3Eb28CE4` |
| ValenSettlement | `0x91CdD9a481C732bEB09Ce039da23DC11e83547a4` |
| ValenTreasury | `0xd9aDaab0E9660777B979D4C44294bE07E10470c8` |
| ValenEscrow | `0xf88690425201906eDcA2CDe0427055590eDfDc20` |
| ValenGovernance | `0x8c263B12e0d511e5a612b4090cFEa0c758A2af6b` |
| ValenAuditLog | `0x21EC2E12865b5a307A3708ACbA85f2FE2a98B8BF` |
| ValenEmergencyGuardian | `0xb6a36B53E46A0D9ee3c1D589e936b0214aFA9303` |

**Post-deploy checks:** `post-deploy-check.ts` run successfully per `PHASE5_1_COMPLETION_REPORT.md`.

**Not done:** Explorer verification (`verify.ts` — no API key). Engine registration (`register-engines.ts` — blocked on Stylus addresses).

### 2.2 Stylus — NOT deployed

- `stylus/deployments/arbitrum-sepolia/` — `.gitkeep` only
- `stylus/deployments/robinhood-testnet/` — `.gitkeep` only
- No `engines.json`, no ABI exports in `stylus/abi/`

### 2.3 Backend — local runtime only

Per `docs/summary.md`:

- API health endpoints verified (`/health/live`, `/health/ready`)
- Supabase pooler connected (IPv4)
- Redis via `redis-memory-server`
- **Not deployed** to Render/production Redis

### 2.4 Environment files (gitignored, referenced in docs)

| File | Purpose |
|------|---------|
| `backend/.env` | API, DB, Redis, Privy, Alchemy |
| `contracts/.env` | Hardhat deploy keys + RPC |
| `stylus/.env` | Stylus deploy keys + RPC |

---

## 3. Current Stylus Status

| Step | Status | Evidence |
|------|--------|----------|
| Source code | ✅ | 4 engines compile |
| `cargo test` | ✅ | 4/4 pass |
| `cargo build --release --target wasm32-unknown-unknown` | ✅ | Per Phase 5.1 report |
| `cargo stylus --version` | ✅ | `stylus 0.10.7` on WSL |
| `cargo stylus check` | ❌ | `missing Stylus.toml` at workspace root |
| `cargo stylus export-abi` | ❌ | Same manifest requirement |
| `cargo stylus deploy` | ❌ | Same manifest requirement |
| On-chain activation | ❌ | No deployment artifacts |

**Root cause (verified against `cargo-stylus` 0.10.7 source):**

1. `Workspace::current()` requires `stylus/Stylus.toml` at the Cargo workspace root — **file does not exist**.
2. Per-engine `Stylus.toml` files use legacy `[project]` format; cargo-stylus 0.10.7 expects `[workspace]`, `[workspace.networks]`, and `[contract]` sections per official templates.
3. Engine manifests use **CRLF line endings** (Windows-origin); should be normalized to LF for Linux tooling.
4. `stylus/rust-toolchain.toml` pins **1.91.0**; default rustup toolchain is **nightly 1.98.0** — version drift on each command.

**Previous Windows blocker (resolved on WSL):** `cargo-stylus` failed to compile on Windows due to `std::os::unix::net` in `debug_hook.rs`. WSL has a working binary.

---

## 4. Remaining Blockers

| Priority | Blocker | Impact |
|----------|---------|--------|
| P0 | Missing/incorrect Stylus.toml manifests | Cannot check, export ABI, deploy, or activate engines |
| P0 | No Stylus deployment artifacts | `register-engines.ts` cannot run |
| P0 | Engines not registered in ValenRegistry | Settlement `_validateEngines()` cannot resolve live engine addresses |
| P1 | Backend settlement worker uses fake tx hashes | No real Agent→Settlement on-chain path |
| P1 | Backend lacks contract address configuration | Cannot target deployed proxies |
| P1 | Engine `authorized_caller` must be set to settlement proxy post-deploy | Init requires non-zero caller |
| P2 | Explorer verification not run | Testnet contracts unverified |
| P2 | Escrow not wired to settlement (ESC-02) | Escrow integration incomplete |
| P2 | No CI/CD pipeline | Manual deploy/test only |
| P3 | Admin EOA holds all privileged roles | Centralization; timelock not sole admin |
| P3 | 90% coverage target not met | Assurance gap for mainnet |

---

## 5. Remaining Work

### Immediate (unblocks testnet E2E)

1. Fix Stylus workspace manifests for cargo-stylus 0.10.7
2. Run `cargo stylus check`, `export-abi`, `deploy` for all 4 engines on Sepolia + Robinhood
3. Initialize each engine with `authorized_caller = ValenSettlement` proxy address
4. Run `register-engines.ts` on both networks
5. Execute full on-chain settlement validation (Hardhat/script or fixed backend worker)

### Short-term

6. Wire backend env with deployed contract addresses + settlement signer
7. Replace stub `processSettlement` with viem/ethers contract calls
8. Add missing Solidity test suites (5 of 9 still missing per original audit)
9. Run `verify.ts` with explorer API keys
10. Export and commit Stylus ABIs; verify Solidity↔Stylus ABI alignment

### Medium-term

11. Frontend dashboard (Privy login, org pages, approvals)
12. Production Redis (Upstash/Render) + worker/scheduler deployment
13. Fuzz/invariant tests + external audit
14. Bootstrap roles to multisig/timelock
15. CI GitHub Actions (compile, test, stylus check, coverage)

---

## 6. Missing Tests

### Solidity (Phase 3 spec: 9 suites)

| Test file | Exists | Tests |
|-----------|--------|-------|
| ValenRegistry.test.ts | ✅ | 2 |
| ValenMandateRegistry.test.ts | ✅ | 2 |
| ValenTreasury.test.ts | ✅ | 2 |
| ValenAuditLog.test.ts | ✅ | 2 |
| ValenEmergencyGuardian.test.ts | ✅ | 2 |
| ValenPolicyManager.test.ts | ❌ | 0 |
| ValenSettlement.test.ts | ❌ | 0 |
| ValenEscrow.test.ts | ❌ | 0 |
| ValenGovernance.test.ts | ❌ | 0 |

**Solidity test coverage: ~44% of required suites (4/9), 10 total test cases.**

**Missing high-value tests:**

- Settlement engine integration (with deployed or forked Stylus)
- Governance timelock schedule/execute/cancel
- Escrow deposit/lock/release + native ETH path
- PolicyManager publish/freeze lifecycle
- Registry engine registration/deprecation
- UUPS upgrade path validation

### Stylus

| Test type | Status |
|-----------|--------|
| Unit (TestVM) | ✅ 1 per engine |
| Fuzz / adversarial | ❌ |
| `cargo stylus check` CI | ❌ |
| WASM size-limit | ❌ |
| Deployed contract integration | ❌ |

### Backend

| Test type | Status |
|-----------|--------|
| Unit (`*.spec.ts`) | ❌ None found in `backend/src` |
| E2E (`test/jest-e2e.json`) | ❌ Not exercised |
| Queue processor integration | ❌ |
| On-chain settlement | ❌ |

---

## 7. Missing Integrations

| Integration | Expected | Actual |
|-------------|----------|--------|
| Registry → engine addresses | Settlement resolves engines via `getEngine()` | ✅ Solidity code fixed; ❌ no engines registered |
| Settlement → Stylus engines | Live `evaluate`/`calculate`/`check` calls | ✅ Code path exists; ❌ blocked without deployed engines |
| Backend → contracts | Submit/approve/execute settlement txs | ❌ Stub worker only |
| Backend → Stylus | Off-chain pre-checks mirroring engines | ⚠️ Services exist; not wired to chain |
| Escrow ↔ Settlement | Lock/release on execute | ❌ ESC-02 open |
| Treasury ↔ Settlement | Fee accrual | ✅ Fixed in Solidity; backend doesn't call it |
| Audit ↔ Settlement | Commitment cross-check | ⚠️ Partial |
| Contract addresses → backend env | After deploy | ❌ Not configured |
| Stylus ABI → contracts interfaces | Exported ABI alignment | ❌ Unverified |
| Alchemy → Robinhood | Correct network slug | ❌ Uses arb-sepolia for 46630 |
| Frontend → API | Dashboard flows | ❌ Scaffold only |

---

## 8. Scripts Inventory

### Contracts (`contracts/script/`)

| Script | Purpose | Status |
|--------|---------|--------|
| `lib/deploy-valen.ts` | Full UUPS deployment | ✅ Used |
| `deploy-sepolia.ts` | Sepolia entry | ✅ Deployed |
| `deploy-robinhood-testnet.ts` | Robinhood entry | ✅ Deployed |
| `deploy-local.ts` | Local deploy | ✅ Stub removed |
| `post-deploy-check.ts` | Registry/chain smoke | ✅ Pass |
| `register-engines.ts` | Register Stylus in registry | ⏳ Pending engines.json |
| `verify.ts` | Block explorer verify | ⏳ Not run |
| `check-balance.ts` | Deployer balance | ✅ Funded |

### Stylus (`stylus/script/`)

| Script | Purpose | Status |
|--------|---------|--------|
| `build-all.sh` | WASM release build | ✅ |
| `export-abi.sh` | ABI export via cargo stylus | ❌ Blocked |
| `activate-stylus.sh` | check + deploy all engines | ❌ Blocked |

### Ops (`scripts/`)

| Script | Purpose |
|--------|---------|
| `local/bootstrap.ps1` | Windows local startup |
| `ops/run-migrations.mjs` | Migration wrapper |

**Missing:** E2E validation script, engine init script (set `authorized_caller`), backend contract wiring script.

---

## 9. Production Readiness Score (Exact)

### Component scores

| Component | Score (/100) | Rationale |
|-----------|-------------|-----------|
| Backend API surface | 72 | Full REST + queues; settlement stub |
| Backend production ops | 45 | Local Redis; no prod deploy |
| Solidity implementation | 84 | Phase 5.1 critical fixes applied |
| Solidity testnet deploy | 80 | Both networks live |
| Solidity assurance | 40 | 10 tests; no fuzz/invariant |
| Stylus implementation | 80 | Code + unit tests complete |
| Stylus deploy/activate | 0 | No artifacts |
| On-chain integration | 35 | Settlement code ready; engines missing |
| Backend↔chain integration | 15 | Fake tx hashes |
| Frontend | 10 | Scaffold only |
| DevOps/CI | 40 | Render blueprint; no Actions |
| Security assurance | 35 | Self-audit only; admin EOA risks |
| Governance hardening | 55 | Timelock wired; roles on EOA |

### Weighted overall

```
(72×0.15 + 84×0.20 + 80×0.10 + 40×0.10 + 80×0.10 + 0×0.10 + 35×0.10 + 15×0.05 + 10×0.05 + 40×0.03 + 35×0.02) ≈ 58
```

### **Exact production readiness score: 58/100**

Interpretation:

- **Testnet Solidity protocol:** ~72/100 — contracts deployed and hardened; engines and registration pending
- **Full VALEN product (backend + frontend + chain):** ~45/100 — backend settlement not on-chain
- **Mainnet readiness:** **Not approved** — requires Stylus activation, engine registration, expanded tests, third-party audit, role migration to timelock/multisig

---

## 10. Recommended Recovery Sequence

1. **WSL Stylus toolchain fix** — workspace + contract `Stylus.toml`, rust-toolchain alignment
2. **Deploy + initialize 4 engines** on Sepolia and Robinhood → `stylus/deployments/*/engines.json`
3. **Register engines** via `register-engines.ts`
4. **On-chain E2E script** — policy publish → engine eval → settlement submit/approve/execute → audit
5. **Backend wiring** — contract addresses, real settlement worker, fix Alchemy chain mapping
6. **Assurance pass** — missing tests, verify.ts, POST_STYLUS_AUDIT.md

---

*This document reflects repository state as of 2026-06-09 WSL verification. Update after each recovery task.*
