# Stylus Toolchain Change Log

**Date:** 2026-06-09  
**Environment:** WSL2 migration / recovery session

---

## Problem

- Windows: `cargo-stylus` failed to compile (`std::os::unix::net`)
- WSL: `cargo stylus --version` worked but `cargo stylus check` failed with `missing Stylus.toml`
- `export-abi` failed (missing bin target; solc not required after fix)
- Deploy failed (low gas fee; Docker not available — used `--no-verify`)

---

## Changes Made

### 1. Workspace manifest (required by cargo-stylus 0.10.7)

**Created:** `stylus/Stylus.toml`

```toml
[workspace]

[workspace.networks.arbitrum-sepolia]
endpoint = "https://sepolia-rollup.arbitrum.io/rpc"

[workspace.networks.robinhood-testnet]
endpoint = "https://rpc.testnet.chain.robinhood.com"
```

### 2. Per-engine contract manifests

**Updated:** `stylus/engines/*/Stylus.toml` — replaced legacy `[project]` format with:

```toml
[contract]
```

### 3. Export-ABI bin targets

**Created:** `stylus/engines/*/src/main.rs` — export-abi entrypoints using `stylus_sdk::abi::export::print_from_args`

### 4. Solidity ↔ Stylus ABI alignment

**Updated:** `stylus/engines/shared/valen_abi.rs`

| Struct field | Before | After |
|--------------|--------|-------|
| `EngineVerdict.reason_code` | `uint8` | `uint16` (matches Solidity) |
| `EligibilityVerdict.failed_dimension` | `uint8` + extra `result_hash` | `bytes32` only (matches Solidity) |
| `PolicyVerdict.result_hash` | present | removed (matches Solidity) |

### 5. Deploy script fixes

**Updated:** `stylus/script/activate-stylus.sh`

- Run from workspace root with `--contract <package>`
- `--no-verify` for local deploy without Docker
- `--max-fee-per-gas-gwei 1` for Arbitrum base fee
- Strip ANSI codes when parsing deployed addresses
- CRLF → LF line endings

**Updated:** `stylus/script/export-abi.sh` — use `--contract` flag

### 6. Hardhat env normalization

**Updated:** `contracts/hardhat.config.ts` — trim/normalize `PRIVATE_KEY` (CRLF fix)

### 7. New contract scripts

| File | Purpose |
|------|---------|
| `contracts/script/init-engines.ts` | Initialize Stylus engines |
| `contracts/script/e2e-validation.ts` | Full on-chain E2E validation |
| `contracts/script/lib/engine-constants.ts` | Shared engine init constants |

---

## Verified Commands (WSL)

| Command | Result |
|---------|--------|
| `cargo stylus --version` | `stylus 0.10.7` ✅ |
| `cargo stylus check --contract compliance-engine -e $RPC` | ✅ |
| `cargo stylus export-abi --contract compliance-engine --output abi/...` | ✅ |
| `cargo stylus deploy --no-verify --contract ... --max-fee-per-gas-gwei 1` | ✅ both networks |
| `cargo test` (stylus workspace) | ✅ 4/4 |

---

## Rust Toolchain

**Unchanged:** `stylus/rust-toolchain.toml` pins `1.91.0` (matches Stylus SDK 0.10.2 docs)

**Note:** Global default rustup toolchain is nightly; commands inside `stylus/` auto-select 1.91.0 via rust-toolchain.toml.

---

## Deployment Artifacts Produced

- `stylus/deployments/arbitrum-sepolia/engines.json`
- `stylus/deployments/robinhood-testnet/engines.json`
- `stylus/abi/*.sol` (exported ABIs)
