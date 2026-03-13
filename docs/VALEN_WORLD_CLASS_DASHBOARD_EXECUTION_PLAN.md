# VALEN World-Class Dashboard Execution Plan

**Document status:** Definitive implementation blueprint (Phase 2 of redesign)  
**Version:** 1.0  
**Date:** 2026-06-14  
**Authors:** Principal Product Designer / UX Architect / Frontend Systems Lead  
**Scope:** Complete UX/UI/system redesign from current R1–R8 partial state → world-class Agent Command Center  
**Prerequisite docs read:** `VALEN_COMPLETE_DOCUMENTATION.md`, `VALEN_DASHBOARD_REDESIGN_MASTER_PLAN.md`, `docs/summary.md`, architecture/contract/backend masterplans, E2E reports, live codebase, YieldGeko reference screenshots  
**Rule:** This document does **not** implement code. It is the exhaustive, implementation-ready specification.

---

## Executive Summary

### What VALEN must communicate in 10 seconds

> **"I have governed AI agents. They operate under rules I signed. They manage budgets. They execute payments and tokenized assets. Every action produces a public, verifiable proof."**

### Current state (post R1–R8 partial implementation)

VALEN **implements** the full product (Phases A–I) but **still reads** as a multi-page admin dashboard with scattered concepts. Partial redesign improved navigation, Proof Center, and Mission Control composition — but the experience is **not yet** a unified Agent Command Center with natural-language command surface, animated governance pipeline, or premium OS-level narrative.

### Target state

**VALEN = Operating System for Governed Autonomous Finance**

One primary surface — the **Agent Command Center** — where users:
- See agent + governance + budget + proof status at a glance
- Type or select intents ("Pay 25 USDC through x402", "Buy 3 TSLA")
- Watch Intent → Policy → Budget → Risk → Execution → Proof animate in real time
- Drill into secondary panels only when needed

### Reference study: YieldGeko (patterns only — NOT features)

| YieldGeko pattern | VALEN adaptation |
|-------------------|------------------|
| Multi-step Studio wizard with numbered stepper | **Agent Studio** wizard: Identity → Rules → Authority → Fund → Publish |
| Agent list as hero with status, APY, protocols | **Agent Command Center** hero: agents with governance/budget/proof status |
| "Agent Crew" storytelling (Strategy → Risk → Execution agents) | **Governance Pipeline** storytelling: Intent → Policy → Budget → Risk → Settlement → Proof |
| Central search / command bar (Ctrl+K) | **Command Surface** with NL input + quick actions + keyboard palette |
| Pre-deploy checklist with Required/Optional gates | **Readiness Gates** on Command Center (wallet, mandate, policy, budget) |
| Visual capital flow (left → right pipeline cards) | **Animated pipeline strip** on command execution |
| Progressive disclosure in cards | Collapse Advanced nav; surface only P1–P6 on Command Center |
| Premium dark theme | **Ultra Premium Light** — Linear/Stripe/Vercel density on white |

**Do NOT copy:** yield strategies, APY, protocol library, Venice AI, subscription model, smart account ERC-4337 flows, or DeFi-specific business logic.

---

## Table of Contents

1. [Complete UX Audit](#1-complete-ux-audit)
2. [Complete UI Audit](#2-complete-ui-audit)
3. [Navigation Audit](#3-navigation-audit)
4. [Information Architecture](#4-information-architecture)
5. [New Dashboard Layout](#5-new-dashboard-layout)
6. [Command Surface Design](#6-command-surface-design)
7. [Agent Center Design](#7-agent-center-design)
8. [Assets Experience](#8-assets-experience)
9. [Proof Experience](#9-proof-experience)
10. [ERC-8004 Experience](#10-erc-8004-experience)
11. [x402 Experience](#11-x402-experience)
12. [Robinhood Assets Experience](#12-robinhood-assets-experience)
13. [Component Library](#13-component-library)
14. [Motion System](#14-motion-system)
15. [Design Tokens](#15-design-tokens)
16. [Mobile Strategy](#16-mobile-strategy)
17. [Tablet Strategy](#17-tablet-strategy)
18. [Accessibility](#18-accessibility)
19. [Empty States](#19-empty-states)
20. [Loading States](#20-loading-states)
21. [Error States](#21-error-states)
22. [User Journey Maps](#22-user-journey-maps)
23. [Judge Experience](#23-judge-experience)
24. [First-Time User Experience](#24-first-time-user-experience)
25. [Power User Experience](#25-power-user-experience)

---

# 1. Complete UX Audit

## 1.1 Audit methodology

Each route audited against: **Purpose clarity**, **Hierarchy**, **Flow friction**, **Missing states**, **Confusion points**, **Judge risk**, **Mobile risk**.  
Sources: codebase review (38 routes), partial R1–R8 implementation, documentation, YieldGeko reference patterns.

## 1.2 Global UX problems

| ID | Problem | Severity | Evidence |
|----|---------|----------|----------|
| G-01 | **No single command-centered home** — Mission Control is improved but still a scroll of sections, not an OS | Critical | `dashboard/page.tsx` stacks 10+ blocks |
| G-02 | **No natural-language command input** — user must navigate to 4+ pages for common actions | Critical | No command parser UI exists |
| G-03 | **Governance pipeline invisible at product level** — pipeline only on execution detail | Critical | `PipelineTimeline` buried in `/executions/[id]` |
| G-04 | **Agent identity not the hero** — agents are a nav item, not the mental model center | High | YieldGeko puts agents first; VALEN puts "Mission Control" first |
| G-05 | **Setup duplicated** — SetupModal + inline checklist on incomplete setup | Medium | `dashboard/page.tsx` |
| G-06 | **x402 feels bolted on** — separate nav item, not integrated into command flow | High | `/dashboard/payments` isolated |
| G-07 | **ERC-8004 under-narrated** — badge on agent detail only | High | Not on Command Center or proof hero |
| G-08 | **Robinhood assets URL confusion** — nav → `/assets` redirects to `/demo/robinhood` | Medium | `LEGACY_ROUTE_REDIRECTS` unused/inverted |
| G-09 | **Engineer vocabulary persists** — UUIDs, mandate hashes, execution IDs first | Medium | Agent detail, authority page |
| G-10 | **Render/hosting jargon in user copy** | Medium | `privy-login-button`, `governance`, `treasury`, `authority` |
| G-11 | **No global search / command palette** — CSS exists, not wired | High | `.app-header-search` unused |
| G-12 | **Marketing ↔ dashboard visual disconnect** — landing is marketing-heavy; dashboard is utilitarian cards | Medium | Different typography rhythm |
| G-13 | **Advanced pages still feel like separate product** — 12 admin routes | Low (by design) | Judge mode helps but IA still heavy |
| G-14 | **Onboarding page redundant** with SetupModal | Low | `/onboarding` still live |
| G-15 | **No "autonomous agent" storytelling** — user sees forms, not agent operating | Critical | Missing Agent Crew / autonomy loop equivalent |

## 1.3 Page-by-page UX audit (every route)

### Public routes

| Route | UX score | Problems | Missing states |
|-------|----------|----------|----------------|
| `/` | 6/10 | Hero CTA "Create Agent" vs "See Live Proof" hierarchy unclear; mock vs live product gap closing but dashboard preview still weak | No embedded command surface demo |
| `/login` | 5/10 | No "view proofs without login" link; Render wake-up message breaks trust | Account provisioning loading |
| `/onboarding` | 4/10 | Duplicates SetupModal; legacy full-page | Should redirect or merge |
| `/agents/[agentSlug]` | 7/10 | Good public identity; weak proof prominence; no track record timeline | Empty proofs, pending ERC-8004 explain |
| `/proofs/pack` | 8/10 | Strong hero post-R3; needs command-center link back | Empty pack per kind |
| `/proofs/executions/[id]` | 8/10 | Verification steps added; pipeline not animated | Pending settlement |
| `/proofs/refusals/[id]` | 8/10 | Refusal as success state needs stronger framing | — |
| `/proofs/payments/[id]` | 7/10 | x402 proof improved; payment flow diagram absent on public page | Refused payment variant |

### Dashboard — Command & agents

| Route | UX score | Problems | Missing states |
|-------|----------|----------|----------------|
| `/dashboard` | 6/10 | Too many sections; no command input; agent not P1 | Empty agents, all gates complete celebration |
| `/dashboard/agents` | 7/10 | Card grid OK; no fleet status summary | Zero agents CTA |
| `/dashboard/agents/[agentId]` | 5/10 | Tabs added but still dense; UUID-first; mandate hash visible | Suspended/revoked agent UX |
| `/dashboard/register-agent` | 7/10 | Type-aware flow good; no Studio wizard integration | Post-create "what next" weak |

### Dashboard — Actions

| Route | UX score | Problems | Missing states |
|-------|----------|----------|----------------|
| `/dashboard/executions/new` | 7/10 | 4-step wizard good; not reachable from command input; template cards technical | No matching mandate inline fix |
| `/dashboard/executions` | 6/10 | Technical log correctly demoted; mobile cards added | Filter empty |
| `/dashboard/executions/[id]` | 7/10 | Pipeline timeline good but static; proof CTA should be primary | In-flight polling UX |
| `/dashboard/executions/[id]/proof` | 6/10 | Duplicates public proof | — |
| `/dashboard/payments` | 6/10 | x402 diagram added; still isolated from agent context | Initiated-not-executed |
| `/dashboard/assets` → redirect | 4/10 | Redirect breaks mental model | — |
| `/dashboard/demo/robinhood` | 7/10 | Asset cards good; allowed/refused story clear | No per-asset mandate status |
| `/dashboard/demo/robinhood/[ticker]` | 6/10 | Per-ticker OK; deep link from command missing | — |

### Dashboard — Control

| Route | UX score | Problems | Missing states |
|-------|----------|----------|----------------|
| `/dashboard/proofs` | 8/10 | Outcome-first feed strong | Historical failure filter |
| `/dashboard/policies` | 6/10 | List only; no template gallery on list | Empty policies |
| `/dashboard/policies/new` | 7/10 | Template picker OK; version workflow opaque | — |
| `/dashboard/policies/[id]` | 7/10 | Plain English rules added; JSON still intimidating | Draft vs active |
| `/dashboard/authority` | 5/10 | 755-line monolith; dev notes mixed with user flow; encoding bugs | Wrong chain wallet |
| `/dashboard/budgets` | 7/10 | Focused center good; vault scope warning honest | Zero budget |

### Dashboard — Advanced (12 routes)

| Route | UX score | Top issue |
|-------|----------|-----------|
| `/dashboard/approvals` | 7/10 | Needs link back to command |
| `/dashboard/settlements` | 5/10 | Too technical for default users |
| `/dashboard/compliance` | 5/10 | Enterprise-only clarity |
| `/dashboard/audit` | 6/10 | Table-heavy |
| `/dashboard/governance` | 4/10 | Render operator jargon |
| `/dashboard/treasury` | 4/10 | Render operator jargon |
| `/dashboard/contracts` | 5/10 | Dev tool |
| `/dashboard/webhooks` | 6/10 | Dev tool |
| `/dashboard/team` | 6/10 | Standard |
| `/dashboard/settings` | 7/10 | Judge mode toggle good |
| `/dashboard/resources` | 5/10 | Dev-focused |
| `/dashboard/wallets` | — | Redirect only |

## 1.4 Flow problems (user journeys)

| Flow | Steps today | Ideal steps | Friction |
|------|-------------|-------------|----------|
| First proof | 7+ pages | 1 command surface + 3 gates | Page hopping |
| USDC execute | Nav → New Action → 4 steps | Command: "Pay 0.001 USDC" | Template selection cognitive load |
| TSLA refused demo | Nav → Assets → template link → wizard | Command: "Refused TSLA demo" | Too many clicks for judges |
| x402 payment | Nav → Payments → initiate → execute | Command: "Pay 25 USDC x402" | Disconnected from agent |
| Mandate sign | Nav → Authority → scroll → form | Studio step or command: "Sign mandate" | Monolithic page |
| ERC-8004 register | Agent detail → badge action | Command Center identity card | Hidden |
| View latest proof | Command hero link OK | Command: "Show latest proof" | No NL |

## 1.5 Missing states (global)

- Command surface: idle, parsing, disambiguation, blocked (gate), executing, proof-ready
- Agent: draft, activating, active, suspended, revoked — fleet summary on command center
- Mandate: unsigned, signing, active, expiring, revoked
- Budget: unfunded, low, exhausted, paused
- Proof: generating, published, verification-failed
- x402: initiated, executing, settled, refused-budget
- ERC-8004: unbound, pending, registered (future)
- Network: wrong chain, unsupported chain, Privy not connected

---

# 2. Complete UI Audit

## 2.1 Visual identity gaps

| Area | Current | Target |
|------|---------|--------|
| Theme | Light cards on `#f8f9fb`, mixed hardcoded hex | Ultra Premium Light — white canvas, subtle borders, elevation system |
| Typography | Inter Tight + Instrument Serif (partial) | Stronger scale: display serif for hero only; UI sans for density |
| Color | `#007dfc` primary, `#c9f31d` accent underused | Restrained blue + proof green + refusal red + amber pending |
| Density | Marketing spacious vs dashboard cramped | Unified 8px grid, consistent card padding `24px` |
| Icons | Lucide + token SVGs | Token SVGs at 32/40/48; Lucide 16/20 stroke-1.5 |
| Charts | Minimal | Sparklines for budget spend, proof count (optional P2) |

## 2.2 Component-level UI issues

| Component | Issue | Fix |
|-----------|-------|-----|
| `CommandHero` | Static gradient card; not a command input | Replace with Command Surface shell |
| `CommandStatusRow` | 4 equal cards — no agent prominence | Reorder: Agent first, larger |
| `ProofFeed` | Good outcome cards; no animation on new proof | Motion on insert |
| `PipelineTimeline` | Vertical list; not hero pipeline strip | New `GovernancePipelineStrip` horizontal animated |
| `Erc8004Badge` | Small badge | Identity card with trust signals |
| `BudgetMeter` | Functional bar | Premium meter with cap/spent/remaining + top-up inline |
| `StatusBadge` | Human labels added | Outcome-colored pills (settled/refused/pending) |
| `Sidebar` | 6 sections still many items | Collapse to 4: Command, Agents, Proofs, Control (+ More drawer) |
| `MobileNav` | 5 tabs OK | Add command FAB or top search |
| Tables | Desktop-only on 8+ pages | Card fallback pattern (executions done) |
| `SetupModal` | Generic checklist | Branded Agent Studio intro modal |

## 2.3 Inconsistencies

- Border radius: `rounded-2xl` vs `rounded-3xl` mixed
- Button variants: `app-btn-primary`, `btn-proof`, marketing `btn-primary` — unify
- Page titles: "Mission Control" vs "Command" vs nav labels
- Chain labels: sometimes `chainName()`, sometimes badge only
- Em dash encoding bug `ÔÇö` in authority page

## 2.4 Premium benchmark gap (vs Linear / Stripe)

| Dimension | VALEN today | Target |
|-----------|-------------|--------|
| Command palette | None | ⌘K global |
| Empty space | Uneven | Intentional whitespace |
| Micro-interactions | Minimal | Subtle hover, focus, success |
| Data hierarchy | UUID-first | Human-first, UUID in disclosure |
| Single focal point | Multiple CTAs | One command input |

---

# 3. Navigation Audit

## 3.1 Current nav (6 sections, 22 items)

```
Command (1) → Agents (2) → Actions (3) → Proofs (2) → Control (3) → Advanced (12)
```

**Problems:**
- Actions duplicate what Command Surface should handle
- "Mission Control" label ≠ "Agent Command Center" narrative
- Public Proof Pack in sidebar breaks app/public boundary
- Advanced hidden in judge mode but still 12 routes exist
- No breadcrumbs; deep links lose context

## 3.2 Proposed nav (reduced)

```
┌─────────────────────────────────────┐
│  VALEN                              │
│  [Agent Command Center]  ← primary   │
│  Agents                             │
│  Proofs                             │
│  Control ▸ (Policies, Authority,    │
│            Budgets, Assets)          │
│  ─────────────                      │
│  More… (drawer: Advanced + Settings)│
└─────────────────────────────────────┘
```

**Remove from primary nav:**
- New Governed Action → Command Surface
- x402 Payments → Command Surface + agent actions
- Tokenized Assets → Control submenu or Command quick action
- Register Agent → Agents page CTA + Command
- Execution Log → More drawer only
- Public Proof Pack → Proofs page CTA (not sidebar)

## 3.3 Redirect map (fix)

| Route | Behavior |
|-------|----------|
| `/dashboard/wallets` | → `/dashboard/authority` (keep) |
| `/dashboard/assets` | Serve assets hub OR redirect consistently |
| `/dashboard/demo/robinhood` | Canonical assets URL `/dashboard/assets` |
| `/onboarding` | → Command Center + SetupModal |
| `/dashboard` | Alias OK; label → "Command Center" |

Wire `LEGACY_ROUTE_REDIRECTS` in middleware or layout.

---

# 4. Information Architecture

## 4.1 Mental model (OS layers)

```
Layer 0: Agent Command Center     ← 80% of user time
Layer 1: Agent Detail / Studio    ← agent lifecycle
Layer 2: Proof Center + Public    ← outcomes
Layer 3: Control Centers          ← policies, authority, budgets, assets
Layer 4: Advanced / Evidence    ← audit, settlements, compliance, dev
```

## 4.2 Content taxonomy

| Entity | Primary home | Secondary |
|--------|--------------|-----------|
| Agent | Command Center fleet + `/agents/[id]` | Public `/agents/[slug]` |
| Intent/Execution | Command Surface → pipeline drawer | Execution log |
| Proof | Proof Center + Command feed | Public `/proofs/*` |
| Policy | Control → Policies | Agent tab |
| Mandate | Control → Authority | Agent tab |
| Budget | Command status + Budgets | Agent detail |
| Asset (RH) | Assets hub | Per-ticker |
| x402 Payment | Command action | Payments page (advanced) |
| ERC-8004 | Agent identity card | Public profile |
| Identity/Trust | Command Center + proof header | — |

## 4.3 Priority stack (dashboard)

1. **Agent Status** — fleet health, active agent, readiness
2. **Governance Status** — policy + mandate + authority gates
3. **Budget Status** — USDC cap/spent/remaining
4. **Assets** — Robinhood token row with logos
5. **Proofs** — latest outcomes feed
6. **Recent Activity** — in-flight pipeline compact

Everything else: drawer, More menu, or agent detail tabs.

---

# 5. New Dashboard Layout

## 5.1 Agent Command Center wireframe (desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│ Header: Org · Chain · Wallet · ⌘K Search · Proof pill          │
├──────────────────────────────────────────────────────────────────┤
│ ┌─ Status Strip ─────────────────────────────────────────────────┐│
│ │ [Agent ▼] [Governance ✓] [Budget 842 USDC] [Identity pending]││
│ └────────────────────────────────────────────────────────────────┘│
│ ┌─ COMMAND SURFACE (hero) ───────────────────────────────────────┐│
│ │ 🔍 "Pay 25 USDC through x402"              [Run] [⌘↵]         ││
│ │ Quick: USDC · TSLA refused · x402 · Budget · Register agent    ││
│ └────────────────────────────────────────────────────────────────┘│
│ ┌─ Governance Pipeline (live / last run) ────────────────────────┐│
│ │ Intent → Policy → Budget → Risk → Execution → Proof          ││
│ │ ●──────●──────●──────◐──────○──────○  (animated)             ││
│ └────────────────────────────────────────────────────────────────┘│
│ ┌─ Agents (2 col) ────────┐ ┌─ Proof Feed ─────────────────────┐│
│ │ Agent cards w/ status   │ │ Outcome cards + share            ││
│ │ ERC-8004 · budget · last│ │                                  ││
│ └─────────────────────────┘ └──────────────────────────────────┘│
│ ┌─ Assets strip ───────────────────────────────────────────────┐│
│ │ [USDC][USDG][TSLA][AMZN][PLTR][NFLX][AMD] + chain badges     ││
│ └────────────────────────────────────────────────────────────────┘│
│ ┌─ Recent Activity (collapsible) ──────────────────────────────┐│
│ └────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## 5.2 Section specs

| Section | Height priority | Collapse when |
|---------|-----------------|---------------|
| Status Strip | Fixed 56px | Never |
| Command Surface | 120–160px | Never |
| Pipeline Strip | 80px | Idle (show last run ghost) |
| Agents + Proofs | flex 1 | — |
| Assets strip | 72px | Optional collapse |
| Recent Activity | 200px max | Judge mode default collapsed |

## 5.3 Remove from Command Center

- Duplicate setup checklist (keep modal only)
- 12-stat operator drawer (move to More → Operator)
- Three separate ProofFeedCompact cards (merge into feed)
- "Judge Demo" label (rename → "Quick actions")

---

# 6. Command Surface Design

## 6.1 Definition

The **Command Surface** is the primary interaction layer of VALEN — a composable input + suggestion + execution preview system, not merely a hero card.

## 6.2 Input modes

| Mode | Behavior |
|------|----------|
| **Natural language** | Parse intent → map to template + params |
| **Slash commands** | `/pay`, `/transfer`, `/budget`, `/proof`, `/agent`, `/mandate` |
| **Quick chips** | Prefilled demo paths (USDC allowed, TSLA refused, x402) |
| **⌘K palette** | Search agents, actions, proofs, pages |

## 6.3 Supported command intents (v1 — map to existing API)

| User input example | Resolved action | API |
|--------------------|-----------------|-----|
| "Pay 25 USDC through x402" | x402 initiate prefill | `POST x402/initiate` |
| "Buy 3 TSLA" | Robinhood template + amount | `POST executions` |
| "Transfer USDG" | USDG template | `POST executions` |
| "Increase budget to 1000" | Budget top-up modal | budget API |
| "Register ERC-8004 identity" | ERC-8004 register | `POST erc8004/register` |
| "Create a new governed agent" | → Agent Studio step 1 | `POST agents` |
| "Show proof for latest transaction" | Navigate latest proof | dashboard summary |
| "Run USDC demo" | template `arbitrum-usdc` | `POST executions` |
| "Refused TSLA" | template `robinhood-tsla-refused` | `POST executions` |

## 6.4 Command flow UX

```
Type → Parse preview card → Gate check (inline) → Confirm → Pipeline animation → Proof card
```

**Parse preview card shows:**
- Agent (auto-selected or picker)
- Action type plain English
- Asset with icon
- Chain badge
- Mandate scope summary (if applicable)
- Blockers as amber inline alerts (not separate page)

## 6.5 Governance Pipeline Strip (animated)

Stages (match backend pipeline):

```
Intent → Policy Check → Budget Check → Risk Review → Execution → Proof Generation
```

| Stage | Visual | Data source |
|-------|--------|-------------|
| Intent | Blue pulse | execution.status `created` |
| Policy | Blue/green | compliance + policy events |
| Budget | Green/amber | budget evaluation |
| Risk | Green/red | risk events |
| Execution | Green | settlement tx |
| Proof | Blue proof icon | proof URL available |

**Animation rules:**
- Duration: 300ms ease per stage transition
- In-flight: subtle shimmer on active stage
- Refusal: stop at failed stage, red pulse, proof link still appears
- Reduced motion: instant state change, no shimmer

## 6.6 Component architecture

```
components/command-center/
  command-surface.tsx          # Input + parser + submit
  command-preview-card.tsx     # Parsed intent review
  command-quick-actions.tsx    # Chips (replaces demo-action-strip)
  governance-pipeline-strip.tsx # Animated horizontal pipeline
  command-palette.tsx          # ⌘K modal
  command-gate-banner.tsx      # Inline blockers
  status-strip.tsx             # P1–P4 status (replaces command-status-row)
```

## 6.7 Parser implementation note

**Phase 1 (UI):** Rule-based parser mapping keywords → `INTENT_TEMPLATES` + regex amounts  
**Phase 2 (optional):** LLM assist for disambiguation (out of scope unless requested)  
**No new backend required** for Phase 1 — client-side only

---

# 7. Agent Center Design

## 7.1 Agents list (`/dashboard/agents`)

**Layout:** Table on desktop (YieldGeko-inspired), cards on mobile

| Column | Content |
|--------|---------|
| Agent | Avatar placeholder + name + type badge |
| Status | active / suspended / draft |
| Governance | policy ✓ mandate ✓ |
| Budget | USDC remaining bar |
| Identity | ERC-8004 pill |
| Last proof | Link + outcome badge |
| Actions | Run · View · ⋮ |

**Empty state:** "Create your first governed agent" → Agent Studio

## 7.2 Agent detail (`/dashboard/agents/[id]`)

**Tab structure (keep, refine):**

| Tab | Content |
|-----|---------|
| **Overview** | Readiness gates, ERC-8004 identity card, budget meter, last proof |
| **Governance** | Policy assign, mandates with `MandateScopeSummary`, authority link |
| **Credentials** | API keys (renamed from "API Keys") |
| **Activity** | Executions + proofs merged timeline |

**Remove from default view:** Raw UUID as primary; move to "Technical" disclosure accordion

## 7.3 Agent Studio (new — YieldGeko Studio pattern)

**Route:** `/dashboard/agents/studio` or modal from Command Center

| Step | Title | Content |
|------|-------|---------|
| 1 | **Identity** | Name, description, type, capabilities, slug preview |
| 2 | **Rules** | Policy template picker or assign existing |
| 3 | **Authority** | Wallet verify + mandate sign (embedded, not redirect) |
| 4 | **Budget** | USDC cap setup + top-up |
| 5 | **Publish** | Review checklist → Activate agent |

**Checklist gates (Publish step):**
- Required: Active policy, verified wallet, signed mandate
- Optional: ERC-8004 register, API key, budget fund

Replace standalone `/register-agent` flow — redirect to Studio step 1.

## 7.4 Agent storytelling (Governance Crew)

Visual equivalent of YieldGeko "Agent Crew" — **Governance Actors**:

```
[Your Mandate] → [Policy Engine] → [Budget Guard] → [Settlement Relayer] → [Proof Recorder]
```

Static on agent detail; animates during command execution on Command Center.

---

# 8. Assets Experience

## 8.1 Unified Assets Hub

**Canonical route:** `/dashboard/assets` (stop redirect-only stub)

**Layout:**
- Hero: "Governed tokenized assets on Robinhood Testnet + USDC on Arbitrum"
- Asset grid: 7 tokens with official SVGs from `/public`
- Per asset: Allowed demo · Refused demo · Last proof link
- Chain context always visible

## 8.2 Asset card spec

```
┌─────────────────────┐
│ [TSLA icon]  TSLA   │
│ Robinhood Testnet   │
│ Last: Settled ✓     │
│ [Run allowed] [Refused demo] │
└─────────────────────┘
```

## 8.3 Command integration

- Command: "Buy 3 TSLA" → prefill ticker template
- Asset strip on Command Center → click opens asset drawer with actions

## 8.4 Token icon map (mandatory)

| Symbol | File |
|--------|------|
| USDC | `/usdc.svg` |
| USDG | `/usdg.svg` |
| TSLA | `/tsla.svg` |
| AMZN | `/amzn.svg` |
| PLTR | `/pltr.svg` |
| NFLX | `/nflx.svg` |
| AMD | `/amd.svg` |

Use `AssetIcon` at 32px (lists), 40px (cards), 48px (hero).

---

# 9. Proof Experience

## 9.1 Proof as product outcome

Every execution UI must answer: **Verified · Proven · Auditable**

## 9.2 Proof Center (`/dashboard/proofs`)

Enhancements:
- Default sort: newest first
- Filter: Settled / Refused / In progress / x402
- Historical failure toggle (judge mode)
- Share bar on each card
- Batch "Copy proof pack link"

## 9.3 Public proof pages

**Unified proof shell:**
```
┌─ Proof header ─────────────────────┐
│ Outcome badge · Asset icon · Chain │
│ Share bar (sticky mobile)          │
├─ Verification steps ───────────────┤
├─ Pipeline timeline (compact) ──────┤
├─ On-chain evidence ────────────────┤
├─ ERC-8004 identity panel ──────────┤
└─ Mandate hash (disclosure) ────────┘
```

**Outcome framing:**
- Settled = green "Verified settlement"
- Refused = red "Intentionally blocked — safety proof"
- Payment = blue "x402 payment proof"

## 9.4 Proof on Command Center

- Latest proof card with animated "seal" on generation complete
- Sound: none (premium = silent)
- Copy URL one-click

---

# 10. ERC-8004 Experience

## 10.1 Principle

Identity must feel **important**, not hidden in a badge.

## 10.2 Surfaces

| Surface | Content |
|---------|---------|
| Command Center status strip | Identity pill: "Bound — mint pending" or "Registered" |
| Agent detail | Full identity card: resolver, metadata hash, public slug, register CTA |
| Public `/agents/[slug]` | Hero identity, trust signals, proof history |
| All proof pages | `PublicProofIdentityPanel` prominent above fold |

## 10.3 Identity card spec

```
┌─ Agent Identity (ERC-8004) ────────┐
│ Status: Identity bound — mint pending │
│ Resolver: 0x2CF5…b77 (link)      │
│ Metadata hash: 0x29e5… (copy)      │
│ Public profile: /agents/valen      │
│ [Register identity] [View profile] │
└────────────────────────────────────┘
```

## 10.4 Honest pending state

Never hide that NFT registry is not deployed. Copy:

> "VALEN has bound your agent metadata on-chain. Full ERC-8004 NFT mint awaits registry deployment."

## 10.5 Track record

Public profile adds:
- Proofs generated count
- Last 5 outcomes timeline
- Chains active

---

# 11. x402 Experience

## 11.1 Integration principle

x402 is **not a random page** — it is a **governed payment rail** inside agent workflows.

## 11.2 Entry points

1. Command Surface: "Pay X USDC through x402"
2. Agent detail → Run payment
3. Proof Center → filter x402
4. Advanced → full Payments sandbox (keep for power users)

## 11.3 Inline x402 flow (Command Center drawer)

```
Step 1: Amount + recipient (prefilled from command)
Step 2: Budget check visualization
Step 3: Initiate → Execute (EIP-3009)
Step 4: Proof card with tx link
```

Reuse existing `useX402Initiate` / `useX402Execute` — UI consolidation only.

## 11.4 Visual diagram (keep, refine)

Horizontal steps on light background:
`Initiate → Compliance & budget gates → EIP-3009 settlement → Public proof URL`

## 11.5 x402 on proof pages

- Payment proof shows budget evidence hash
- Refused budget → refusal proof styling

---

# 12. Robinhood Assets Experience

## 12.1 Narrative

"Tokenized stocks and USDG on Robinhood Testnet — governed, settled, proven."

## 12.2 Allowed vs refused story

Every asset page shows two paths (already on hub — extend to ticker pages):

| Path | User action | Expected outcome |
|------|-------------|----------------|
| Allowed | Within-policy transfer | Settled proof + tx |
| Refused | Over-limit template | Refusal proof |

## 12.3 Visual capital flow (YieldGeko-inspired)

On asset detail, horizontal flow:

```
[Agent wallet] → [Policy gate] → [Robinhood settlement] → [Proof]
```

Light theme: thin gray connectors, green/red terminal nodes.

## 12.4 Chain clarity

Always show **Robinhood Testnet (46630)** badge alongside Arbitrum Sepolia for USDC paths — never conflate budgets.

---

# 13. Component Library

## 13.1 Foundation (extend existing)

| Token / primitive | Status | Action |
|-------------------|--------|--------|
| `design-tokens.ts` | Partial | Expand semantic tokens |
| `globals.css` | Partial | Split marketing vs app; add command-center classes |
| `tailwind.config.ts` | Partial | Complete valen scale |
| `EmptyState` | New | Roll out to all list pages |
| `QueryState` | Exists | Add skeleton variants |

## 13.2 New components (required)

| Component | Purpose |
|-----------|---------|
| `CommandSurface` | NL input + parser |
| `CommandPalette` | ⌘K global |
| `GovernancePipelineStrip` | Animated pipeline |
| `AgentFleetCard` | Command center agent row |
| `AgentStudioWizard` | 5-step creation |
| `GovernanceCrewDiagram` | Agent storytelling |
| `IdentityCard` | ERC-8004 hero |
| `AssetGridCard` | Token with actions |
| `ProofOutcomeHero` | Public proof header |
| `StatusStrip` | P1–P4 dashboard status |
| `GateChecklist` | Required/optional gates |
| `TechnicalDisclosure` | UUID/hash accordion |
| `ResponsiveDataList` | Table ↔ card auto |

## 13.3 Component states (each interactive component)

Must document: default, hover, focus, active, disabled, loading, error, empty

## 13.4 Storybook / Ladle (recommended)

Catalog all command-center and proof components before full page integration.

---

# 14. Motion System

## 14.1 Principles

- Tasteful, premium — **no gimmicks**
- Duration: 150–300ms UI; 600ms pipeline stage transitions
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard)
- Respect `prefers-reduced-motion`

## 14.2 Motion catalog

| Event | Animation |
|-------|-----------|
| Command submitted | Input → preview card slide up 200ms |
| Pipeline stage advance | Dot fill + connector draw L→R |
| Proof generated | Seal stamp scale 0.9→1 + fade |
| Agent status change | Pill color crossfade |
| Modal open | Backdrop fade + sheet slide up (mobile) |
| List insert | New proof card fade-in from top |
| Error | Horizontal shake 4px, once |

## 14.3 Implementation

- CSS transitions for simple states
- Framer Motion for pipeline strip only (lazy loaded)
- No autoplay loops except pipeline in-flight shimmer (subtle)

---

# 15. Design Tokens

## 15.1 Color (Ultra Premium Light)

```css
--valen-bg: #FFFFFF;
--valen-bg-subtle: #FAFBFC;
--valen-bg-muted: #F4F6F8;
--valen-border: #E8ECF0;
--valen-border-strong: #D1D9E0;
--valen-text: #1A2332;
--valen-text-secondary: #5E6C7B;
--valen-text-muted: #8B98A5;
--valen-primary: #0066FF;
--valen-primary-subtle: #EBF2FF;
--valen-success: #0D9488;
--valen-success-subtle: #ECFDF5;
--valen-danger: #DC2626;
--valen-danger-subtle: #FEF2F2;
--valen-warning: #D97706;
--valen-warning-subtle: #FFFBEB;
--valen-proof: #0066FF;
--valen-accent: #84CC16; /* sparingly — proof seal only */
```

## 15.2 Typography

| Role | Font | Size / weight |
|------|------|---------------|
| Display | Instrument Serif | 32–40px / 600 |
| H1 | Inter Tight | 24px / 600 |
| H2 | Inter Tight | 18px / 600 |
| Body | Inter Tight | 14px / 400 |
| Caption | Inter Tight | 12px / 500 uppercase tracking |
| Mono | ui-monospace | 12px hashes |

## 15.3 Spacing

8px grid: 4, 8, 12, 16, 24, 32, 48, 64

## 15.4 Elevation

| Level | Shadow |
|-------|--------|
| 0 | none (border only) |
| 1 | `0 1px 2px rgba(16,24,40,0.05)` |
| 2 | `0 4px 12px rgba(16,24,40,0.08)` |
| 3 | Command palette modal |

## 15.5 Radius

- sm: 8px (buttons, inputs)
- md: 12px (cards)
- lg: 16px (hero sections)
- full: pills

---

# 16. Mobile Strategy

## 16.1 Current state

- Bottom nav (5 tabs) + drawer ✅
- Execution list cards ✅
- Command Surface **not optimized** — critical gap

## 16.2 Mobile Command Center

```
┌─────────────────────────┐
│ Status pills (horizontal scroll) │
│ Command input (full width)       │
│ Quick action chips (scroll)      │
│ Pipeline strip (compact vertical)│
│ Proof feed (cards)               │
│ Agents (single column)           │
└─────────────────────────┘
```

## 16.3 Mobile-specific

- Sticky proof share bar on public proofs ✅ (extend)
- FAB: Run command (optional if input always visible)
- Wallet signing: test Privy on iOS Safari early
- Bottom nav: Command · Agents · Proofs · Control · More

## 16.4 Touch targets

Minimum 44×44px for all actions

---

# 17. Tablet Strategy

## 17.1 Breakpoints

- sm: 640 — mobile
- md: 768 — tablet portrait
- lg: 1024 — sidebar visible
- xl: 1280 — two-column command layout

## 17.2 Tablet layout

- Sidebar collapsible to icons-only (72px)
- Command Surface + Pipeline side-by-side at md+
- Agent table → 2-column card grid at md

---

# 18. Accessibility

## 18.1 Requirements (WCAG 2.1 AA)

- Color contrast ≥ 4.5:1 body text
- Focus rings visible on all interactive elements
- Keyboard: ⌘K, tab order logical in Command Surface
- aria-live region for pipeline stage changes
- aria-labels on icon-only buttons
- Form labels associated (authority page audit)

## 18.2 Screen reader

- Pipeline: "Policy check passed" announcements
- Proof outcome: "Settlement proof available at URL"

## 18.3 Audit checklist

- [ ] axe-core on Command Center
- [ ] Keyboard-only run through Agent Studio
- [ ] Screen reader spot check (NVDA/VoiceOver)

---

# 19. Empty States

| Context | Message | CTA |
|---------|---------|-----|
| No agents | "No governed agents yet" | Open Agent Studio |
| No proofs | "Run your first governed action" | Focus command input |
| No mandates | "Sign authority to enable actions" | Authority wizard |
| No policies | "Create rules before agents act" | Policy templates |
| No budget | "Fund USDC budget for settlements" | Top-up |
| Empty proof pack | "Proofs appear after first action" | Demo quick action |
| No executions | "Execution log empty" | Run command |

Use `EmptyState` component with illustration slot (optional line art, not crypto clipart).

---

# 20. Loading States

| Context | Pattern |
|---------|---------|
| Command Center | Skeleton status strip + input disabled |
| Pipeline | Pulsing stage dots |
| Proof feed | 3 skeleton cards |
| Agent list | Skeleton rows |
| Wallet verify | Spinner on button + "Confirm in wallet" |
| x402 execute | Step progress "Signing EIP-3009…" |
| Page transition | Next.js loading.tsx per route |

Avoid full-page spinners except initial auth.

---

# 21. Error States

| Error | UX |
|-------|-----|
| API unreachable | Banner: "Connection issue" + retry (no "Render") |
| Wrong wallet network | Amber card + switch network CTA |
| Mandate mismatch | Inline on command preview with agent suggestion |
| Budget exceeded | Refusal preview before submit |
| Privy reject sign | Toast + "Signing cancelled" |
| Execution failed | Pipeline stops at stage + link to refusal proof |
| Historical failure | Filter toggle + explanation tooltip |

**Copy rule:** Never expose hosting provider names in user-facing errors.

---

# 22. User Journey Maps

## 22.1 First-time user → first proof

```
Login → Command Center → SetupModal
  → Studio: Agent → Rules → Authority → Budget
  → Command: "Run USDC demo"
  → Pipeline animates → Proof card → Share URL
```

**Target time:** < 10 minutes unaided

## 22.2 Judge demo (2 minutes)

```
Command Center → Quick: Refused TSLA
  → Pipeline → Refusal proof → Copy URL → Arbiscan/Robinhood explorer
```

## 22.3 Enterprise auditor

```
Proof Center → Filter settled → Open proof
  → Verification steps → Audit log (More drawer)
```

## 22.4 Developer integrator

```
More → Resources / API keys / Webhooks
  → Public proof schema → MCP/SDK docs
```

---

# 23. Judge Experience

## 23.1 Ten-second test

Judge must answer: **"Governed agent finance with public proofs"**

**UI must show:** Agent + Rules + Budget + Proof without scrolling on 1440×900

## 23.2 Thirty-second test

Point to public proof URL with tx hash — **Share bar above fold**

## 23.3 Two-minute narrated demo script

1. Command Center status strip — "Agent under rules"
2. Quick action — Allowed USDC
3. Pipeline animation — "Policy and budget gates"
4. Proof feed — "Public URL"
5. Quick action — Refused TSLA
6. Refusal proof — "Safety is proven too"
7. x402 chip — "HTTP payments governed"
8. ERC-8004 pill — "Discoverable identity"

## 23.4 Judge mode defaults

- Advanced nav hidden ✅
- Historical failures hidden by default ✅
- Operator stats hidden ✅
- Rename "Judge Demo" → "Quick actions"

---

# 24. First-Time User Experience

## 24.1 Entry

- Login → Command Center (not `/onboarding` page)
- SetupModal auto-open once per org ✅

## 24.2 Guided gates

Visual checklist (YieldGeko publish pattern):

| Gate | Required | Surface |
|------|----------|---------|
| Create agent | Yes | Studio |
| Assign policy | Yes | Studio |
| Verify wallet | Yes | Authority embed |
| Sign mandate | Yes | Authority embed |
| Fund budget | Optional* | Budgets |
| First proof | Yes | Command |

*Required for USDC settlement demos

## 24.3 Progressive disclosure

- Hide Advanced until 3 proofs or explicit toggle
- Hide technical hashes until "Details" expand

## 24.4 Copy tone

Plain English, no UUID first, no internal phase names

---

# 25. Power User Experience

## 25.1 Features

- ⌘K command palette — jump to any route, agent, proof
- Slash commands in Command Surface
- Execution log + settlements in More drawer
- Bulk export audit logs
- Webhook configuration
- API key management per agent
- Judge mode OFF → full operator stats

## 25.2 Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Command palette |
| ⌘↵ | Run command |
| ⌘⇧P | Open Proof Center |
| ⌘⇧A | Agents list |
| Esc | Close modal/drawer |

## 25.3 Density mode (optional P2)

Settings toggle: Comfortable ↔ Compact for tables

---

# Implementation Roadmap

## Phase W1 — Foundation (2 weeks)

- Design tokens v2 (light premium)
- Component primitives: StatusStrip, TechnicalDisclosure, ResponsiveDataList
- Navigation reduction + redirect wiring
- Copy scrub (Render/Phase/hosting jargon)
- Fix authority page encoding + split into stepped sections

**Exit:** Visual consistency, nav clarity

## Phase W2 — Command Surface Core (3 weeks)

- CommandSurface input + rule-based parser
- CommandPreviewCard + gate banner
- GovernancePipelineStrip (animated)
- Recompose `/dashboard` as Agent Command Center
- ⌘K command palette v1

**Exit:** 80% actions from Command Center

## Phase W3 — Agent Studio & Identity (2 weeks)

- Agent Studio 5-step wizard
- IdentityCard ERC-8004 elevation
- Agent fleet table/cards redesign
- Governance Crew diagram

**Exit:** Agent lifecycle without page hopping

## Phase W4 — Assets, Proofs, x402 Integration (2 weeks)

- Unified Assets hub at `/dashboard/assets`
- x402 inline drawer on Command Center
- Proof experience elevation (sticky share, outcome hero)
- Asset strip on Command Center

**Exit:** All differentiators visible from home

## Phase W5 — Mobile, Motion, Polish (2 weeks)

- Mobile command layout
- Table→card on remaining admin pages
- Motion system + reduced-motion
- Empty/loading/error state rollout
- Accessibility audit fixes

**Exit:** Demo-safe on phone/tablet

## Phase W6 — QA & Documentation (1 week)

- Full E2E matrix (USDC, TSLA refused, x402, ERC-8004, mobile)
- Update `VALEN_COMPLETE_DOCUMENTATION.md` §17
- Judge rehearsal script validation

**Exit:** Production-ready world-class dashboard

---

# Page Implementation Checklist (every route)

| # | Route | W1 | W2 | W3 | W4 | W5 |
|---|-------|----|----|----|----|-----|
| 1 | `/` | tokens | embed live command mock | — | proof CTA | mobile |
| 2 | `/login` | copy | public proof link | — | — | a11y |
| 3 | `/onboarding` | redirect | — | — | — | — |
| 4 | `/dashboard` | nav | **full rebuild** | studio entry | assets strip | mobile |
| 5 | `/dashboard/agents` | — | — | fleet table | — | cards |
| 6 | `/dashboard/agents/[id]` | disclosure | command link | tabs v2 | — | mobile |
| 7 | `/dashboard/register-agent` | — | — | → Studio | — | — |
| 8 | `/dashboard/executions/new` | — | parser target | — | — | mobile |
| 9 | `/dashboard/executions` | — | — | — | — | cards |
| 10 | `/dashboard/executions/[id]` | — | pipeline link | — | proof hero | mobile |
| 11 | `/dashboard/payments` | copy | drawer integration | — | — | — |
| 12 | `/dashboard/assets` | redirect fix | — | — | **hub build** | — |
| 13 | `/dashboard/demo/robinhood*` | — | — | — | merge to assets | — |
| 14 | `/dashboard/proofs` | — | link | — | elevation | mobile |
| 15 | `/dashboard/policies*` | empty states | — | — | — | cards |
| 16 | `/dashboard/authority` | split steps | embed in studio | — | — | mobile |
| 17 | `/dashboard/budgets` | — | status strip | — | — | — |
| 18 | `/dashboard/approvals` | — | — | — | — | cards |
| 19–29 | Advanced pages | copy scrub | — | — | — | responsive |
| 30–34 | Public proofs | — | — | — | proof shell | sticky share |
| 35 | `/agents/[slug]` | — | — | identity | track record | mobile |

---

# API/UI Dependencies (no backend redesign required)

| Need | Solution |
|------|----------|
| Command parser | Client-side template mapping (v1) |
| Latest proof on home | Existing `dashboard/summary` |
| Pipeline events | Existing execution timeline API |
| Human rule sentences | Client `policy-rules-summary` ✅ |
| ERC-8004 status | Existing identity API |
| x402 | Existing initiate/execute |

Optional enhancements (P2):
- `POST /v1/command/parse` server-side parser
- `dashboard/summary.recentProofs[]`
- `execution.isHistorical` flag

---

# Success Metrics

| Metric | Target |
|--------|--------|
| Time to first proof (new user) | < 10 min |
| Judge comprehension (10s) | Category named correctly |
| Actions from Command Center | > 80% |
| Pages per demo flow | ≤ 3 |
| Mobile demo success | 100% critical paths |
| Lighthouse a11y | ≥ 90 |
| User-facing "Render" strings | 0 |

---

# Document Approval

This plan supersedes visual/UX direction in `VALEN_DASHBOARD_REDESIGN_MASTER_PLAN.md` Phase R2–R9 for **Command Center v2** work while preserving all functional/API constraints from R1.

**Next step when approved:** Begin Phase W1 — Foundation tokens + navigation + copy scrub.

---

*End of VALEN World-Class Dashboard Execution Plan v1.0*
