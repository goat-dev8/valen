'use client';

import { ChainBadge } from '@/components/app/chain-badge';
import {
  formatGovernedActionLabel,
  mandateDefaultsFromTemplate,
  policyRiskDisplay,
  type PolicyMandateDefaults,
} from '@/lib/policy-mandate-config';
import { policyRiskLabel, policyRiskTone, type PolicyTemplate } from '@/lib/policy-templates';
import { networkLabel } from '@/lib/agent-scope';

type PolicyGovernanceCardsProps = {
  defaults: PolicyMandateDefaults | null;
  template?: PolicyTemplate | null;
  fallbackPolicyName?: string | null;
};

export function PolicyGovernanceCards({ defaults, template, fallbackPolicyName }: PolicyGovernanceCardsProps) {
  if (!defaults) {
    return (
      <div className="policy-governance-cards policy-governance-cards--empty">
        <p className="text-sm text-[#64748b]">
          Policy details unavailable for {fallbackPolicyName ?? 'the selected policy'}.
        </p>
      </div>
    );
  }

  const cards = [
    { label: 'Policy', value: defaults.policyName },
    { label: 'Risk', value: policyRiskDisplay(defaults.riskLevel), tone: policyRiskTone(defaults.riskLevel) },
    { label: 'Approval', value: defaults.approvalMode },
    { label: 'Expiry', value: `${defaults.expiresInDays} days` },
    { label: 'Max tx', value: defaults.maxPerTransaction || '—' },
    { label: 'Max total', value: defaults.maxTotal || '—' },
  ];

  return (
    <section className="policy-governance-cards" aria-label="Policy governance details">
      <div className="policy-governance-cards__header">
        <h4 className="policy-governance-cards__title">Policy details</h4>
        {template && (
          <span className={`policy-risk-badge ${policyRiskTone(template.riskLevel)}`}>
            {policyRiskLabel(template.riskLevel)}
          </span>
        )}
      </div>

      <div className="policy-governance-cards__grid">
        {cards.map((card) => (
          <article key={card.label} className="policy-governance-card">
            <p className="policy-governance-card__label">{card.label}</p>
            <p className={`policy-governance-card__value ${card.tone ?? ''}`}>{card.value}</p>
          </article>
        ))}
      </div>

      <div className="policy-governance-cards__sections">
        <article className="policy-governance-card policy-governance-card--wide">
          <p className="policy-governance-card__label">Allowed networks</p>
          <div className="org-dual-network mt-2">
            {defaults.allowedChains.map((chainId) => (
              <ChainBadge key={chainId} chainId={chainId} />
            ))}
          </div>
          <p className="policy-governance-card__hint">
            {defaults.allowedChains.map((chainId) => networkLabel(chainId)).join(' · ')}
          </p>
        </article>

        <article className="policy-governance-card policy-governance-card--wide">
          <p className="policy-governance-card__label">Allowed assets</p>
          <p className="policy-governance-card__value">{defaults.allowedAssets.join(' · ')}</p>
        </article>

        <article className="policy-governance-card policy-governance-card--wide">
          <p className="policy-governance-card__label">Governed actions</p>
          <p className="policy-governance-card__value">
            {defaults.allowedActions.map((action) => formatGovernedActionLabel(action)).join(' · ')}
          </p>
        </article>

        <article className="policy-governance-card policy-governance-card--wide">
          <p className="policy-governance-card__label">Allowed targets</p>
          <p className="policy-governance-card__value">{defaults.allowedTargets.join(', ')}</p>
        </article>

        <article className="policy-governance-card policy-governance-card--wide">
          <p className="policy-governance-card__label">Approval threshold</p>
          <p className="policy-governance-card__value">{defaults.approvalThreshold}</p>
        </article>
      </div>
    </section>
  );
}

export function policyGovernanceFromTemplate(template: PolicyTemplate | null) {
  return template ? mandateDefaultsFromTemplate(template) : null;
}
