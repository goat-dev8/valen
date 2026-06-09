# VALEN Phase 5 — Implementation Roadmap

**Created:** 2026-06-09  
**Status:** Active  
**Authority:** PHASE1–PHASE4 documentation + `VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md`

---

## Dependency Graph

```text
Monorepo Root
  ├── backend (NestJS)
  │     ├── config (requires env: DATABASE_URL, REDIS_URL, PRIVY_*)
  │     ├── database migrations (Supabase)
  │     ├── redis + BullMQ
  │     ├── auth (Privy + API keys) ← blocks API
  │     ├── domain modules ← blocks REST API
  │     ├── workers ← blocks async pipeline
  │     └── observability (Sentry, PostHog)
  ├── contracts (Hardhat + OZ 5.x)
  │     ├── interfaces/libraries
  │     ├── core contracts
  │     └── deploy scripts ← requires PRIVATE_KEY, RPC
  ├── stylus (cargo-stylus + SDK)
  │     ├── common crate
  │     ├── 4 engines
  │     └── activation ← requires PRIVATE_KEY, RPC
  ├── frontend (Vercel) ← depends on API contract
  └── infra (Docker, Render, CI)
```

## Critical Path

1. Monorepo + gitignore + workspace tooling
2. Backend config module (env validation — **blocked until user provides secrets**)
3. Supabase migrations (can use local Postgres via Docker without cloud Supabase initially)
4. Backend database + redis modules
5. Auth module
6. Domain modules + API
7. BullMQ workers
8. Contracts compile + test
9. Stylus compile + check
10. Observability wiring
11. Deploy configs

## Implementation Order (Steps 1–10)

| Step | Deliverable | Depends On | Env Blocker |
|------|-------------|------------|-------------|
| 1 | Monorepo structure | — | None |
| 2 | Backend foundation | Step 1 | None for scaffold |
| 3 | Database migrations | Step 2 | `DATABASE_URL` for cloud; local Docker OK |
| 4 | Redis + BullMQ | Step 2–3 | `REDIS_URL` |
| 5 | Auth (Privy + API keys) | Step 3–4 | `PRIVY_APP_ID`, `PRIVY_SECRET` |
| 6 | REST API (all Phase 4 endpoints) | Step 5 | Partial |
| 7 | Smart contracts (9 contracts) | Step 1 | `PRIVATE_KEY`, RPC for deploy |
| 8 | Stylus (4 engines) | Step 1 | `PRIVATE_KEY`, RPC for deploy |
| 9 | Observability | Step 6 | `SENTRY_DSN`, `POSTHOG_KEY` optional |
| 10 | Deployment configs | All | Render, Supabase cloud URLs |

## Current Phase

**STEP 1 — Monorepo setup** (in progress)

## Environment Values Required (User Must Provide)

Before creating `backend/.env`, `contracts/.env`, or `stylus/.env`:

| Variable | Required For | Status |
|----------|--------------|--------|
| `DATABASE_URL` | Supabase Postgres connection | **WAITING** |
| `SUPABASE_URL` | Supabase client (if used) | **WAITING** |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend privileged DB/API | **WAITING** |
| `REDIS_URL` | BullMQ | Local: `redis://localhost:6379` after Docker |
| `PRIVY_APP_ID` | Human auth | **WAITING** |
| `PRIVY_SECRET` | JWT verification | **WAITING** |
| `ALCHEMY_API_KEY` | Chain RPC | **WAITING** |
| `PRIVATE_KEY` | Contract/Stylus deploy | **WAITING** |
| `SENTRY_DSN` | Error tracking | Optional for dev |
| `POSTHOG_KEY` | Analytics | Optional for dev |

**Policy:** No `.env` files with invented values. Local Docker Postgres/Redis can use documented local URLs only after user confirms local dev approach.
