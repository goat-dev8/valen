'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { AssetIcon } from '@/lib/asset-icons';
import type { IntentTemplate } from '@/lib/intent-templates';
import {
  filterIntentTemplates,
  groupIntentTemplates,
  intentTemplateScenario,
  intentTemplateSymbol,
  type IntentTemplateFilter,
} from '@/lib/intent-template-ui';

const FILTERS: { key: IntentTemplateFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'arbitrum', label: 'Arbitrum' },
  { key: 'robinhood', label: 'Robinhood' },
  { key: 'refused', label: 'Refusal demos' },
];

type IntentTemplatePickerProps = {
  templates: IntentTemplate[];
  selectedId: string;
  onSelect: (template: IntentTemplate) => void;
  onContinue: () => void;
};

export function IntentTemplatePicker({ templates, selectedId, onSelect, onContinue }: IntentTemplatePickerProps) {
  const [filter, setFilter] = useState<IntentTemplateFilter>('all');
  const filtered = useMemo(() => filterIntentTemplates(templates, filter), [templates, filter]);
  const groups = useMemo(() => groupIntentTemplates(filtered), [filtered]);

  return (
    <div className="intent-template-picker">
      <div className="intent-step-intro">
        <p className="intent-step-eyebrow">Step 1</p>
        <h2 className="intent-step-title">What should your agent do?</h2>
        <p className="intent-step-desc">
          Pick a governed action template. Each path produces a public proof URL — settled or refused.
        </p>
      </div>

      <div className="intent-template-filters" role="tablist" aria-label="Filter templates">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`intent-template-filter ${filter === key ? 'intent-template-filter--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="intent-template-groups">
        {groups.map((group) => (
          <section key={group.id} className="intent-template-group">
            <h3 className="intent-template-group__label">{group.label}</h3>
            <div className="intent-template-grid">
              {group.templates.map((template) => {
                const selected = template.id === selectedId;
                const scenario = intentTemplateScenario(template);
                const symbol = intentTemplateSymbol(template);

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelect(template)}
                    className={`intent-template-card ${selected ? 'intent-template-card--selected' : ''}`}
                  >
                    <div className="intent-template-card__head">
                      <span className="intent-template-card__icon">
                        <AssetIcon symbol={symbol} size={32} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="intent-template-card__name">{template.name}</p>
                        <div className="intent-template-card__badges">
                          <ChainBadge chainId={template.targetChainId} />
                          {scenario === 'refused' && (
                            <span className="intent-scenario-badge intent-scenario-badge--refused">Refusal demo</span>
                          )}
                          {scenario === 'allowed' && template.targetChainId === 46630 && (
                            <span className="intent-scenario-badge intent-scenario-badge--allowed">Allowed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="intent-template-card__desc">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="intent-step-actions">
        <button type="button" className="app-btn app-btn-primary" onClick={onContinue}>
          Continue with selected action
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
