'use client';

import { useState } from 'react';
import { ChevronDown, Shield } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { ChainBadge } from '@/components/app/chain-badge';
import {
  POLICY_TEMPLATES,
  policyCardFromTemplate,
  policyRiskLabel,
  policyRiskTone,
  type PolicyTemplate,
} from '@/lib/policy-templates';
import { PolicyTemplatePreview } from '@/components/policies/policy-template-preview';

type PolicyTemplateGalleryProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export function PolicyTemplateGallery({ selectedId, onSelect }: PolicyTemplateGalleryProps) {
  const selectedTemplate = POLICY_TEMPLATES.find((t) => t.id === selectedId) ?? POLICY_TEMPLATES[0];

  return (
    <div className="policy-template-gallery space-y-5">
      <div className="policy-template-grid">
        {POLICY_TEMPLATES.map((template) => (
          <PolicyTemplateCard
            key={template.id}
            template={template}
            selected={selectedId === template.id}
            onSelect={() => onSelect(template.id)}
          />
        ))}
      </div>
      <PolicyTemplatePreview template={selectedTemplate} />
    </div>
  );
}

function PolicyTemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: PolicyTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const card = policyCardFromTemplate(template);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <button
      type="button"
      className={`policy-template-card ${selected ? 'policy-template-card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="policy-template-card__head">
        <span className="policy-template-card__icon" aria-hidden>
          {template.icon}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="policy-template-card__title">{template.name}</h3>
            <span className={`policy-risk-badge ${policyRiskTone(template.riskLevel)}`}>
              {policyRiskLabel(template.riskLevel)}
            </span>
          </div>
          <p className="policy-template-card__tagline">{template.tagline}</p>
        </div>
        {selected && (
          <span className="policy-template-card__selected">
            <Shield className="h-4 w-4" />
          </span>
        )}
      </div>

      <p className="policy-template-card__desc">{template.description}</p>

      <div className="policy-template-card__chips">
        {template.supportedAssets.slice(0, 4).map((asset) => (
          <span key={asset} className="policy-asset-chip">
            <AssetIcon symbol={asset === 'native' ? 'ETH' : asset} size={16} />
            {asset === 'native' ? 'ETH' : asset}
          </span>
        ))}
      </div>

      <div className="policy-template-card__meta">
        <div className="policy-template-card__networks">
          {template.supportedChains.map((chainId) => (
            <ChainBadge key={chainId} chainId={chainId} compact />
          ))}
        </div>
        <p className="policy-template-card__approval">{template.approvalMode}</p>
      </div>

      <ul className="policy-template-card__cases">
        {template.useCases.slice(0, 2).map((useCase) => (
          <li key={useCase}>{useCase}</li>
        ))}
      </ul>

      <details
        className="policy-template-card__advanced"
        open={advancedOpen}
        onClick={(e) => e.stopPropagation()}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="policy-template-card__advanced-summary">
          Advanced rules
          <ChevronDown className="h-4 w-4" />
        </summary>
        <ul className="policy-template-card__rules">
          {card.summaryLines.slice(0, 4).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </button>
  );
}
