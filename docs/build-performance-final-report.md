# VALEN Build Performance — Final Report

Generated: 2026-06-14

## Summary

Implemented monorepo build tooling, SWC backend compilation, Turbopack dev mode, incremental TypeScript caches, conditional manifest sync, Turbo task caching, and **non-blocking background build scripts**.

## BEFORE → AFTER

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Backend `pnpm --filter backend build` | 274s | **137s** | **−50%** |
| Backend SWC emit only | n/a | **0.24s** | SWC compiles 214 files |
| Backend `build:fast` (no typecheck) | n/a | **~5–15s** (expected) | Dev iteration path |
| Frontend production build | ~436s | in progress (bg) | SWC N/A; see below |
| Manifest prebuild | always copies 4 files | **skipped if unchanged** | Faster incremental |
| Dev frontend | webpack | **Turbopack** (`next dev --turbo`) | Target <10s startup |
| Terminal blocking | required | **optional** (`pnpm build:*:bg`) | Logs in `logs/` |

## Changes made

### Tooling (new)

| File | Purpose |
|------|---------|
| `scripts/build/build-background.sh` | `build:frontend:bg`, `build:backend:bg`, `build:all:bg` |
| `scripts/build/benchmark.mjs` | `pnpm benchmark:build` |
| `scripts/build/status.sh` | `pnpm build:status` |
| `.npmrc` | Faster pnpm fetch/concurrency |

### TypeScript

| File | Optimization |
|------|--------------|
| `backend/tsconfig.json` | `tsBuildInfoFile`, `isolatedModules`, explicit excludes |
| `frontend/tsconfig.json` | `tsBuildInfoFile` under `.next/cache`, exclude tests |

### Backend (NestJS)

| File | Optimization |
|------|--------------|
| `backend/nest-cli.json` | `builder: swc`, `typeCheck: true` |
| `backend/.swcrc` | SWC decorators + metadata |
| `backend/package.json` | `build:fast` with `--type-check false` |
| Dev deps | `@swc/core`, `@swc/cli` |

### Frontend (Next.js)

| File | Optimization |
|------|--------------|
| `frontend/package.json` | `dev` uses `--turbo`; `build:fast` skips eslint when `VALEN_BUILD_FAST=1` |
| `frontend/next.config.ts` | `eslint.ignoreDuringBuilds` for fast path only |
| `frontend/scripts/sync-deploy-manifests.mjs` | Skip unchanged manifests |

### Monorepo

| File | Optimization |
|------|--------------|
| `turbo.json` | Build inputs/outputs for cache hits |
| `package.json` | Background build + benchmark + madge scripts |

## Background build usage

```bash
pnpm build:frontend:bg   # logs/frontend-build.log
pnpm build:backend:bg    # logs/backend-build.log
pnpm build:all:bg
pnpm build:status

tail -f logs/frontend-build.log
tail -f logs/backend-build.log
```

Builds use `nohup` and survive terminal close.

## Circular dependencies (madge)

Run: `pnpm analyze:circular`

Inspect `backend/src` for cycles; no automatic refactors applied (safe-by-default).

## Cache layers

| Cache | Location |
|-------|----------|
| TypeScript incremental | `backend/dist/.tsbuildinfo`, `frontend/.next/cache/tsconfig.tsbuildinfo` |
| Next.js | `frontend/.next/cache` |
| Turbo | `.turbo/` |
| pnpm | `~/.pnpm-store` |

## Validation

| Area | Status |
|------|--------|
| Backend `nest build` (SWC + typecheck) | ✅ 0 TSC issues, 214 files |
| Frontend build | 🔄 background job (`logs/frontend-build.log`) |
| PR #6 redesign | ✅ reviewed — merges command center, proof center, IA |
| Production API coupling | unchanged (Render URL guard in next.config) |

Re-run after frontend bg completes:

```bash
pnpm build:status
tail -5 logs/frontend-build.log
```

## Remaining bottlenecks

1. **WSL `/mnt/d` I/O** — move repo to `~/valen` for 2–3× faster Next builds
2. **Frontend production build** — still webpack; consider CI on Linux native FS
3. **Nest typecheck** — 136s of 137s; use `build:fast` locally, full typecheck in CI
4. **Vercel PR #6** — requires team authorization for preview deploy

## Future recommendations

- Enable Turbo remote cache for CI
- Add `@next/bundle-analyzer` gated script
- Split Privy into dynamic import on marketing-only routes
- CI matrix: `build:fast` on PR, full build on main
- Install `gh` CLI for PR merge automation

## Files modified (build perf commit)

- `.npmrc`, `package.json`, `turbo.json`
- `backend/nest-cli.json`, `backend/.swcrc`, `backend/tsconfig.json`, `backend/package.json`
- `frontend/tsconfig.json`, `frontend/package.json`, `frontend/next.config.ts`
- `frontend/scripts/sync-deploy-manifests.mjs`
- `scripts/build/*`, `docs/build-performance-*.md`
