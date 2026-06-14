'use client';

import { useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { AssetIcon } from '@/lib/asset-icons';
import { ChainBadge } from '@/components/app/chain-badge';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { ensurePolicyFromTemplate, resolvePolicyForTemplate } from '@/lib/ensure-policy-catalog';
import {
  POLICY_TEMPLATES,
  policyCardFromTemplate,
  policyRiskLabel,
  policyRiskTone,
  type PolicyTemplate,
} from '@/lib/policy-templates';
import type { PolicyDto } from '@/types/api';
import { formatApiErrorMessage } from '@/lib/utils';

type PolicyCatalogPickerProps = {
  policies: PolicyDto[];
  selectedPolicyId: string;
  onSelect: (policyId: string) => void | Promise<void>;
  loading?: boolean;
};

export function PolicyCatalogPicker({
  policies,
  selectedPolicyId,
  onSelect,
  loading,
}: PolicyCatalogPickerProps) {
  const { token } = useAuth();
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templatePolicyMap = useMemo(() => {
    const map = new Map<string, PolicyDto>();
    for (const template of POLICY_TEMPLATES) {
      const match = resolvePolicyForTemplate(template, policies);
      if (match) map.set(template.id, match);
    }
    return map;
  }, [policies]);

  const handleSelectTemplate = async (template: PolicyTemplate) => {
    if (!token || !orgId) return;
    setError(null);
    setBusyTemplateId(template.id);
    try {
      let policy = templatePolicyMap.get(template.id);
      if (!policy) {
        const result = await ensurePolicyFromTemplate(token, orgId, template.id, policies);
        await queryClient.invalidateQueries({ queryKey: ['policies', orgId] });
        policy = {
          id: result.policyId,
          organizationId: orgId,
          name: template.name,
          description: template.description,
          status: 'active',
          activeVersionId: null,
          createdAt: new Date().toISOString(),
        };
      }
      await onSelect(policy.id);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not bind policy'));
    } finally {
      setBusyTemplateId(null);
    }
  };

  if (loading) {
    return (
      <div className="policy-template-empty">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#0066FF]" />
        <p className="mt-2">Loading governance catalog…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748b]">
        Choose from the full VALEN governance catalog. Templates are provisioned automatically — no manual setup required.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="policy-template-grid">
        {POLICY_TEMPLATES.map((template) => {
          const card = policyCardFromTemplate(template);
          const policy = templatePolicyMap.get(template.id);
          const selected = Boolean(policy && selectedPolicyId === policy.id);
          const busy = busyTemplateId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              className={`policy-template-card ${selected ? 'policy-template-card--selected' : ''}`}
              disabled={Boolean(busyTemplateId)}
              onClick={() => void handleSelectTemplate(template)}
              aria-pressed={selected}
            >
              <div className="policy-template-card__head">
                <span className="policy-template-card__icon">{template.icon}</span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="policy-template-card__title">{template.name}</h3>
                    <span className={`policy-risk-badge ${policyRiskTone(template.riskLevel)}`}>
                      {policyRiskLabel(template.riskLevel)}
                    </span>
                  </div>
                  <p className="policy-template-card__tagline">{template.tagline}</p>
                </div>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0066FF]" />
                ) : selected ? (
                  <ShieldCheck className="h-4 w-4 text-[#0066FF]" />
                ) : null}
              </div>
              <p className="policy-template-card__desc">{template.description}</p>
              <div className="policy-template-card__chips">
                {card.supportedAssets.slice(0, 5).map((asset) => (
                  <span key={asset} className="policy-asset-chip">
                    <AssetIcon symbol={asset === 'native' ? 'ETH' : asset} size={16} />
                    {asset === 'native' ? 'ETH' : asset}
                  </span>
                ))}
              </div>
              <div className="policy-template-card__meta">
                <div className="policy-template-card__networks org-dual-network">
                  {template.supportedChains.map((chainId) => (
                    <ChainBadge key={chainId} chainId={chainId} />
                  ))}
                </div>
                <p className="policy-template-card__approval">{template.approvalMode}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
