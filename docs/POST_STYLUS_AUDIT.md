# Post-Stylus Audit Report

**Date:** 2026-06-09  
**Scope:** Repository state after WSL recovery, Stylus toolchain fix, engine deployment, registry registration, and live E2E validation  
**Method:** File review + executed on-chain validation (no third-party audit)

---

## Production Readiness Score

| Dimension | Before recovery | After Stylus integration | Weight |
|-----------|-----------------|--------------------------|--------|
| Solidity implementation | 84% | 84% | 20% |
| Solidity testnet deploy | 80% | 80% | 10% |
| Stylus implementation | 80% | 85% | 10% |
| Stylus deploy/activate | 0% | **90%** | 15% |
| On-chain engine integration | 10% | **85%** | 20% |
| Test coverage | 40% | 45% | 10% |
| Backend↔chain integration | 15% | 15% | 10% |
| DevOps/CI | 40% | 45% | 5% |

### **Exact production readiness score: 72/100**

Interpretation:
- **Testnet on-chain protocol (Solidity + Stylus + registry + E2E):** ~**78/100**
- **Full product (backend + frontend + production ops):** ~**52/100**
- **Mainnet readiness:** **Not approved** (~45/100 for mainnet gate)

---

## What Changed Since CONTRACT_AUDIT_REPORT.md

| Item | Prior status | Current status |
|------|--------------|----------------|
| Stylus deployment | Blocked (Windows) | ✅ Deployed both testnets |
| Engine registration | Pending | ✅ Registered in ValenRegistry |
| Settlement → Stylus calls | Code fixed, untested live | ✅ E2E verified on-chain |
| ABI alignment | Unverified | ✅ Fixed + validated live |
| `cargo stylus check/export/deploy` | Blocked | ✅ Operational on WSL |
| E2E flow | Pending | ✅ PASS both networks |

---

## Remaining Blockers

### P0 — Before production backend integration

| Blocker | Detail |
|---------|--------|
| Backend settlement worker | Still writes fake tx hashes; must call `ValenSettlement` on-chain |
| Contract addresses in backend env | Not configured in `config.types.ts` |
| Robinhood Alchemy slug | `AlchemyService` uses `arb-sepolia` for chain 46630 |

### P1 — Before mainnet

| Blocker | Detail |
|---------|--------|
| Explorer verification | `verify.ts` not run (no API key) |
| Third-party security audit | Not performed |
| Fuzz/invariant tests | Missing |
| Role bootstrap | Admin EOA holds privileged roles; should migrate to timelock/multisig |
| Escrow integration (ESC-02) | Settlement does not use escrow paths |
| Missing Solidity suites | PolicyManager, Settlement, Escrow, Governance tests still absent |
| CI/CD | No GitHub Actions for stylus check + contract tests |
| Production Redis | Local embedded only |

### P2 — Quality / ops

| Blocker | Detail |
|---------|--------|
| Stylus reproducible deploy | Using `--no-verify` (no Docker) — verification on Arbiscan may differ |
| Engine cache bids | Not submitted (`cargo stylus cache bid`) |
| 90% coverage target | Not met (~45% meaningful coverage) |
| Frontend | Scaffold only |

---

## Security Concerns

| ID | Severity | Finding |
|----|----------|---------|
| SEC-01 | High | Backend settlement simulation could mask production failures |
| SEC-02 | High | Admin EOA controls registry, mandate, policy, settlement roles |
| SEC-03 | Medium | Engine `authorized_caller` pinned to settlement — correct, but init is permissionless once per engine |
| SEC-04 | Medium | No on-chain upgrade validation CI for UUPS contracts |
| SEC-05 | Medium | Policy/compliance logic remains hash-heuristic in Stylus eval (documented limitation) |
| SEC-06 | Low | Multiple redeployed engine addresses on Sepolia from iteration — registry updated to latest |
| SEC-07 | Low | `.env` CRLF could break tooling (mitigated in hardhat.config.ts) |

**Positive:** Live E2E confirms settlement **does** invoke Stylus engines and rejects invalid mandates (verified `MandateNotFound` during debugging).

---

## Mainnet Blockers

1. External security audit + remediation
2. Full test matrix (9 Solidity suites + Stylus integration CI)
3. Multisig/timelock role migration
4. Backend on-chain settlement integration
5. Explorer verification of Solidity + Stylus (reproducible builds)
6. Production infra (Redis, monitoring, incident runbooks)
7. Escrow/treasury full-path integration tests
8. Testnet soak period with real agent traffic

---

## Missing Coverage

### Solidity tests (still missing dedicated suites)

- `ValenPolicyManager.test.ts`
- `ValenSettlement.test.ts` (on-chain engine fork tests)
- `ValenEscrow.test.ts`
- `ValenGovernance.test.ts`

### Stylus tests

- No `cargo stylus check` in CI
- No WASM size-limit regression tests
- No adversarial/fuzz tests for eval modules

### Backend tests

- Zero unit tests (`*.spec.ts`)
- No queue processor integration tests
- No API E2E against live contracts

---

## Missing Integrations

| Integration | Status |
|-------------|--------|
| Registry → Settlement → Stylus | ✅ Live verified |
| Backend → Settlement contract | ❌ Stub worker |
| Backend → engine pre-checks | ❌ Not wired |
| Frontend → API | ❌ Scaffold |
| Stylus ABI → committed artifacts | ✅ `stylus/abi/*.sol` |
| Contract verify on explorers | ❌ Pending |

---

## Recommendations (Priority Order)

1. Wire backend settlement worker to deployed `ValenSettlement` using viem + env contract map
2. Add GitHub Actions: `cargo stylus check`, `pnpm --filter @valen/contracts test`, `cargo test`
3. Add `ValenSettlement.test.ts` fork tests against Sepolia engines
4. Run `verify.ts` with explorer API keys
5. Migrate admin roles to timelock/multisig
6. Schedule third-party audit before mainnet

---

## Conclusion

Stylus is **fully operational on WSL** and **integrated with live testnet settlement**. Production readiness improved from **~58/100** (recovery analysis) to **~72/100** for the on-chain protocol layer. The product is **testnet-ready for on-chain demonstration** but **not mainnet-ready** until backend integration, expanded tests, role hardening, and external audit are complete.
