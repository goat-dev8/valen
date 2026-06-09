# PHASE 1 — VALEN Research & Architecture Discovery

**Status:** Research complete. No code. No implementation.  
**Date:** June 8, 2026  
**Lead Architect:** VALEN Phase 1 Discovery  

---

## Executive Summary

VALEN is positioned to win the **Arbitrum Open House London Buildathon** by solving a real, timely problem: **autonomous agents need a enforceable compliance, risk, and permission layer before settlement** — especially on financial-grade chains where tokenized RWAs, institutional mandates, and regulatory scrutiny converge.

The winning architecture is **hybrid and deliberate**:

| Layer | Technology | Role |
|-------|-----------|------|
| **Permission & Settlement Gate** | Solidity (OpenZeppelin) | Final authority, token hooks, mandate registry, ERC integrations |
| **Compliance, Risk & Policy Engines** | Stylus (Rust) | Compute-heavy evaluation, scoring, rule chains, cryptographic verification |
| **Intent, Orchestration & External Data** | Off-chain services | Agent SDK, sanctions/KYC APIs, oracles, monitoring, human oversight UI |

Deploy to **Arbitrum Sepolia** (development) and **Robinhood Chain Testnet** (chain ID `46630`) to qualify for both prize tracks. Stylus is not a marketing choice — it is the correct runtime for VALEN's risk and policy engines.

---

# Open House Analysis

## Event Overview

| Attribute | Detail |
|-----------|--------|
| **Name** | Arbitrum Open House London: Online Buildathon |
| **Host** | Arbitrum Foundation (+ Robinhood Chain co-sponsorship) |
| **Mode** | Online, 3-week intensive build |
| **Registration** | Mar 24 – Jun 12, 2026 |
| **Submission** | Mar 24 – Jun 14, 2026 |
| **Rewards announced** | Jun 17, 2026 |
| **Participants** | 735+ registered |
| **Total prizes** | $115,000 USD |

## Prize Structure

| Track | Pool | Top 3 Split | Notes |
|-------|------|-------------|-------|
| **Overall** | $70,000 USDC | $40K / $20K / $10K | Top 3 → IRL Founder House in London (June) |
| **Best Agentic Project** | $15,000 USDC | $7K / $5K / $3K | Dedicated agentic track |
| **Grants** | Up to $30,000 USDC | Milestone-based, discretionary | Not guaranteed |

Robinhood committed **$1M** toward Open House 2026 developer activity on Robinhood Chain testnet and future mainnet.

## Mandatory Qualification Rules

1. **Must deploy on an Arbitrum chain** — Arbitrum Sepolia, Arbitrum One, Robinhood Chain, or other Arbitrum Orbit chains.
2. **Tech stack explicitly includes Solidity and Rust** (Stylus).
3. **At least 1 of 3 Overall prizes reserved** for a Robinhood Chain project.
4. **At least 1 of 3 Overall prizes reserved** for an Arbitrum project.
5. **Best Agentic track** has the same chain-reservation pattern for Robinhood.
6. Prizes are **development-tied milestones** (not unconditional cash awards).

## Official Developer Resources (Hackathon)

- Arbitrum docs, Robinhood Chain docs, Stylus gentle intro
- Quickstarts: Solidity dApp + Rust/Stylus contract
- Local Nitro dev node
- Faucets: Arbitrum Sepolia ETH/USDC, Robinhood Chain testnet
- RPCs: `arb1.arbitrum.io/rpc`, Robinhood `rpc.testnet.chain.robinhood.com`
- Tooling: `cargo-stylus`, `stylus-sdk-rs`, Stylus By Example, OpenZeppelin (Solidity + Rust)

## Strategic Implications for VALEN

| Signal | VALEN Response |
|--------|----------------|
| "Build what's next" + institution stack | Position as **financial infrastructure**, not consumer app |
| BlackRock + Robinhood reputational bet | Emphasize **RWA-ready compliance** and production-grade contracts |
| Agentic prize track exists | VALEN vision maps **directly** to "Best Agentic Project" |
| Robinhood prize reservation | **Must deploy and demo on Robinhood Chain Testnet** |
| Solidity + Rust required | Hybrid architecture is **expected**, not optional |
| Smart contract quality is #1 criterion | OpenZeppelin, audits mindset, comprehensive tests |
| Real problem solving | Agent permissioning before settlement is a **2026 regulatory reality** |

---

# Judge Analysis

## Published Judging Criteria (All Prize Tracks)

Judges evaluate on four axes, in this order of emphasis:

### 1. Smart Contract Quality (Primary Technical Bar)
- Best practices (OpenZeppelin patterns, access control, reentrancy guards)
- Logical structure and efficiency
- Minimal security vulnerabilities
- Clean separation of concerns across contracts

**VALEN implication:** Judges will read the code. A Stylus risk engine with OZ Rust contracts + Solidity settlement gate signals maturity. Sloppy monolith contracts will lose regardless of narrative.

### 2. Product-Market Fit
- Clear potential to attract and retain users
- Credible path from demo → production

**VALEN implication:** Target **agent developers, fintech platforms, and RWA issuers** — not retail traders. PMF story: "Every agent that moves money on Arbitrum/Robinhood Chain needs a permission layer."

### 3. Innovation and Creativity
- Original approaches pushing boundaries
- Not another fork of existing primitives

**VALEN implication:** Differentiate from DEXs, wallets, and pure audit-logging tools. The innovation is **pre-execution policy enforcement** with Stylus compute + on-chain mandate scoping (ERC-8226-aligned).

### 4. Real Problem Solving
- Genuine market needs, not hackathon theater

**VALEN implication:** Cite the convergence of:
- EU AI Act enforcement (Aug 2026)
- Tokenized RWAs on Robinhood Chain
- ERC-8004 agent identity + ERC-8226 regulated mandates
- Institutional demand for agent guardrails (MiCA, MiFID II account segregation)

## What Judges Likely Reward in Agentic Submissions

Based on ecosystem signals (Trailblazer 2.0 agentic DeFi grants, ArbiLink bounties, AgentAudit AI as reference competitor):

| Judges Want | Judges Penalize |
|-------------|-----------------|
| End-to-end agent → intent → on-chain outcome | Chatbot wrappers with no settlement |
| Deployed contracts on target chains | Slide decks without deployment |
| Clear agent identity + permission model | "AI" label with no autonomy |
| Immutable audit trail for high-risk actions | Mutable off-chain-only logs |
| Integration with Arbitrum/Robinhood infra | Chain-agnostic vaporware |
| Stylus used where compute matters | Stylus used for trivial CRUD |
| Human oversight / kill switch | Fully unbounded agent authority |

## Competitive Landscape (Know Your Neighbors)

| Project | Focus | VALEN Differentiation |
|---------|-------|----------------------|
| **AgentAudit AI** | Post-action EU AI Act logging, audit vaults | VALEN = **pre-execution** gate; blocks bad actions, not just logs them |
| **Chainlink ACE** | General compliance policy engine | VALEN = **agent-native** mandate + intent flow, not generic token rules |
| **Webacy** | Off-chain risk data APIs | VALEN = **on-chain enforcement**; Webacy is an integration, not a competitor |
| **ERC-8226 RAMS** | Regulated agent mandates (draft standard) | VALEN should **implement/extend** RAMS patterns, not reinvent |
| **VibeKit / Ember** | DeFi agent frameworks | VALEN is the **permission layer** VibeKit agents call before execution |

---

# Arbitrum Analysis

## What Arbitrum Is

Arbitrum is a **finance-native blockchain platform** — not merely an L2. It provides:

- **Public chains:** Arbitrum One, Arbitrum Nova, Arbitrum Sepolia (testnet)
- **Custom chains:** Arbitrum Orbit (e.g., Robinhood Chain) with configurable DA, gas tokens, governance
- **Dual execution:** EVM (Solidity) + Stylus (WASM: Rust, C, C++, Move)
- **Institutional adoption:** Infrastructure trusted by BlackRock, Robinhood, and major DeFi protocols
- **Settlement:** Ethereum security with L2 throughput and cost efficiency

## Nitro Architecture (Relevant to VALEN)

| Component | VALEN Relevance |
|-----------|-----------------|
| **Sequencer** | Fast transaction ordering; agents need predictable inclusion for time-sensitive approvals |
| **ArbOS** | Hypervisor managing EVM + WASM execution in same state tree |
| **Rollup / AnyTrust DA** | Robinhood uses Ethereum blobs; standard security model |
| **Precompiles** | ArbWasm (`0x71`), ArbWasmCache (`0x72`) for Stylus activation/caching |
| **Cross-chain messaging** | Future: multi-chain mandate portability |
| **Bridges** | Token movement between L1 ↔ L2; relevant for RWA settlement paths |

## Key Network Parameters

| Network | Chain ID | RPC | Use for VALEN |
|---------|----------|-----|---------------|
| Arbitrum One | 42161 | `https://arb1.arbitrum.io/rpc` | Production target |
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | Primary dev/test |
| Robinhood Chain Testnet | 46630 | `https://rpc.testnet.chain.robinhood.com` | Hackathon prize qualification |

## Arbitrum SDK (`arbitrum-sdk`)

TypeScript SDK for bridging, retryable tickets, cross-chain messaging, and L1↔L2 operations. VALEN uses it for:

- Settlement flows involving bridged assets
- Cross-chain mandate attestation (future)
- Not for core compliance logic (that stays on-chain)

## Finance-Native Positioning

Arbitrum explicitly markets as infrastructure for the **programmable economy** — markets, transactions, and business processes running in software with configurable rules and Ethereum settlement. VALEN is a direct embodiment of this thesis: **configurable rules for agentic financial execution**.

---

# Robinhood Analysis

## What Robinhood Chain Is Built For

Robinhood Chain is a **permissionless, Ethereum-compatible L2** built on **Arbitrum Orbit technology**, optimized for:

| Priority | Description |
|----------|-------------|
| **Tokenized RWAs** | Equities, ETFs, private assets, financial instruments onchain |
| **24/7 programmatic markets** | Self-custody, no platform lock-in |
| **Financial-grade infrastructure** | Reliability, security, compliance-aware design |
| **Developer openness** | Anyone can deploy contracts, build apps |
| **Institutional rails** | Bridge, custody, compliance partner integrations |

## Technical Specifications

| Property | Value |
|----------|-------|
| **Stack** | Arbitrum Orbit L2 on Ethereum |
| **DA** | Ethereum blobs |
| **Gas token** | ETH |
| **Chain ID** | 46630 (testnet) |
| **Stylus** | Supported (Rust, C, C++, Move) |
| **Solidity** | Full EVM compatibility |
| **Explorer** | explorer.testnet.chain.robinhood.com |
| **Faucet** | faucet.testnet.chain.robinhood.com |
| **USDG testnet** | Via Paxos faucet |

## Ecosystem Partners (Compliance-Relevant)

| Partner | VALEN Integration Opportunity |
|---------|------------------------------|
| **Alchemy** | RPC, bundler, smart wallets, gas sponsorship (ERC-4337) |
| **Chainlink** | Oracles, potentially ACE compliance patterns |
| **LayerZero** | Cross-chain asset/mandate messaging (future) |
| **TRM Labs** | Sanctions/AML screening — off-chain integration into compliance engine |
| **Allium** | Indexing, analytics for audit dashboards |

## Why Robinhood Chain Matters for VALEN

1. **RWA focus = regulated agent problem is native.** Agents trading tokenized equities need mandate scoping, investor eligibility, and pre-transfer hooks — exactly VALEN's domain.

2. **Prize reservation.** Deploying here is not optional for competitive positioning.

3. **Account abstraction ready.** Alchemy bundler + smart wallets enable agent-initiated UserOperations that VALEN approves/rejects before submission.

4. **Compliance is design intent.** Robinhood built with "reliability, security, and compliance in mind" — VALEN aligns with chain thesis, not against it.

5. **Mainnet trajectory.** Testnet now, mainnet later 2026 — VALEN should architect for mainnet readiness from day one.

## What Robinhood Chain Is NOT

- Not a closed app chain — permissionless for builders
- Not a replacement for Arbitrum One — complementary, RWA-specialized
- Not just a Robinhood product wrapper — open developer ecosystem

---

# Stylus Analysis

## What Stylus Is

Stylus is Arbitrum's **multi-language smart contract platform** where contracts compile to **WebAssembly (WASM)** and execute in a dedicated VM **alongside the EVM**, sharing the same state tree and remaining fully interoperable with Solidity contracts.

| Attribute | Detail |
|-----------|--------|
| **Primary language** | Rust (also C, C++, Move via WASM) |
| **SDK** | `stylus-sdk-rs` v0.10.2 (Alloy-based, OZ-audited) |
| **CLI** | `cargo-stylus` (build, check, deploy, activate, verify) |
| **Libraries** | `openzeppelin-stylus` (ERC20, access control, security patterns) |
| **ABI** | Solidity-compatible — Stylus contracts callable from Solidity and vice versa |
| **Testing** | `stylus-test` with `TestVM`; `arbos-foundry` for native WASM tests |

## Stylus Is Best For (VALEN-Relevant)

| Workload | Stylus Advantage | Evidence |
|----------|-----------------|----------|
| **Iterative risk scoring** | 10–100× cheaper than Solidity | Arbitrum benchmarks: 50-pass convergence loops |
| **Policy rule chains** | Cheap branching/looping | WASM near-native execution |
| **Cryptographic verification** | ~10× cheaper sig verify | Gas optimization docs |
| **Merkle proof validation** | 10–50× cheaper loops | Stylus By Example patterns |
| **Complex arithmetic** | Native integer performance | VM differences table |
| **Memory-heavy computation** | Efficient WASM memory model | vs EVM memory pricing |

## Stylus Is NOT Best For

| Workload | Better Choice | Why |
|----------|--------------|-----|
| Simple storage CRUD | Solidity | WASM entry overhead (128–2048 gas fixed cost) |
| SLOAD/SSTORE-heavy contracts | Solidity | Storage costs are **identical** (2100/20000/5000 gas) |
| Token standards (ERC-20/721) | Solidity (OZ) | Battle-tested, maximum ecosystem compatibility |
| Contracts with no compute | Solidity | Stylus overhead not justified |
| External API calls | Off-chain | Stylus cannot make HTTP calls |

## Deployment Lifecycle (Critical for Production)

Stylus requires **two steps**:

1. **Deploy** — Store compressed WASM onchain (≤24KB compressed)
2. **Activate** — Pay data fee via ArbWasm precompile (`0x71`)

Additional production concerns:
- **Program expiration** — ~1 year without keepalive
- **Version upgrades** — SDK version must match chain Stylus version
- **Caching** — ArbWasmCache (`0x72`) reduces call costs for hot paths
- **Deterministic builds** — Pin `rust-toolchain.toml`, avoid non-deterministic deps

## Interoperability Model

```
┌─────────────────┐     call      ┌─────────────────┐
│ Solidity Gate   │ ────────────► │ Stylus Risk     │
│ (Settlement)    │ ◄──────────── │ Engine          │
└─────────────────┘    return     └─────────────────┘
        │                                  │
        │         shared Arbitrum          │
        │         state tree               │
        ▼                                  ▼
   ERC-20 / RWA Token              Policy evaluation
```

Solidity handles token transfers and standard interfaces. Stylus handles compute-intensive evaluation. Both read/write the same storage context through contract calls.

---

# What Must Be Onchain

## Non-Negotiable Onchain Components

These **must** be onchain because they require immutability, atomic enforcement, or trustless verification:

### 1. Permission & Authorization State
- Agent-to-principal mandate bindings (scope, caps, expiry)
- Role-based access control (who can grant/revoke/configure)
- Agent identity references (ERC-8004 token ID → wallet mapping)
- Revocation and freeze flags (jurisdiction-scoped)

### 2. Policy Enforcement at Settlement
- Pre-transfer compliance hooks (fail-closed: revert if non-compliant)
- Spending limits, velocity checks, allowlist/denylist enforcement
- Asset-class and jurisdiction constraints
- Time-window restrictions (market hours, settlement windows)

### 3. Settlement Approval Gate
- Explicit approval/rejection verdict before execution
- Approval nonce / replay protection
- Multi-sig or threshold approval for high-risk actions
- Atomic: evaluate → approve → execute in single transaction (or commit-reveal)

### 4. Immutable Audit Trail (Commitments)
- `keccak256(intent + policy_version + verdict + timestamp)` per decision
- Event emissions for every compliance/risk/policy decision
- Execution records linked to mandate ID
- Tamper-evident log for regulatory audit

### 5. Compliance Verdict Recording
- Structured reason codes (not binary pass/fail)
- Policy version hash at time of evaluation
- Principal eligibility snapshot reference
- On-chain attestations from compliance provider (EAS or custom)

### 6. Mandate Registry (ERC-8226-Aligned)
- `grantMandate(principal, agent, scope, caps, expiry)`
- `revokeMandate(mandateId)`
- `checkMandate(mandateId, action)` — view + stateful execution recording
- `recordExecution(mandateId, txHash, amount)` — cumulative cap tracking

## Onchain Data Model (Minimal)

```
Mandate {
  id, principal, agentId, agentWallet,
  scopeHash, assetAllowlist[], maxPerTx, maxDaily, maxTotal,
  validFrom, validUntil, complianceProvider, status
}

Intent {
  id, agentId, actionType, asset, amount, counterparty,
  mandateId, payloadHash, submittedAt
}

Verdict {
  intentId, complianceResult, riskScore, policyResult,
  approved, reasonCode, evaluatedAt, evaluatorVersion
}

Execution {
  intentId, verdictId, txHash, blockNumber, finalAmount
}
```

---

# What Must Be Offchain

## Non-Negotiable Offchain Components

### 1. Agent Orchestration & Intent Formation
- LLM/reasoning layer that forms structured intents (not onchain)
- MCP/SDK adapter that translates agent actions → VALEN intent schema
- Human-in-the-loop review UI for high-risk decisions

### 2. External Compliance Data Feeds
- **Sanctions screening** (TRM Labs, Chainalysis) — API calls, results cached as attestations
- **KYC/AML status** — identity provider integrations
- **Market data** — prices, volatility, liquidity for risk scoring inputs
- **Regulatory lists** — jurisdiction blocklists, PEP databases

### 3. Heavy Risk Analytics
- ML models for anomaly detection
- Portfolio correlation analysis across complex multi-asset books
- Monte Carlo simulations
- Historical behavior profiling
- **Pattern:** Off-chain compute → submit proof or signed risk assessment → onchain Stylus verifies lightweight proof

### 4. Policy Configuration Management
- Policy authoring UI (non-technical compliance officers)
- Version control and diff for policy rule sets
- Simulation / backtesting against historical intents
- **Pattern:** Policy hash committed onchain; full policy document stored offchain (IPFS/Arweave)

### 5. Monitoring, Alerting & Reporting
- Real-time dashboards for compliance teams
- Incident reporting workflows (EU AI Act Art. 73 timelines)
- Regulatory report generation
- Webhook notifications for verdict events

### 6. Oracle & Indexing Infrastructure
- The Graph / Allium / Envio for indexing VALEN events
- Chainlink oracles for external data anchors
- Price feeds for limit checks

## Offchain ↔ Onchain Boundary Principle

> **Off-chain computes and attests. On-chain verifies and enforces.**

Never trust off-chain verdicts without cryptographic binding. Every off-chain risk score or compliance check that influences settlement must either:
1. Be verified onchain (Stylus recomputes from committed inputs), or
2. Be signed by an authorized attestation key and checked onchain, or
3. Be committed via merkle proof against an onchain root

---

# Smart Contract Opportunities

## Solidity Opportunities (OpenZeppelin `openzeppelin-contracts`)

| Contract | Purpose | Priority |
|----------|---------|----------|
| **SettlementGate** | Single entry point: `executeIntent()` with pre-checks | P0 |
| **MandateRegistry** | ERC-8226-aligned mandate lifecycle | P0 |
| **ComplianceProviderAdapter** | Bridge external attestations → onchain eligibility | P0 |
| **AgentIdentityRegistry** | ERC-8004-compatible agent NFT/registry adapter | P1 |
| **ApprovalManager** | Multi-sig / threshold / timelock for high-risk approvals | P1 |
| **AuditLog** | Immutable event commitment store | P1 |
| **TokenComplianceHook** | `canTransfer()` integration for regulated tokens | P2 |
| **EmergencyPause** | Circuit breaker / kill switch (OZ Pausable) | P0 |

## Why Solidity for These

- Maximum compatibility with existing DeFi/RWA token contracts
- OpenZeppelin battle-tested patterns (AccessControl, ReentrancyGuard, Pausable)
- Judges expect clean Solidity for settlement and token hooks
- ERC-3643 / ERC-7943 regulated token standards are Solidity-native
- Foundry/Hardhat ecosystem for testing and verification

## Integration Targets

| Standard | VALEN Role |
|----------|-----------|
| **ERC-8004** | Agent identity, reputation, validation registries |
| **ERC-8226 (RAMS)** | Regulated agent mandate delegation |
| **ERC-3643** | Regulated token transfer restrictions |
| **ERC-4337** | Account abstraction — agent smart wallets via Alchemy bundler |
| **EAS (Ethereum Attestation Service)** | Compliance credentials |

---

# Stylus Opportunities

## Stylus Opportunities (OpenZeppelin `rust-contracts-stylus` + `stylus-sdk-rs`)

| Contract | Purpose | Why Stylus |
|----------|---------|-----------|
| **ComplianceEngine** | Rule chain evaluation (KYC status + jurisdiction + asset class) | Multi-condition branching |
| **RiskEngine** | Multi-factor risk scoring with weighted convergence | Compute-heavy loops |
| **PolicyEngine** | Policy DAG traversal, limit checks, velocity tracking | Iterative evaluation |
| **ProofVerifier** | Merkle/ZK proof verification for off-chain attestations | Crypto-native performance |
| **ScoreCache** | Compute risk scores with cached storage reads | Minimize cross-contract calls |

## Why Stylus for These

| Factor | Detail |
|--------|--------|
| **Gas economics** | Risk/policy evaluation is compute-heavy — 10–100× savings |
| **Type safety** | Rust compile-time checks reduce vulnerability surface |
| **Testing** | Native `#[test]` with TestVM — fast iteration |
| **OZ Rust contracts** | Security-audited patterns ported from Solidity OZ |
| **Hackathon signal** | "Stylus Native" is explicit VALEN goal and judge differentiator |

## Stylus Contract Call Pattern

```
Agent → SettlementGate (Solidity)
         ├─ staticcall → ComplianceEngine (Stylus) → (pass/fail, reasonCode)
         ├─ staticcall → RiskEngine (Stylus) → (score, tier)
         ├─ staticcall → PolicyEngine (Stylus) → (allowed, limits)
         └─ if all pass → execute transfer/call
```

Use `staticcall` for evaluation (no state change in engines) and only the SettlementGate mutates state. This minimizes reentrancy surface and keeps verdict logic pure.

---

# Compliance Architecture

## VALEN Compliance Engine — Design

### Purpose
Verify that an agent action is **legally and regulatorily permissible** before risk scoring and policy evaluation.

### Compliance Check Chain (Ordered)

```
1. Agent Identity     → Is agent registered and not revoked? (ERC-8004)
2. Mandate Validity   → Is mandate active, not expired, not frozen? (ERC-8226)
3. Principal Eligibility → Is principal KYC-cleared for this scope? (ComplianceProvider)
4. Jurisdiction       → Is action permitted in principal's jurisdiction?
5. Asset Eligibility  → Is asset in mandate scope? Is asset regulated/approved?
6. Counterparty       → Is counterparty not sanctioned/blocked? (attestation)
7. Regulatory Flags   → Market hours, holding periods, insider restrictions
```

### Compliance Provider Model (ERC-8226-Aligned)

```
IComplianceProvider (Solidity adapter)
  ├── grantPrincipal(principal, identityRef, scopeHash)
  ├── revokePrincipal(principal, scopeHash, reason)
  └── checkPrincipal(principal, identityRef, scopeHash)
        → (eligible, reasonCode, expiresAt)
```

Off-chain KYC provider issues attestation → ComplianceProviderAdapter writes onchain → Stylus ComplianceEngine reads via cross-contract call.

### Fail-Closed Principle

Every compliance check defaults to **REJECT**. Explicit pass required at each step. No "fail open" paths. If compliance provider is unreachable, stale, or expired → reject.

### Structured Reason Codes (Required for Audit)

```
COMPLIANT, KYC_EXPIRED, AML_FLAG, NOT_ACCREDITED,
NOT_QUALIFIED, JURISDICTION_BLOCKED, IDENTITY_NOT_FOUND,
ATTESTATION_REVOKED, MANDATE_EXPIRED, MANDATE_EXCEEDED,
AGENT_REVOKED, COUNTERPARTY_BLOCKED, ASSET_NOT_PERMITTED
```

---

# Risk Architecture

## VALEN Risk Engine — Design

### Purpose
Quantify the **financial and operational risk** of an agent intent on a continuous scale, informing approval thresholds.

### Risk Factors (Weighted Scoring)

| Factor | Weight | Source |
|--------|--------|--------|
| Transaction amount vs. mandate cap | High | Onchain |
| Asset volatility | Medium | Oracle (offchain → onchain) |
| Counterparty risk score | High | TRM/Webacy attestation |
| Agent historical behavior | Medium | Onchain execution history |
| Portfolio concentration | Medium | Offchain compute → merkle proof |
| Time-of-day / market conditions | Low | Oracle |
| Action type risk tier | High | Onchain policy config |
| Velocity (tx frequency) | Medium | Onchain windowed counter |

### Risk Tiers → Approval Flow

| Tier | Score Range | Action |
|------|-------------|--------|
| **LOW** | 0–25 | Auto-approve (if compliance + policy pass) |
| **MEDIUM** | 26–60 | Auto-approve with enhanced logging |
| **HIGH** | 61–85 | Requires human approval or multi-sig |
| **CRITICAL** | 86–100 | Block + alert compliance team |

### Stylus Implementation Advantage

The risk engine runs iterative scoring:

```
for factor in factors:
    score += weight[i] * normalize(factor.value)
    for correlation in correlations:
        score = refine(score, correlation)
return tier(score)
```

This loop structure is **90%+ cheaper in Stylus** than equivalent Solidity. For a production system evaluating thousands of agent intents, this is the core Stylus value proposition.

### Offchain Enrichment Pattern

```
Offchain Risk Service
  ├── Ingest: market data, portfolio state, ML anomaly score
  ├── Compute: full risk assessment
  ├── Output: signed RiskAttestation { intentHash, score, tier, expiry }
  └── Submit to chain

Stylus RiskEngine
  ├── Verify attestation signature
  ├── Recompute lightweight factors onchain
  ├── Cross-check: |onchain_score - attested_score| < tolerance
  └── Return final tier
```

---

# Settlement Architecture

## VALEN Settlement Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│  Agent   │───►│ Intent Queue │───►│ ComplianceEngine │
│  (SDK)   │    │  (offchain)  │    │    (Stylus)      │
└──────────┘    └──────────────┘    └────────┬─────────┘
                                             │ pass
                                    ┌────────▼─────────┐
                                    │   RiskEngine     │
                                    │    (Stylus)      │
                                    └────────┬─────────┘
                                             │ tier ≤ threshold
                                    ┌────────▼─────────┐
                                    │  PolicyEngine    │
                                    │    (Stylus)      │
                                    └────────┬─────────┘
                                             │ allowed
                                    ┌────────▼─────────┐
                                    │ SettlementGate   │
                                    │   (Solidity)     │
                                    │                  │
                                    │ 1. Record verdict│
                                    │ 2. Check mandate │
                                    │ 3. Execute tx    │
                                    │ 4. Emit audit    │
                                    └────────┬─────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │  Target Contract │
                                    │  (DEX/RWA/Token) │
                                    └──────────────────┘
```

## Settlement Approval Modes

| Mode | Use Case | Implementation |
|------|----------|---------------|
| **Auto-approve** | Low risk + full compliance | Single tx: evaluate + execute |
| **Delayed-approve** | Medium risk | Commit intent → timelock → execute |
| **Human-approve** | High risk | Intent queued → compliance UI → explicit approve tx |
| **Multi-sig** | Critical institutional | Gnosis Safe / custom threshold on SettlementGate |

## Account Abstraction Integration (Robinhood Chain)

Robinhood Chain testnet supports Alchemy's bundler + smart wallets:

```
Agent Smart Wallet (ERC-4337)
  → constructs UserOperation
  → VALEN PolicyEngine validates
  → Bundler submits if approved
  → Paymaster (optional) sponsors gas
```

This enables agents without ETH to operate — gas sponsorship becomes a policy-controlled resource.

## Atomicity Requirements

- Evaluation and execution must be **same-block atomic** for auto-approve path
- No gap between "approved" and "executed" where agent could front-run
- Use `nonReentrant` on SettlementGate
- Checks-effects-interactions pattern throughout

---

# Recommended Final Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     OFFCHAIN LAYER                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Agent SDK│  │ Intent API│  │ Policy   │  │ Compliance │ │
│  │ (TS/Rust)│  │ + Queue   │  │ Admin UI │  │ Dashboard  │ │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬─────┘ │
│       │              │             │               │        │
│  ┌────▼──────────────▼─────────────▼───────────────▼────┐  │
│  │              Attestation & Oracle Services           │  │
│  │  TRM │ Webacy │ Chainlink │ EAS │ Market Data       │  │
│  └──────────────────────┬─────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────┘
                            │ attestations / intents
┌───────────────────────────▼─────────────────────────────────┐
│                     ONCHAIN LAYER                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SOLIDITY (Settlement & Standards)           │ │
│  │  SettlementGate │ MandateRegistry │ ComplianceAdapter   │ │
│  │  AgentIdentity  │ ApprovalManager │ EmergencyPause      │ │
│  │  AuditLog       │ TokenHook (ERC-3643 compat)           │ │
│  └──────────────────────────┬──────────────────────────────┘ │
│                              │ cross-contract calls           │
│  ┌──────────────────────────▼──────────────────────────────┐ │
│  │              STYLUS / RUST (Compute Engines)             │ │
│  │  ComplianceEngine │ RiskEngine │ PolicyEngine             │ │
│  │  ProofVerifier    │ ScoreCache                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  Deployed on: Arbitrum Sepolia + Robinhood Chain Testnet     │
│  Production:  Arbitrum One + Robinhood Chain Mainnet         │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Settlement & mandates | Solidity + OpenZeppelin | Ecosystem compatibility, token hooks |
| Compliance/Risk/Policy | Rust + Stylus + OZ Stylus | Compute performance, type safety |
| Agent integration | TypeScript SDK + MCP server | Agent framework compatibility |
| Indexing | The Graph / Allium | Event queries for dashboards |
| Testing | Foundry (Solidity) + arbos-foundry (Stylus) | Native WASM testing |
| Deployment | cargo-stylus + Foundry scripts | Dual-language pipeline |
| AA/Agents | Alchemy bundler (Robinhood Chain) | ERC-4337 agent wallets |

## Deployment Strategy

| Phase | Chain | Purpose |
|-------|-------|---------|
| **Dev** | Arbitrum Sepolia | Rapid iteration, faucet ETH |
| **Hackathon** | Robinhood Chain Testnet | Prize qualification, RWA narrative |
| **Demo** | Both chains simultaneously | Dual-chain deployment impresses judges |
| **Production** | Arbitrum One + Robinhood Mainnet | Enterprise grade |

## Phase 1 Deliverables (Post-Research, Pre-Build)

1. Contract interface specifications (Solidity + Stylus ABIs)
2. Intent schema and verdict schema
3. Mandate data model (ERC-8226-aligned)
4. Test plan with Foundry + arbos-foundry
5. Deployment scripts for both chains
6. Demo scenario: agent attempts regulated RWA trade → VALEN evaluates → approves/blocks

---

# Mistakes To Avoid

## Product Mistakes

| Mistake | Why It Fails |
|---------|-------------|
| Building a DEX | Explicitly not VALEN; judges see hundreds of DEXs |
| Building a wallet | Not VALEN; crowded category |
| Building a Robinhood clone | Misses infrastructure positioning |
| Building an AI chatbot | "Agentic" requires settlement, not conversation |
| Post-action logging only | AgentAudit already owns this; VALEN must **prevent** |
| No human oversight mechanism | Regulatory non-starter for institutional PMF |

## Technical Mistakes

| Mistake | Why It Fails |
|---------|-------------|
| All-Solidity (ignoring Stylus) | Wastes hackathon tech stack signal; expensive risk compute |
| All-Stylus (ignoring Solidity) | Poor token integration; ecosystem friction |
| All-onchain (sanctions API onchain) | Impossible; no HTTP in contracts |
| All-offchain (verdicts offchain) | Not trustless; fails "smart contract quality" criterion |
| Stylus for simple storage contracts | WASM overhead makes it more expensive |
| Skipping Stylus activation | Contracts deploy but don't execute |
| Ignoring program expiration | Production contracts die after ~1 year |
| Unbounded loops in policy engine | DoS vector; gas griefing |
| Fail-open compliance | Security-critical error; regulatory liability |
| No structured reason codes | Fails audit requirements (ERC-8226 mandates this) |

## Hackathon Mistakes

| Mistake | Why It Fails |
|---------|-------------|
| Deploy only on Arbitrum Sepolia | Misses Robinhood prize reservation |
| No deployed contracts | Automatic disqualification |
| No demo video of agent flow | Judges can't evaluate agentic track |
| Ignoring ERC-8004/8226 standards | Looks uninformed on agentic finance trends |
| Over-engineering cross-chain | 3-week timeline; focus on single-chain excellence on TWO chains |

---

# Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stylus SDK version mismatch with chain | High | Pin SDK version; test on target chain early |
| Stylus activation data fee volatility | Medium | Budget activation costs; use `cargo stylus check` |
| Cross-contract call gas overhead (Solidity→Stylus) | Medium | Batch evaluations; cache hot storage reads in Stylus |
| Robinhood Chain testnet instability | Medium | Also deploy Arbitrum Sepolia as fallback demo |
| WASM binary size >24KB compressed | High | Optimize with `cargo stylus check`; strip debug info |
| ERC-8226 still draft | Low | Implement interface-compatible subset; don't depend on final spec |
| Account abstraction complexity | Medium | Defer AA to Phase 2; use EOA for hackathon demo |
| Oracle/attestation trust | High | Multi-source attestations; onchain tolerance checks |
| Reentrancy in SettlementGate | Critical | OZ ReentrancyGuard; checks-effects-interactions |
| Program expiration on production | Medium | Automated keepalive monitoring |

---

# Product Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| "Compliance layer" sounds boring to judges | Medium | Demo with live agent blocking a dangerous transaction |
| AgentAudit AI is direct competitor | Medium | Position as pre-execution gate, not post-action audit |
| No real users in 3 weeks | Expected | Target agent **developers** as users; ship SDK |
| RWA tokens don't exist on testnet yet | Medium | Demo with mock regulated token + real compliance flow |
| Regulatory claims without legal counsel | High | Frame as "infrastructure" not "legal compliance guarantee" |
| Over-promising EU AI Act coverage | Medium | Focus on financial permissioning; AI Act as secondary narrative |

---

# Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Compromised compliance provider key | Critical | Multi-provider support; issuer sovereignty preserved (ERC-8226 model) |
| Mandate cap bypass via batching | High | Cumulative tracking in MandateRegistry |
| Stale attestation acceptance | High | Expiry timestamps enforced onchain |
| Admin key compromise | Critical | Multi-sig admin; timelock on policy changes |
| Stylus-specific vulnerabilities | Medium | Follow OZ Stylus security best practices; deterministic builds |
| Front-running approval transactions | Medium | Commit-reveal for high-value intents |
| Agent wallet theft | High | Mandate bound to agentId, not just wallet; revocable |
| Upgradeability risks | Medium | Immutable core gate; upgradeable policy config only |

---

# Final Recommendations

## 1. Positioning (Win the Narrative)

**VALEN = "The Compliance, Risk and Permission Layer for Agentic Finance"**

Pitch to judges in one sentence:
> "Before any AI agent moves money on Arbitrum or Robinhood Chain, VALEN verifies compliance, scores risk, enforces policy, and gates settlement — onchain, atomically, with immutable audit trails."

## 2. Architecture (Win the Technical Bar)

- **Solidity** for settlement, mandates, token hooks, access control
- **Stylus** for compliance, risk, and policy engines (the compute core)
- **Offchain** for agent SDK, external data, dashboards, human oversight
- **Dual deploy** on Arbitrum Sepolia + Robinhood Chain Testnet

## 3. Standards (Win the Innovation Bar)

- Implement **ERC-8226 (RAMS)** mandate patterns
- Integrate **ERC-8004** agent identity
- Design for **ERC-3643/7943** regulated token hooks
- Support **ERC-4337** account abstraction on Robinhood Chain (Phase 2)

## 4. Demo Scenario (Win the Agentic Prize)

```
1. Register agent onchain (ERC-8004 style)
2. Principal grants mandate: "Agent may trade up to 1000 USDG of TokenX, US jurisdiction, 30 days"
3. Agent submits intent: "Buy 500 USDG of TokenX"
4. VALEN ComplianceEngine: principal KYC ✓, mandate valid ✓, jurisdiction ✓
5. VALEN RiskEngine: score 18 (LOW) → auto-approve
6. VALEN PolicyEngine: within caps ✓, velocity ✓
7. SettlementGate: execute transfer → success
8. Agent submits intent: "Buy 2000 USDG of TokenX" → BLOCKED (exceeds cap)
9. Dashboard shows immutable audit trail
```

## 5. Build Priority (3-Week Timeline)

| Week | Focus |
|------|-------|
| **Week 1** | Solidity core (SettlementGate, MandateRegistry, AuditLog) + Stylus ComplianceEngine |
| **Week 2** | Stylus RiskEngine + PolicyEngine + cross-contract integration + tests |
| **Week 3** | Agent SDK, demo UI, Robinhood Chain deployment, video, submission |

## 6. What Success Looks Like

- [ ] Contracts deployed on Arbitrum Sepolia AND Robinhood Chain Testnet
- [ ] Stylus contracts activated and cached
- [ ] End-to-end agent intent → evaluation → settlement flow demonstrated
- [ ] At least one blocked transaction demonstrated (fail-closed)
- [ ] OpenZeppelin patterns used in both Solidity and Rust
- [ ] Structured reason codes in all rejection paths
- [ ] Immutable audit trail queryable via events
- [ ] README with architecture diagram and deployment addresses
- [ ] Demo video < 3 minutes showing agent flow

---

## Appendix: Key References

| Resource | URL |
|----------|-----|
| Hackathon | https://www.hackquest.io/hackathons/Arbitrum-Open-House-London-Online-Buildathon |
| Arbitrum Docs | https://docs.arbitrum.io/ |
| Stylus Docs | https://docs.arbitrum.io/stylus |
| Stylus SDK | https://github.com/OffchainLabs/stylus-sdk-rs |
| cargo-stylus | https://github.com/OffchainLabs/cargo-stylus |
| Stylus By Example | https://stylus-by-example.org |
| OZ Solidity | https://github.com/OpenZeppelin/openzeppelin-contracts |
| OZ Stylus | https://github.com/OpenZeppelin/rust-contracts-stylus |
| Arbitrum SDK | https://github.com/OffchainLabs/arbitrum-sdk |
| Robinhood Chain | https://docs.robinhood.com/chain |
| Robinhood Faucet | https://faucet.testnet.chain.robinhood.com |
| Arbitrum One RPC | https://arb1.arbitrum.io/rpc |
| ERC-8226 RAMS | https://eips.ethereum.org/EIPS/eip-8226 |
| ERC-8004 | Agent identity standard |
| Webacy Risk Network | https://docs.arbitrum.io/for-devs/third-party-docs/Webacy |

---

*This document completes Phase 1. No code has been written. Implementation begins only after explicit approval to proceed to Phase 2.*
