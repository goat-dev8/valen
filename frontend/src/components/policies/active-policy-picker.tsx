'use client';

import { ShieldCheck } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { ChainBadge } from '@/components/app/chain-badge';
import { policyCardFromPolicy, policyRiskLabel, policyRiskTone } from '@/lib/policy-templates';
import type { PolicyDto } from '@/types/api';

type ActivePolicyPickerProps = {
  policies: PolicyDto[];
  selectedId: string;
  onSelect: (policyId: string) => void;
  policyRulesById?: Record<string, Record<string, unknown> | null | undefined>;
};

export function ActivePolicyPicker({ policies, selectedId, onSelect, policyRulesById }: ActivePolicyPickerProps) {
  if (!policies.length) {
    return (
      <div className="policy-template-empty">
        <p>No active policies yet. Create one from a governance template to continue.</p>
      </div>
    );
  }

  return (
    <div className="policy-template-grid policy-template-grid--compact">
      {policies.map((policy) => {
        const card = policyCardFromPolicy({
          id: policy.id,
          name: policy.name,
          description: policy.description,
          rules: policyRulesById?.[policy.id],
        });
        const selected = selectedId === policy.id;

        return (
          <button
            key={policy.id}
            type="button"
            className={`policy-template-card ${selected ? 'policy-template-card--selected' : ''}`}
            onClick={() => onSelect(policy.id)}
            aria-pressed={selected}
          >
            <div className="policy-template-card__head">
              <span className="policy-template-card__icon" aria-hidden>
                {card.icon}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="policy-template-card__title">{card.name}</h3>
                  <span className={`policy-risk-badge ${policyRiskTone(card.riskLevel)}`}>
                    {policyRiskLabel(card.riskLevel)}
                  </span>
                </div>
                <p className="policy-template-card__tagline">{card.tagline}</p>
              </div>
              {selected && (
                <span className="policy-template-card__selected">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </div>

            <div className="policy-template-card__chips">
              {card.supportedAssets.slice(0, 4).map((asset) => (
                <span key={asset} className="policy-asset-chip">
                  <AssetIcon symbol={asset === 'native' ? 'ETH' : asset} size={16} />
                  {asset === 'native' ? 'ETH' : asset}
                </span>
              ))}
            </div>

            <div className="policy-template-card__meta">
              <div className="policy-template-card__networks">
                {card.supportedChains.map((chainId) => (
                  <ChainBadge key={chainId} chainId={chainId} compact />
                ))}
              </div>
              <p className="policy-template-card__approval">{card.approvalMode}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
