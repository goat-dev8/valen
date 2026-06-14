# Execution Fix Report

Date: 2026-06-14

## Issue #1 — Command Center wrong global data

**Root cause:** Dashboard summary returned a single primary agent's budget (`agent_budget_status_v` for one agent) while KPIs implied organization totals.

**Fix:** Added `organizationStats` to `/dashboard/summary` aggregating:
- Active agents (all org)
- USDC budget cap/spent/remaining (sum across agents)
- Governance totals (executions, success rate, proofs, x402 settlements)

**Files:** `backend/src/modules/dashboard/dashboard.service.ts`, `frontend/src/types/api.ts`, `frontend/src/components/command-center/account-kpi-strip.tsx`, `frontend/src/app/dashboard/page.tsx`

**Before:** USDC Budget showed one agent's remaining; Active Agents from paginated query.

**After:** KPIs read `organizationStats` from `/dashboard/summary` (org-wide aggregation).

**Deploy:** Backend must be deployed to Render for `organizationStats` to be available.

---

## Issue #2 — Governed Assets display

**Decision:** Show settlement-ready assets only (Option A curated from registry): USDC on Arbitrum + USDG + Robinhood stock tokens on testnet. Excludes gas/legacy duplicates.

**Files:** `frontend/src/lib/known-assets.ts` (`governedHomeAssets`), `frontend/src/components/command-center/asset-strip.tsx`

---

## Issue #3 — Wrong asset type after execution (TSLA → USDC)

**Root cause:** `formatProofAmount()` defaulted symbol to `USDC` when human amounts like `"1"` were below base-unit threshold.

**Fix:** Resolve symbol from chain + asset address / Robinhood metadata via `resolveExecutionAsset()` and `formatExecutionAmount()`.

**Files:** `frontend/src/lib/token-amount.ts`, `frontend/src/lib/execution-display.ts`, execution detail components

**Before:** Execution amount displayed `1 USDC` for TSLA transfer.

**After:** Displays `1 TSLA` (and correct symbol for all assets).

---

## Issue #4 — Missing Robinhood tx hash

**Root cause:** Tx hash existed in settlement panel but was buried; no copy/explorer prominence in header.

**Fix:** Execution header shows settlement tx with copy button, explorer link (Robinhood explorer via `explorerTxUrl`), chain badge, settlement status.

**Files:** `frontend/src/components/execution/execution-detail-view.tsx`

---

## Issue #5 — Live status stale

**Root cause:** Settlement query had no polling; dashboard summary cache was long-lived.

**Fix:**
- `useExecutionSettlement` polls every 4s until tx hash + settled status
- `useDashboardSummary({ live: true })` polls every 12s on Command Center
- `useExecutions(..., { live: true })` polls every 8s for pipeline strip

**Files:** `frontend/src/hooks/use-valen-api.ts`, `frontend/src/app/dashboard/page.tsx`

---

## Issue #6 — Execution details UX

**Fix:** Redesigned into five sections: Execution Header, Governance Pipeline, Execution Summary, Evidence (hashes + explorer), Timeline + Compliance/Risk.

**Files:** `frontend/src/components/execution/execution-detail-view.tsx`, `frontend/src/app/dashboard/executions/[executionId]/page.tsx`

---

## Issue #7 — Full execution flow audit

**Status:** Asset formatting and explorer links fixed at shared layer. Per-asset browser verification requires wallet-connected intent submission for each template (USDC, USDG, TSLA, AMZN, PLTR, NFLX, AMD).

**Verified in browser (local):**
- Execution list loads Robinhood + Arbitrum executions
- TSLA execution `0b75d3aa…` shows settlement tx hash in settlement section
- After frontend reload: amount symbol fix + redesigned layout apply

---

## Remaining risks

1. **Backend deploy required** for org-level KPI aggregation on production API (`organizationStats`).
2. **Redis ECONNRESET** on Render may briefly stale dashboard cache (5s TTL).
3. Full 7-asset E2E matrix needs manual wallet signing per asset in browser.

## Files changed (summary)

| Area | Files |
|------|-------|
| Backend summary | `dashboard.service.ts`, `dashboard.service.spec.ts` |
| Amount display | `token-amount.ts`, `execution-display.ts`, `known-assets.ts` |
| Command Center | `account-kpi-strip.tsx`, `asset-strip.tsx`, `page.tsx` |
| Execution UX | `execution-detail-view.tsx`, `executions/[executionId]/page.tsx` |
| Live polling | `use-valen-api.ts` |
| Types | `api.ts` |
