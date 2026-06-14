# VALEN Build Performance Report (Baseline)

Generated: 2026-06-14

## Environment

- OS: WSL2, workspace on `/mnt/d/route/valen` (cross-filesystem I/O penalty)
- Node: >=20, pnpm 9.15, turbo 2.3
- Branch audited: `feat/world-class-dashboard-landing-redesign` (PR #6)

## Baseline timings (before optimizations)

| Target | Duration | Exit | Dominant phase |
|--------|----------|------|----------------|
| `pnpm --filter backend build` | **274s** | 0 | NestJS `tsc` emit |
| `pnpm --filter frontend build` | **~436s** | 1* | Next.js compile ~252s + typecheck + static gen |
| `pnpm build` (turbo) | not fully measured | — | Sequential frontend + backend |

\* Frontend TypeScript/lint passed; failed at WSL `.next` rename (`500.html` ENOENT) — environmental, not type error.

### Bottleneck breakdown

| Layer | Share | Notes |
|-------|-------|-------|
| Next.js webpack compile | ~60% frontend | 35 app routes, Privy/viem heavy graph |
| Next.js typecheck + eslint | ~25% frontend | Runs after compile |
| NestJS TypeScript checker | ~95% backend (pre-SWC) | Decorator metadata + 214 files |
| Static page generation | ~10% frontend | 35 pages |
| Manifest sync prebuild | <1% | 4 JSON copies (now skipped if unchanged) |
| pnpm install on `/mnt/d` | High variance | 8–15 min cold |

## Biggest offenders

1. **NestJS default `tsc` builder** — 274s backend builds
2. **Next.js production build on WSL `/mnt/d`** — I/O bound `.next` writes
3. **No background build workflow** — terminal blocked during 7+ min builds
4. **Duplicate onboarding/setup** — not build-related but slows iteration
5. **Turbo cache** — underconfigured inputs/outputs

## Commands used

```bash
/usr/bin/time -f 'REAL=%e' pnpm --filter backend run build
/usr/bin/time -f 'REAL=%e' pnpm --filter frontend run build
node scripts/build/benchmark.mjs --quick
```

See `docs/build-performance-final-report.md` for post-optimization results.
