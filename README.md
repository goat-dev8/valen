# VALEN

**The Compliance, Risk and Permission Layer for Agentic Finance**

Production monorepo for VALEN — agent intent validation, compliance, risk scoring, policy enforcement, and settlement approval across Arbitrum and Robinhood Chain.

## Repository Structure

| Package | Description |
|---------|-------------|
| `frontend/` | Next.js dashboard (Vercel) |
| `backend/` | NestJS API, workers, scheduler (Render) |
| `contracts/` | Solidity core contracts (Hardhat + OpenZeppelin 5.x) |
| `stylus/` | Rust Stylus engines (Compliance, Risk, Eligibility, Policy) |
| `infra/` | Docker, Render, CI/CD, runbooks |
| `scripts/` | Bootstrap, deploy, verify, ops |
| `docs/` | Architecture, API, implementation summary |

## Prerequisites

- Node.js 20+ (`nvm use`)
- pnpm 9+
- Docker Desktop (local Postgres + Redis)
- Rust 1.91+ with `wasm32-unknown-unknown` (Stylus)
- [cargo-stylus](https://github.com/OffchainLabs/cargo-stylus)

## Quick Start

```bash
pnpm install
pnpm docker:up
# Provide real env values — see docs/summary.md
pnpm dev
```

## Documentation

- [Implementation Summary](docs/summary.md)
- [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- Phase 1–4 specifications in repository root (`PHASE1_*.md`, `VALEN_*.md`)

## Official Sources

- [Arbitrum Docs](https://docs.arbitrum.io/)
- [Stylus Docs](https://docs.arbitrum.io/stylus)
- [NestJS](https://docs.nestjs.com/)
- [Supabase](https://supabase.com/docs)
- [Privy](https://docs.privy.io/)
