import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  FileCheck,
  Fingerprint,
  PieChart,
  Scale,
  Shield,
  Zap,
} from 'lucide-react';

/** Matches governance pipeline in the app */
export const GOVERNANCE_PIPELINE = [
  'Intent',
  'Mandate',
  'Engines',
  'Budget',
  'Settlement',
  'Proof',
] as const;

export const HERO_PIPELINE = GOVERNANCE_PIPELINE;

export const LANDING_MODULES: {
  id: string;
  title: string;
  tag: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  route: string;
}[] = [
  {
    id: 'mandates',
    title: 'Scoped Mandates',
    tag: 'ERC-8226 aligned',
    description:
      'EIP-712 signed authority binds agent identity to chains, assets, actions, targets, and caps — not unlimited wallet access.',
    icon: Shield,
    accent: '#0066ff',
    route: '/dashboard/authority',
  },
  {
    id: 'policy',
    title: 'Policy Engine',
    tag: 'On-chain hash',
    description:
      'Versioned organizational rules publish to ValenPolicyManager. Draft → published → active before any settlement.',
    icon: Scale,
    accent: '#7c3aed',
    route: '/dashboard/policies',
  },
  {
    id: 'budget',
    title: 'Budget Engine',
    tag: 'Vault + DB',
    description:
      'Per-agent USDC caps with periodic resets. Budget refusals block settlement early with auditable reason codes.',
    icon: PieChart,
    accent: '#059669',
    route: '/dashboard/budgets',
  },
  {
    id: 'engines',
    title: 'Stylus Engines',
    tag: 'Rust / WASM',
    description:
      'Compliance, risk, eligibility, and policy evaluation on Arbitrum at lower gas — deterministic pass/fail verdicts.',
    icon: Zap,
    accent: '#0ea5e9',
    route: '/dashboard/compliance',
  },
  {
    id: 'settlement',
    title: 'Settlement Gate',
    tag: 'ValenSettlement',
    description:
      'Nothing moves on-chain without re-validation at submit. Dual-chain: Arbitrum Sepolia USDC + Robinhood testnet RWAs.',
    icon: CreditCard,
    accent: '#012b54',
    route: '/dashboard/settlements',
  },
  {
    id: 'proofs',
    title: 'Public Proofs',
    tag: 'proofVersion 1.0',
    description:
      'Every execution, refusal, and x402 payment gets a shareable URL — evidence hash, mandate linkage, explorer tx.',
    icon: FileCheck,
    accent: '#007dfc',
    route: '/proofs/pack',
  },
  {
    id: 'x402',
    title: 'x402 Payments',
    tag: 'EIP-3009 USDC',
    description:
      'Governed HTTP 402 micropayments with budget pre-check. Autonomous commerce without bypassing compliance.',
    icon: CreditCard,
    accent: '#f59e0b',
    route: '/dashboard/payments',
  },
  {
    id: 'identity',
    title: 'Agent Identity',
    tag: 'ERC-8004',
    description:
      'Public agent profiles link every outcome to verifiable metadata at /agents/{slug}.',
    icon: Fingerprint,
    accent: '#6366f1',
    route: '/agents/valen',
  },
];

export const STANDARDS_FEATURES = [
  {
    icon: 'shield' as const,
    label: 'ERC-8226 mandates',
    detail: 'EIP-712 scoped authority before any agent can act',
  },
  {
    icon: 'fingerprint' as const,
    label: 'ERC-8004 identity',
    detail: 'Public agent profiles linked to every proof outcome',
  },
  {
    icon: 'credit-card' as const,
    label: 'x402 payments',
    detail: 'Governed HTTP 402 micropayments with budget pre-check',
  },
  {
    icon: 'zap' as const,
    label: 'Stylus engines',
    detail: 'Compliance, risk, eligibility, and policy on Arbitrum',
  },
  {
    icon: 'layers' as const,
    label: 'Dual-chain settlement',
    detail: 'Arbitrum Sepolia USDC + Robinhood testnet RWAs',
  },
];

export const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Connect',
    desc: 'Privy auth — email, Google, or wallet. Token syncs org membership.',
    route: '/login',
    mock: 'login',
  },
  {
    step: '02',
    title: 'Home',
    desc: 'Command Center: setup progress, budget meter, governance pipeline, quick proof links.',
    route: '/dashboard',
    mock: 'home',
  },
  {
    step: '03',
    title: 'Agent Studio',
    desc: 'Five-step wizard: Identity → Rules → Authority → Budget → Publish.',
    route: '/dashboard/agents/studio',
    mock: 'studio',
  },
  {
    step: '04',
    title: 'Policies',
    desc: 'Template-driven rules for USDC-only, Robinhood-inclusive, or strict compliance configs.',
    route: '/dashboard/policies',
    mock: 'policy',
  },
  {
    step: '05',
    title: 'Authority',
    desc: 'Verify wallet, sign EIP-712 mandate, top up USDC budget on Arbitrum Sepolia.',
    route: '/dashboard/authority',
    mock: 'authority',
  },
  {
    step: '06',
    title: 'Intent',
    desc: 'Submit governed intent — 13 templates, mandate matching, budget warnings before submit.',
    route: '/dashboard/executions/new',
    mock: 'intent',
  },
  {
    step: '07',
    title: 'Proof',
    desc: 'Public proof URL for every settled, refused, or x402 outcome. Refusals are first-class.',
    route: '/proofs/pack',
    mock: 'proof',
  },
] as const;

export const DUAL_CHAIN_DEMOS = [
  {
    chain: 'Arbitrum Sepolia',
    chainId: 421614,
    headline: 'Governed USDC transfer',
    quote:
      'Agent submits 0.001 USDC transfer. Pipeline attests via Stylus engines, settles through ValenSettlement, publishes execution proof with mandate hash and tx link.',
    statA: { value: 'Settled', label: 'Execution proof' },
    statB: { value: '421614', label: 'Chain ID' },
    gradient: 'from-[#e8f0ff] to-white',
    proofKind: 'execution' as const,
  },
  {
    chain: 'Robinhood Testnet',
    chainId: 46630,
    headline: 'TSLA refusal receipt',
    quote:
      'Tokenized stock transfer exceeds mandate cap. Policy engine fails closed — settlement blocked, public refusal proof with POLICY_CAP_EXCEEDED reason code.',
    statA: { value: 'Refused', label: 'Refusal proof' },
    statB: { value: '46630', label: 'Chain ID' },
    gradient: 'from-[#fef3e8] to-white',
    proofKind: 'refusal' as const,
  },
  {
    chain: 'x402 · USDC',
    chainId: 421614,
    headline: 'Governed micropayment',
    quote:
      'HTTP 402 payment flow with budget pre-check and EIP-3009 authorization. Every payment ends with a public proof linking merchant URL and evidence hash.',
    statA: { value: 'Paid', label: 'Payment proof' },
    statB: { value: 'EIP-3009', label: 'Settlement' },
    gradient: 'from-[#eef8ff] to-white',
    proofKind: 'payment' as const,
  },
];

export const AUDIENCE_CARDS = [
  {
    title: 'Agent developers',
    desc: '100+ REST endpoints, 13 intent templates, Swagger docs, dual-chain out of the box.',
    cta: 'Open API docs',
    href: 'https://valen-api-m3g4.onrender.com/docs',
    external: true,
  },
  {
    title: 'Compliance teams',
    desc: 'Structured reason codes, audit trails, human approval for high-risk tiers, refusal receipts.',
    cta: 'View audit module',
    href: '/dashboard/audit',
    external: false,
  },
  {
    title: 'Fintech & RWA issuers',
    desc: 'ERC-8226 mandate model, pre-transfer enforcement, Robinhood Chain tokenized equities.',
    cta: 'Explore assets',
    href: '/dashboard/assets',
    external: false,
  },
  {
    title: 'Institutions & judges',
    desc: 'Live dual-chain demos, public proof pack, production-verified on Sepolia + Robinhood testnet.',
    cta: 'See live proofs',
    href: '/proofs/pack',
    external: false,
  },
];

export const LANDING_FAQS = [
  {
    q: 'What is VALEN — and what is it not?',
    a: 'VALEN is the compliance, risk, and permission layer for agentic finance — infrastructure that sits between AI agents and on-chain execution. It is not a wallet, DEX, Robinhood clone, or chatbot.',
  },
  {
    q: 'How does the fail-closed pipeline work?',
    a: 'Every intent passes mandate validation, Stylus engine evaluation (compliance, risk, eligibility, policy), budget checks, and settlement gate re-validation. Any failure produces a refusal proof with auditable reason codes — funds never move.',
  },
  {
    q: 'What proof types does VALEN publish?',
    a: 'Execution proofs (settled intents), refusal receipts (blocked actions), and x402 payment proofs. All are public URLs with evidence hashes, mandate linkage, and ERC-8004 identity — no login required.',
  },
  {
    q: 'Which chains are production-verified?',
    a: 'Arbitrum Sepolia (421614) for USDC, budget vault, and x402 — plus Robinhood Chain Testnet (46630) for USDG and tokenized stocks (TSLA, AMZN, PLTR, NFLX, AMD).',
  },
  {
    q: 'How do I get started?',
    a: 'Sign in at /login, open Home, and follow the 7-step setup: agent → policy → authority → budget → intent → (optional approval) → proof. Agent Studio walks through the first five steps in one wizard.',
  },
];

export const SOLUTION_STORY = [
  'Autonomous',
  'agents',
  'can',
  'move',
  'money',
  'at',
  'machine',
  'speed.',
  'Without',
  'governance,',
  'wallets',
  'drain,',
  'compliance',
  'fails,',
  'and',
  'no',
  'one',
  'can',
  'prove',
  'why.',
  'VALEN',
  'enforces',
  'scoped',
  'mandates,',
  'Stylus',
  'engines,',
  'budget',
  'caps,',
  'and',
  'public',
  'proofs',
  'on',
  'every',
  'outcome.',
];

export const DASHBOARD_FEATURES = [
  {
    title: 'Command Center',
    desc: 'NL command surface, governance pipeline strip, asset strip, and x402 drawer — 80%+ actions from Home.',
    tag: 'Home',
  },
  {
    title: 'Agent Studio',
    desc: 'Five-step wizard: identity, rules, authority, budget, publish — no page hopping.',
    tag: 'Studio',
  },
  {
    title: 'Proof Center',
    desc: 'Outcome ledger with filters for settled, refused, and payment proofs. Every row links to public URL.',
    tag: 'Proofs',
  },
  {
    title: 'Authority & Budgets',
    desc: 'Wallet verify, EIP-712 mandate signing, chain picker, and USDC budget caps with live meter.',
    tag: 'Control',
  },
];
