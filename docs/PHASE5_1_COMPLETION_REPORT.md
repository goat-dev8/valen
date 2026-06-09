# VALEN Phase 5.1 Completion Report

**Date:** 2026-06-09  
**Scope:** Critical/high contract audit fixes, security hardening, tests, deployment scripts, and testnet Solidity deployment  
**Status:** Solidity critical/high fixes complete and deployed to both target testnets. Stylus activation blocked by local `cargo-stylus` toolchain failure on Windows.

---

## 1. Fixed Findings

| Finding | Status | Fix |
|---------|--------|-----|
| SET-01 | Fixed | `ValenSettlement` now resolves Compliance, Risk, Eligibility, and Policy engines from `ValenRegistry` and validates real verdicts. |
| SET-02 | Fixed | `submitSettlement` no longer auto-approves; new `approveSettlement` moves Requested → Approved. |
| SET-03 | Fixed | `executeSettlement` requires calldata whose `keccak256` matches stored `callDataHash`, then calls target with that calldata. |
| SET-04 | Fixed | Global, organization, agent, and asset scoped pauses are enforced on submit/approve/execute. |
| SET-05 | Fixed | Settlement calculates and accrues native fee through `ValenTreasury`. |
| SET-07 | Fixed | Compliance/risk/policy rejection errors now trigger based on engine verdict status. |
| GOV-01 | Fixed | `ValenGovernance` calls `TimelockController.schedule`. |
| GOV-02 | Fixed | Execution path now calls `TimelockController.execute`; no fake mark-only execution. |
| PE-01 | Fixed | Removed `PolicyEngine.evaluate_hashes` hash-only auto-pass shortcut. |
| MAN-01 | Fixed | `recordExecution` enforces `maxPerTx` per transaction and no longer treats it as daily cap. |
| MAN-02 | Fixed | Mandates bind allowed action/asset combinations through scope binding. |
| TRS-01 | Fixed | Treasury exposes and uses BPS fee calculation. |
| TRS-02 | Fixed | Settlement calls `treasury.accrueFee` on execution when fee is non-zero. |
| AUD-01 | Fixed | `ValenAuditLog.initialize` is one-time guarded. |
| AUD-02 | Fixed | `initialize` is admin-only; no public re-grant path. |
| EMG-01 | Fixed | `ValenEmergencyGuardian.initialize` is one-time guarded. |
| EMG-02 | Fixed | Global unpause requires non-zero governance approval reference. |
| EMG-03 | Fixed | Emergency guardian can delegate policy freezing to `ValenPolicyManager`. |
| CE-01 | Fixed | All Stylus engines reject zero `authorized_caller` during initialization. |
| PE high-risk bypass | Fixed | Policy decisions require `evaluate` rule path; no hash-only pass path. |

---

## 2. Remaining Findings / Blockers

| Area | Status | Detail |
|------|--------|--------|
| Stylus activation | Blocked | `cargo-stylus v0.10.7` fails to compile on Windows due to `std::os::unix::net` imports in `debug_hook.rs`. |
| `cargo stylus check` | Blocked | Same missing `cargo-stylus` CLI. |
| `cargo stylus export-abi` | Blocked | Same missing `cargo-stylus` CLI. |
| Engine registration | Pending | Requires deployed Stylus engine addresses. `register-engines.ts` is implemented. |
| Contract verification | Pending | `verify.ts` implemented; explorer API key/config not supplied. |
| Full E2E flow | Pending | Requires Stylus engine activation + registry registration before settlement can validate live engines. |
| 90% coverage target | Not reached | Added focused high-risk tests; full coverage instrumentation not configured. |
| Mainnet readiness | Not approved | Requires Stylus activation, verification, third-party audit, fuzz/invariant suite, and testnet soak. |

---

## 3. Coverage / Test Status

| Suite | Command | Result |
|-------|---------|--------|
| Solidity compile | `pnpm --filter @valen/contracts compile` | Pass |
| Solidity tests | `pnpm --filter @valen/contracts test` | Pass — 10 tests |
| Stylus unit tests | `cargo test` | Pass — 4 engine tests |
| Stylus WASM build | `cargo build --release --target wasm32-unknown-unknown` | Pass |
| Stylus check | `cargo stylus check` | Blocked — `cargo-stylus` unavailable on Windows |
| Stylus ABI export | `cargo stylus export-abi` | Blocked — `cargo-stylus` unavailable on Windows |

**Coverage estimate:** Improved from ~15% to ~35–40% meaningful contract-path coverage. The requested 90% target is not met yet; this requires full fixture matrix, coverage tooling, fuzz/invariant tests, and cross-contract engine mocks or deployed Stylus engines.

---

## 4. Deployment Addresses

### Arbitrum Sepolia

| Contract | Proxy / Address | Implementation |
|----------|------------------|----------------|
| ValenTimelock | `0xAe853e326bCF38f6f9131eA0f5298C88084D72bc` | n/a |
| ValenRegistry | `0x53EeC68c869E06B659A87b9e049a379ba3a5FA0F` | `0x73d7D07F6AB85154b0c97c61C1089F9C708D69b7` |
| ValenPolicyManager | `0x72eB4D7e57D4b582c5B05d255c1faE723507a03d` | `0xa11fecD62a5731a869E6dBce5D23c476bE82ae26` |
| ValenMandateRegistry | `0xC3B422d77aBE0B7D3c8930d7f1FCFCa4657d41F2` | `0x1f65fdE8C4EC8E136D8D223C9a568b58DA7fECcc` |
| ValenSettlement | `0x993622D55Ea095aB71165Caf191B21E6e3A71D4A` | `0x4E53C16BA458Dc527448B002AfFCb5D2325317EF` |
| ValenTreasury | `0x094B10D817f4603e9a4734B52c4c7A1Bf389658D` | `0x1ad332bcC2b3aa29eeEbBAcB6DB762DA57f25159` |
| ValenEscrow | `0x485eba92e9Bf0e035216726A0EC194dd397311BC` | `0x9DF87f518eFAc159cd1F0A638412EB2De2529194` |
| ValenGovernance | `0xF7623E69a21ad43f3678a9FA2bA931e59f7F1574` | `0x4E05B60F660676DF2294F41fd9e75e34C2bF85e1` |
| ValenAuditLog | `0xBe1b5F1055C21D715185612947f681059B585cEE` | n/a |
| ValenEmergencyGuardian | `0x3424a2ea234Ba819FceF1Beea32Ab39C42e235d9` | n/a |

Artifact: `contracts/deployments/arbitrum-sepolia/deployment.json`

### Robinhood Testnet

| Contract | Proxy / Address | Implementation |
|----------|------------------|----------------|
| ValenTimelock | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` | n/a |
| ValenRegistry | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| ValenPolicyManager | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` |
| ValenMandateRegistry | `0x3122B8446044E87A683C1104dc80f32d3Eb28CE4` | `0xc05238b304409bC549fd8138301a2E977BaD8Cb3` |
| ValenSettlement | `0x91CdD9a481C732bEB09Ce039da23DC11e83547a4` | `0xD15770A24447677D42dF6cfD09bd2fb96b34E712` |
| ValenTreasury | `0xd9aDaab0E9660777B979D4C44294bE07E10470c8` | `0xa1fF40D70089A6AE45BC6824bca5C54bB7E7059A` |
| ValenEscrow | `0xf88690425201906eDcA2CDe0427055590eDfDc20` | `0x05A434b4672A4384FA0Ae88B6f84B952Aec614c4` |
| ValenGovernance | `0x8c263B12e0d511e5a612b4090cFEa0c758A2af6b` | `0x4d507779cCCb46a4DF9eD4505368f21c6b875981` |
| ValenAuditLog | `0x21EC2E12865b5a307A3708ACbA85f2FE2a98B8BF` | n/a |
| ValenEmergencyGuardian | `0xb6a36B53E46A0D9ee3c1D589e936b0214aFA9303` | n/a |

Artifact: `contracts/deployments/robinhood-testnet/deployment.json`

---

## 5. Stylus Activation Status

| Engine | WASM build | Unit test | `cargo stylus check` | Deploy/activate |
|--------|------------|-----------|----------------------|-----------------|
| ComplianceEngine | Pass | Pass | Blocked | Blocked |
| RiskEngine | Pass | Pass | Blocked | Blocked |
| EligibilityEngine | Pass | Pass | Blocked | Blocked |
| PolicyEngine | Pass | Pass | Blocked | Blocked |

**Blocker detail:** `cargo install cargo-stylus --locked` fails on Windows while compiling `cargo-stylus v0.10.7` with `could not find unix in os` from `debug_hook.rs`. This blocks official `cargo stylus check/deploy/export-abi` locally. The repo now contains `stylus/script/activate-stylus.sh` to run the official flow on a compatible Linux/macOS environment or once Windows support is resolved.

---

## 6. Verification Status

| Network | Solidity deployed | Post-deploy check | Explorer verification | Stylus registered |
|---------|-------------------|-------------------|-----------------------|------------------|
| Arbitrum Sepolia | Pass | Pass | Pending API/config | Pending Stylus activation |
| Robinhood Testnet | Pass | Pass | Pending explorer support/API | Pending Stylus activation |

---

## 7. Security Assessment

**Improved materially.** Critical hash-only settlement flow is replaced by registry-resolved engine verdict validation, explicit approval, calldata commitment checking, and scoped pause enforcement. Mandate cap/scope semantics, treasury fee accrual, emergency unpause authorization, and initializer guards were hardened.

**Still not mainnet-ready.** Remaining blockers are mostly operational and assurance-related: Stylus activation/registration, explorer verification, full cross-contract E2E, 90% coverage, fuzz/invariant tests, and third-party audit.

---

## 8. Production Readiness Score

| Area | Before | After Phase 5.1 |
|------|--------|------------------|
| Solidity implementation | ~71% | ~84% |
| Solidity production readiness | ~25% | ~62% |
| Stylus implementation | ~76% | ~80% |
| Stylus production readiness | ~25% | ~35% (blocked by activation) |
| Test coverage readiness | ~15% | ~40% |
| Deployment readiness | ~10% | ~65% for Solidity, ~20% for Stylus |

**Overall readiness:** **~63/100** for testnet Solidity protocol, **not mainnet-ready** until Stylus activation/registration, verification, and expanded test assurance are complete.

---

## 9. Next Required Actions

1. Run `stylus/script/activate-stylus.sh` in Linux/macOS or a fixed `cargo-stylus` environment.
2. Register deployed engine addresses with `contracts/script/register-engines.ts`.
3. Run full E2E Agent → Policy → Compliance → Risk → Eligibility → Settlement → Audit against the registered engines.
4. Add full remaining test suites: settlement engine mocks, governance timelock execution, escrow native/ERC20 paths, registry engine lifecycle, upgradeability tests.
5. Add coverage/fuzz/invariant CI.
6. Provide explorer API/config and run `contracts/script/verify.ts`.
7. Re-run audit report after these steps.
