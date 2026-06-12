export type PolicyTemplate = {
  id: string;
  name: string;
  description: string;
  rules: Record<string, unknown>;
};

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'conservative-transfer',
    name: 'Conservative Transfer Guard',
    description: 'Fail-closed transfer policy with low limits and human approval above moderate risk.',
    rules: {
      templateId: 'conservative-transfer',
      permissions: {
        allowedChains: [421614, 46630],
        allowedActions: ['transfer'],
        allowedAssets: ['native'],
        allowedTargets: ['*'],
        amountLimits: {
          maxPerTransaction: '0.1 ETH',
          maxTotal: '1 ETH',
        },
        approvalThreshold: 'risk_score >= 60 OR amount > 0.05 ETH',
        expiresInDays: 30,
      },
      compliance: {
        mode: 'fail_closed',
        requireSanctionsCheck: true,
        requireEligibilityCheck: true,
      },
      risk: {
        maxAutoAllowScore: 59,
        requireApprovalAbove: 60,
        rejectAbove: 85,
      },
      settlement: {
        operatorRelayed: true,
        requireMandateId: true,
      },
    },
  },
  {
    id: 'robinhood-tsla-demo',
    name: 'Robinhood TSLA Demo',
    description: 'Demo policy for Robinhood Testnet scenarios with explicit allow/refuse paths.',
    rules: {
      templateId: 'robinhood-tsla-demo',
      permissions: {
        allowedChains: [46630],
        allowedActions: ['demo_trade', 'transfer'],
        allowedAssets: ['TSLA', 'native'],
        allowedTargets: ['robinhood-demo', '*'],
        amountLimits: {
          maxPerTransaction: '100 TSLA',
          maxTotal: '500 TSLA',
        },
        approvalThreshold: 'risk_score >= 70 OR target outside demo allowlist',
        expiresInDays: 14,
      },
      compliance: {
        mode: 'fail_closed',
        demoRefusals: ['unsupported_chain', 'blocked_subject', 'amount_above_limit'],
      },
      risk: {
        maxAutoAllowScore: 69,
        requireApprovalAbove: 70,
        rejectAbove: 90,
      },
      settlement: {
        operatorRelayed: true,
        proofLabel: 'VALEN operator-relayed proof transaction',
      },
    },
  },
];

export function policyTemplateById(id: string) {
  return POLICY_TEMPLATES.find((template) => template.id === id) ?? POLICY_TEMPLATES[0];
}
