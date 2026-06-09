# WSL Diagnostic Report

**Date:** 2026-06-09  
**Host:** WSL2 (`linux 6.6.114.1-microsoft-standard-WSL2`)  
**Project path:** `/mnt/d/route/valen`

---

## 1. Environment Commands

| Command | Result |
|---------|--------|
| `pwd` | `/mnt/d/route/valen` |
| `node -v` | `v24.12.0` |
| `pnpm -v` | `9.15.0` |
| `rustc --version` | `rustc 1.98.0-nightly (f20a92ec0 2026-06-07)` |
| `cargo --version` | `cargo 1.98.0-nightly (0b1123a48 2026-06-01)` |
| `rustup show` | Default: `nightly-x86_64-unknown-linux-gnu`; also installed: `1.86.0-x86_64-unknown-linux-gnu` |
| `cargo --list` | Includes `stylus` subcommand |
| `cargo stylus --version` | **`stylus 0.10.7`** ✅ |

### Installed targets

- `wasm32-unknown-unknown` ✅
- `x86_64-unknown-linux-gnu` ✅

---

## 2. cargo-stylus Availability

**Status: INSTALLED and callable**

```
$ cargo stylus --version
stylus 0.10.7
```

Binary location: `~/.cargo/bin/cargo-stylus` (invoked via `cargo stylus`).

This resolves the **Windows blocker** documented in `PHASE5_1_COMPLETION_REPORT.md` (`std::os::unix::net` compile failure). WSL provides a working Linux build of cargo-stylus 0.10.7.

---

## 3. cargo stylus Operational Commands

| Command | Result | Detail |
|---------|--------|--------|
| `cargo stylus --version` | ✅ Pass | v0.10.7 |
| `cargo stylus check` (from `stylus/engines/compliance-engine`) | ❌ Fail | `error: missing Stylus.toml` |
| `cargo stylus check --package compliance-engine` (from `stylus/`) | ❌ Fail | `unexpected argument '--package'` — not supported in 0.10.7 |
| `cargo stylus check --verbose` | ❌ Fail | Same missing manifest error |

**Diagnosis:** Not a PATH or installation issue. The failure is **project manifest configuration**, not missing cargo-stylus binary.

---

## 4. Root Cause Analysis

### 4.1 Missing workspace-level Stylus.toml

`cargo-stylus` 0.10.7 (`stylus-tools` crate) loads workspace metadata via:

```rust
let manifest_path = metadata.workspace_root.join("Stylus.toml");
```

For this repo, workspace root is `stylus/`. **No `stylus/Stylus.toml` exists.**

Per-engine files at `stylus/engines/*/Stylus.toml` are **not** used for workspace initialization.

### 4.2 Outdated per-engine Stylus.toml format

Current engine manifests (example `compliance-engine/Stylus.toml`):

```toml
[project]
name = "compliance-engine"
version = "0.1.0"

[contract]
name = "ComplianceEngine"
```

cargo-stylus 0.10.7 official contract template expects:

```toml
[workspace]

[workspace.networks]

[contract]
```

The `[project]` section is from an older Stylus workflow and is not parsed by 0.10.7 workspace loader.

### 4.3 CRLF line endings

Engine `Stylus.toml` files use Windows CRLF (`0d0a`):

```
$ file stylus/engines/compliance-engine/Stylus.toml
Generic INItialization configuration [contract]
```

Files were created on Windows (`/mnt/d/` drive). Should be normalized to LF for consistent Linux tooling.

### 4.4 Rust toolchain conflict

| Source | Channel |
|--------|---------|
| `stylus/rust-toolchain.toml` | **1.91.0** (with `wasm32-unknown-unknown` target) |
| `rustup default` | **nightly 1.98.0** |
| First `cargo stylus check` | Triggered download/install of **1.91.0** (78s) |

**Impact:**

- Commands inside `stylus/` auto-switch to 1.91.0 via `rust-toolchain.toml`
- Global default remains nightly — potential inconsistency outside `stylus/`
- Stylus SDK 0.10.2 + cargo-stylus 0.10.7 may require a specific stable channel; verify against official docs during fix

**Note:** `rust-toolchain` (without `.toml`) does **not** exist at repo root or in `stylus/`.

### 4.5 Workspace member layout

Cargo workspace (`stylus/Cargo.toml`) members:

- `crates/valen-stylus-common` — library, no Stylus.toml (correct)
- `engines/compliance-engine` — has Stylus.toml
- `engines/risk-engine` — has Stylus.toml
- `engines/eligibility-engine` — has Stylus.toml
- `engines/policy-engine` — has Stylus.toml

`cargo stylus check` without `--contract` flag will iterate `workspace.default_contracts()` — only packages with `Stylus.toml` in their directory.

---

## 5. PATH Assessment

| Check | Result |
|-------|--------|
| `~/.cargo/bin` in PATH | ✅ (cargo/rustc resolve) |
| `cargo-stylus` on PATH | ✅ via `cargo stylus` |
| Windows vs Linux toolchain | WSL uses Linux rustup home `/home/devmo/.rustup` |

No PATH issues detected.

---

## 6. Nightly vs Stable Assessment

| Item | Finding |
|------|---------|
| Active default toolchain | nightly 1.98.0 |
| Project override | 1.91.0 stable (via `stylus/rust-toolchain.toml`) |
| cargo-stylus installed with | nightly (global cargo) |
| Conflict severity | **Medium** — auto-download of 1.91.0 on each fresh environment; pin should match Stylus SDK requirements |

**Recommendation:** Align `stylus/rust-toolchain.toml` with the channel required by Stylus SDK 0.10.2 / cargo-stylus 0.10.7 documentation (likely stable ≥1.80). Avoid nightly for Stylus builds unless docs require it.

---

## 7. Comparison: Windows vs WSL

| Issue | Windows (prior session) | WSL (this session) |
|-------|-------------------------|---------------------|
| cargo-stylus compile | ❌ `unix::net` error | ✅ Installed |
| cargo stylus --version | ❌ | ✅ 0.10.7 |
| cargo stylus check | ❌ (no CLI) | ❌ (manifest config) |
| Solidity deploy | ✅ | ✅ (artifacts in repo) |
| cargo test (stylus) | ✅ (per docs) | ✅ 4/4 pass |

**WSL unblocks the toolchain installation problem. Next fix is manifest/configuration, not re-installing cargo-stylus.**

---

## 8. Required Fixes (Task 4 Preview)

1. Create `stylus/Stylus.toml` with `[workspace]` and network endpoints (Sepolia, Robinhood)
2. Update each `engines/*/Stylus.toml` to cargo-stylus 0.10.7 format
3. Convert all Stylus.toml files to LF line endings
4. Verify/update `stylus/rust-toolchain.toml` channel for SDK compatibility
5. Re-run from `stylus/` directory:
   - `cargo stylus check --endpoint $RPC --contract compliance-engine` (etc.)
   - `cargo stylus export-abi`
   - `cargo stylus deploy`

---

## 9. Verification Checklist (Post-Fix)

- [ ] `cargo stylus --version` → 0.10.7
- [ ] `cd stylus && cargo stylus check -e $ARB_SEPOLIA_RPC --contract compliance-engine`
- [ ] All 4 engines pass `check` on Sepolia
- [ ] `export-abi.sh` produces JSON in `stylus/abi/`
- [ ] `activate-stylus.sh arbitrum-sepolia` writes `deployments/arbitrum-sepolia/engines.json`
- [ ] Same for Robinhood testnet

---

## 10. Summary

| Category | Status |
|----------|--------|
| Node/pnpm | ✅ Ready |
| Rust/cargo | ✅ Ready (with toolchain pin drift) |
| wasm32 target | ✅ Installed |
| cargo-stylus binary | ✅ Installed (0.10.7) |
| Stylus project config | ❌ **Blocking** — missing workspace Stylus.toml + outdated contract manifests |
| Stylus deploy | ❌ Not started |
| WSL suitability for Stylus | ✅ **Yes** — preferred over Windows for this project |

**Bottom line:** WSL environment is suitable and cargo-stylus is installed. The remaining Stylus failure is a **repository configuration gap**, not an environment installation gap.
