import { summarizePolicyRules } from '@/lib/policy-rules-summary';

export type PolicyRiskLevel = 'low' | 'medium' | 'high';

export type PolicyTemplate = {
  id: string;
  name: string;
  description: string;
  tagline: string;
  riskLevel: PolicyRiskLevel;
  icon: string;
  supportedAssets: string[];
  supportedChains: number[];
  approvalMode: string;
  budgetControls: string;
  useCases: string[];
  highlights: string[];
  category: 'treasury' | 'payments' | 'trading' | 'compliance' | 'operations' | 'research';
  rules: Record<string, unknown>;
};

const BASE_SETTLEMENT = {
  operatorRelayed: true,
  requireMandateId: true,
};

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'conservative-transfer',
    name: 'Conservative Treasury Guard',
    tagline: 'Fail-closed treasury with human gates above moderate risk',
    description:
      'Protects organization treasury with strict transfer limits, sanctions checks, and mandatory approval above risk thresholds.',
    riskLevel: 'low',
    icon: '🛡',
    supportedAssets: ['USDC', 'ETH'],
    supportedChains: [421614, 46630],
    approvalMode: 'Human approval above threshold',
    budgetControls: 'Per-transaction and rolling 24h caps',
    useCases: ['Treasury payouts', 'Vendor disbursements', 'Controlled agent transfers'],
    highlights: ['Fail-closed compliance', 'Low per-tx limits', 'Dual-chain support'],
    category: 'treasury',
    rules: {
      templateId: 'conservative-transfer',
      permissions: {
        allowedChains: [421614, 46630],
        allowedActions: ['transfer'],
        allowedAssets: ['USDC', 'native'],
        allowedTargets: ['*'],
        amountLimits: { maxPerTransaction: '100 USDC', maxTotal: '1000 USDC' },
        approvalThreshold: 'risk_score >= 60 OR amount > 50 USDC',
        expiresInDays: 30,
      },
      compliance: { mode: 'fail_closed', requireSanctionsCheck: true, requireEligibilityCheck: true },
      risk: { maxAutoAllowScore: 59, requireApprovalAbove: 60, rejectAbove: 85 },
      settlement: BASE_SETTLEMENT,
    },
  },
  {
    id: 'x402-micropayments',
    name: 'Autonomous x402 Micropayments',
    tagline: 'HTTP-native USDC micropayments with budget guardrails',
    description:
      'Governed x402 payment rail for API paywalls and agent micropayments with automatic approval within budget.',
    riskLevel: 'low',
    icon: '⚡',
    supportedAssets: ['USDC'],
    supportedChains: [421614],
    approvalMode: 'Auto-approved within budget',
    budgetControls: 'Agent USDC budget with 24h reset',
    useCases: ['HTTP 402 paywalls', 'API micropayments', 'Agent-to-agent settlement'],
    highlights: ['EIP-3009 settlement', 'Public proof URLs', 'Budget enforced at initiate'],
    category: 'payments',
    rules: {
      templateId: 'x402-micropayments',
      permissions: {
        allowedChains: [421614],
        allowedActions: ['transfer', 'x402_payment'],
        allowedAssets: ['USDC'],
        allowedTargets: ['*'],
        amountLimits: { maxPerTransaction: '1 USDC', maxTotal: '10 USDC' },
        approvalThreshold: 'auto within budget; human above cap',
        expiresInDays: 30,
      },
      compliance: { mode: 'fail_closed', requireSanctionsCheck: false },
      risk: { maxAutoAllowScore: 75, requireApprovalAbove: 76, rejectAbove: 90 },
      settlement: { ...BASE_SETTLEMENT, proofLabel: 'x402 public proof' },
    },
  },
  {
    id: 'robinhood-tsla-demo',
    name: 'Robinhood Asset Trading',
    tagline: 'Tokenized equities and USDG on Robinhood Testnet',
    description:
      'Govern tokenized stock transfers and USDG settlement on Robinhood Chain with explicit allow and refusal paths.',
    riskLevel: 'medium',
    icon: '📈',
    supportedAssets: ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD', 'USDG'],
    supportedChains: [46630],
    approvalMode: 'Human approval above demo limits',
    budgetControls: 'Per-asset position caps',
    useCases: ['Stock token transfers', 'USDG treasury', 'Demo trading flows'],
    highlights: ['Verified Robinhood contracts', 'Refusal proofs', 'Asset-specific limits'],
    category: 'trading',
    rules: {
      templateId: 'robinhood-tsla-demo',
      permissions: {
        allowedChains: [46630],
        allowedActions: ['demo_trade', 'transfer'],
        allowedAssets: ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD', 'USDG'],
        allowedTargets: ['robinhood-demo', '*'],
        amountLimits: { maxPerTransaction: '100 shares', maxTotal: '500 shares' },
        approvalThreshold: 'risk_score >= 70 OR target outside demo allowlist',
        expiresInDays: 14,
      },
      compliance: { mode: 'fail_closed', demoRefusals: ['unsupported_chain', 'blocked_subject', 'amount_above_limit'] },
      risk: { maxAutoAllowScore: 69, requireApprovalAbove: 70, rejectAbove: 90 },
      settlement: { operatorRelayed: true, proofLabel: 'Robinhood settlement proof' },
    },
  },
  {
    id: 'institutional-compliance',
    name: 'Institutional Compliance',
    tagline: 'Enterprise-grade sanctions, eligibility, and audit controls',
    description:
      'Maximum compliance rigor for regulated workflows with mandatory checks and elevated approval thresholds.',
    riskLevel: 'high',
    icon: '🏛',
    supportedAssets: ['USDC', 'USDG', 'ETH'],
    supportedChains: [421614, 46630],
    approvalMode: 'Dual approval above moderate risk',
    budgetControls: 'Hard caps with evidence hashes',
    useCases: ['Regulated disbursements', 'Institutional treasury', 'Audit-ready operations'],
    highlights: ['Sanctions screening', 'Eligibility verification', 'Immutable proof trail'],
    category: 'compliance',
    rules: {
      templateId: 'institutional-compliance',
      permissions: {
        allowedChains: [421614, 46630],
        allowedActions: ['transfer'],
        allowedAssets: ['USDC', 'USDG', 'native'],
        allowedTargets: ['allowlist'],
        amountLimits: { maxPerTransaction: '50 USDC', maxTotal: '500 USDC' },
        approvalThreshold: 'risk_score >= 40 OR amount > 25 USDC',
        expiresInDays: 7,
      },
      compliance: { mode: 'fail_closed', requireSanctionsCheck: true, requireEligibilityCheck: true, requireAuditTrail: true },
      risk: { maxAutoAllowScore: 39, requireApprovalAbove: 40, rejectAbove: 70 },
      settlement: BASE_SETTLEMENT,
    },
  },
  {
    id: 'cross-chain-operations',
    name: 'Cross-Chain Operations',
    tagline: 'Multi-network agent operations with unified governance',
    description:
      'Coordinate governed actions across Arbitrum Sepolia and Robinhood Testnet under one policy envelope.',
    riskLevel: 'medium',
    icon: '🔗',
    supportedAssets: ['USDC', 'USDG', 'TSLA', 'ETH'],
    supportedChains: [421614, 46630],
    approvalMode: 'Chain-aware approval routing',
    budgetControls: 'Per-chain budget envelopes',
    useCases: ['Cross-chain treasury', 'Multi-network agents', 'Unified mandates'],
    highlights: ['Dual-chain mandates', 'Network badges', 'Per-chain limits'],
    category: 'operations',
    rules: {
      templateId: 'cross-chain-operations',
      permissions: {
        allowedChains: [421614, 46630],
        allowedActions: ['transfer', 'x402_payment', 'demo_trade'],
        allowedAssets: ['USDC', 'USDG', 'TSLA', 'native'],
        allowedTargets: ['*'],
        amountLimits: { maxPerTransaction: '250 USDC equivalent', maxTotal: '2500 USDC equivalent' },
        approvalThreshold: 'risk_score >= 65 OR cross_chain_flag',
        expiresInDays: 21,
      },
      compliance: { mode: 'fail_closed', requireSanctionsCheck: true },
      risk: { maxAutoAllowScore: 64, requireApprovalAbove: 65, rejectAbove: 88 },
      settlement: BASE_SETTLEMENT,
    },
  },
  {
    id: 'high-security-treasury',
    name: 'High Security Treasury',
    tagline: 'Zero-trust treasury with minimal auto-allow surface',
    description:
      'Restricts autonomous execution to micro amounts; all material movements require explicit human approval.',
    riskLevel: 'high',
    icon: '🔒',
    supportedAssets: ['USDC', 'USDG'],
    supportedChains: [421614, 46630],
    approvalMode: 'Human approval for all material amounts',
    budgetControls: 'Strict daily caps with pause on breach',
    useCases: ['Cold treasury', 'High-value org wallets', 'Executive-controlled funds'],
    highlights: ['Minimal auto-allow', 'Mandatory dual control', 'Instant budget pause'],
    category: 'treasury',
    rules: {
      templateId: 'high-security-treasury',
      permissions: {
        allowedChains: [421614, 46630],
        allowedActions: ['transfer'],
        allowedAssets: ['USDC', 'USDG'],
        allowedTargets: ['allowlist'],
        amountLimits: { maxPerTransaction: '10 USDC', maxTotal: '100 USDC' },
        approvalThreshold: 'risk_score >= 30 OR amount > 1 USDC',
        expiresInDays: 7,
      },
      compliance: { mode: 'fail_closed', requireSanctionsCheck: true, requireDualControl: true },
      risk: { maxAutoAllowScore: 29, requireApprovalAbove: 30, rejectAbove: 60 },
      settlement: BASE_SETTLEMENT,
    },
  },
  {
    id: 'market-maker-operations',
    name: 'Market Maker Operations',
    tagline: 'Higher throughput trading with risk-calibrated auto-allow',
    description:
      'Supports frequent tokenized asset operations with elevated limits and calibrated auto-approval for liquid markets.',
    riskLevel: 'medium',
    icon: '📊',
    supportedAssets: ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD', 'USDG', 'USDC'],
    supportedChains: [46630, 421614],
    approvalMode: 'Auto within band; human above band',
    budgetControls: 'Rolling volume caps per asset',
    useCases: ['Market making', 'Liquidity provision', 'High-frequency demo trading'],
    highlights: ['Elevated limits', 'Volume tracking', 'Asset-level caps'],
    category: 'trading',
    rules: {
      templateId: 'market-maker-operations',
      permissions: {
        allowedChains: [46630, 421614],
        allowedActions: ['transfer', 'demo_trade'],
        allowedAssets: ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD', 'USDG', 'USDC'],
        allowedTargets: ['*'],
        amountLimits: { maxPerTransaction: '500 shares', maxTotal: '5000 shares' },
        approvalThreshold: 'risk_score >= 80 OR amount > policy band',
        expiresInDays: 30,
      },
      compliance: { mode: 'fail_closed', requireSanctionsCheck: true },
      risk: { maxAutoAllowScore: 79, requireApprovalAbove: 80, rejectAbove: 95 },
      settlement: BASE_SETTLEMENT,
    },
  },
  {
    id: 'research-sandbox',
    name: 'Research Sandbox',
    tagline: 'Permissive sandbox for demos with proof on every outcome',
    description:
      'Relaxed limits for hackathon and judge demos while preserving governed proofs for every allowed or refused action.',
    riskLevel: 'low',
    icon: '🧪',
    supportedAssets: ['USDC', 'USDG', 'TSLA', 'ETH'],
    supportedChains: [421614, 46630],
    approvalMode: 'Mostly auto-approved with proof',
    budgetControls: 'Generous demo caps',
    useCases: ['Judge demos', 'Prototype agents', 'Conference walkthroughs'],
    highlights: ['Fast onboarding', 'Proof on refusal', 'Multi-asset demos'],
    category: 'research',
    rules: {
      templateId: 'research-sandbox',
      permissions: {
        allowedChains: [421614, 46630],
        allowedActions: ['transfer', 'x402_payment', 'demo_trade'],
        allowedAssets: ['USDC', 'USDG', 'TSLA', 'native'],
        allowedTargets: ['*'],
        amountLimits: { maxPerTransaction: '1000 USDC equivalent', maxTotal: '10000 USDC equivalent' },
        approvalThreshold: 'risk_score >= 90 only',
        expiresInDays: 90,
      },
      compliance: { mode: 'fail_closed', demoMode: true },
      risk: { maxAutoAllowScore: 89, requireApprovalAbove: 90, rejectAbove: 98 },
      settlement: { operatorRelayed: true, proofLabel: 'Sandbox proof' },
    },
  },
];

export function policyTemplateById(id: string): PolicyTemplate {
  return POLICY_TEMPLATES.find((template) => template.id === id) ?? POLICY_TEMPLATES[0];
}

export function policyTemplateFromRules(rules: Record<string, unknown> | null | undefined): PolicyTemplate | null {
  if (!rules) return null;
  const templateId = typeof rules.templateId === 'string' ? rules.templateId : null;
  if (!templateId) return null;
  return POLICY_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function policyRiskTone(level: PolicyRiskLevel): string {
  if (level === 'low') return 'policy-risk--low';
  if (level === 'medium') return 'policy-risk--medium';
  return 'policy-risk--high';
}

export function policyRiskLabel(level: PolicyRiskLevel): string {
  if (level === 'low') return 'Low risk';
  if (level === 'medium') return 'Medium risk';
  return 'High risk';
}

export type PolicyCardView = {
  id: string;
  name: string;
  description: string;
  tagline: string;
  riskLevel: PolicyRiskLevel;
  icon: string;
  supportedAssets: string[];
  supportedChains: number[];
  approvalMode: string;
  useCases: string[];
  summaryLines: string[];
};

export function policyCardFromTemplate(template: PolicyTemplate): PolicyCardView {
  const permissions = template.rules.permissions as Record<string, unknown> | undefined;
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    tagline: template.tagline,
    riskLevel: template.riskLevel,
    icon: template.icon,
    supportedAssets: template.supportedAssets,
    supportedChains: template.supportedChains,
    approvalMode: template.approvalMode,
    useCases: template.useCases,
    summaryLines: summarizePolicyRules(permissions),
  };
}

export function policyCardFromPolicy(input: {
  id: string;
  name: string;
  description?: string | null;
  rules?: Record<string, unknown> | null;
}): PolicyCardView {
  const matched = policyTemplateFromRules(input.rules ?? undefined);
  if (matched) {
    return { ...policyCardFromTemplate(matched), id: input.id, name: input.name || matched.name };
  }
  const permissions = (input.rules?.permissions ?? null) as Record<string, unknown> | null;
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? 'Active governance policy',
    tagline: 'Custom active policy',
    riskLevel: 'medium',
    icon: '📋',
    supportedAssets: Array.isArray(permissions?.allowedAssets)
      ? (permissions?.allowedAssets as string[]).map(String)
      : ['USDC'],
    supportedChains: Array.isArray(permissions?.allowedChains)
      ? (permissions.allowedChains as number[])
      : [421614],
    approvalMode: permissions?.approvalThreshold ? String(permissions.approvalThreshold) : 'Configured in rules',
    useCases: ['Agent governance'],
    summaryLines: summarizePolicyRules(permissions),
  };
}
