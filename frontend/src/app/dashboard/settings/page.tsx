'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useOrganization } from '@/contexts/org-context';
import { useUpdateOrganization } from '@/hooks/use-valen-api';
import { chainName } from '@/lib/constants';

export default function SettingsPage() {
  const { organization, loading } = useOrganization();
  const updateMutation = useUpdateOrganization();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setMessage(null);
    try {
      await updateMutation.mutateAsync({
        name: formData.get('name') as string,
        defaultChainId: Number(formData.get('defaultChainId')),
        riskMode: formData.get('riskMode') as string,
        complianceMode: formData.get('complianceMode') as string,
      });
      setMessage('Settings saved successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Organization Settings" description="Configure your VALEN compliance layer" />

      <QueryState isLoading={loading} error={null} isEmpty={!organization}>
        {organization && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="app-card">
                <h3 className="app-card-title mb-4">General</h3>
                <div className="space-y-4">
                  <div className="app-form-group">
                    <label htmlFor="org-name">Organization Name</label>
                    <input id="org-name" name="name" type="text" defaultValue={organization.name} className="app-input" />
                  </div>
                  <div className="app-form-group">
                    <label htmlFor="org-slug">Slug</label>
                    <input id="org-slug" type="text" defaultValue={organization.slug} className="app-input" disabled />
                  </div>
                  <div className="app-form-group">
                    <label htmlFor="default-chain">Default Chain</label>
                    <select id="default-chain" name="defaultChainId" className="app-input" defaultValue={organization.defaultChainId ?? 421614}>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={46630}>Robinhood Testnet</option>
                    </select>
                    <p className="text-xs text-[#64748b]">Current: {chainName(organization.defaultChainId)}</p>
                  </div>
                </div>
              </div>

              <div className="app-card">
                <h3 className="app-card-title mb-4">Risk & Compliance</h3>
                <div className="space-y-4">
                  <div className="app-form-group">
                    <label htmlFor="risk-mode">Risk Mode</label>
                    <select id="risk-mode" name="riskMode" className="app-input" defaultValue={organization.riskMode}>
                      <option value="standard">Standard</option>
                      <option value="conservative">Conservative</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="app-form-group">
                    <label htmlFor="compliance-mode">Compliance Mode</label>
                    <select id="compliance-mode" name="complianceMode" className="app-input" defaultValue={organization.complianceMode}>
                      <option value="fail_closed">Strict (fail-closed)</option>
                      <option value="monitor_only">Monitor only</option>
                    </select>
                  </div>
                  <div className="app-form-group">
                    <label htmlFor="plan">Plan</label>
                    <input id="plan" type="text" defaultValue={organization.plan} className="app-input" disabled />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button type="submit" className="app-btn app-btn-primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {message && <p className="text-sm text-[#64748b]">{message}</p>}
            </div>
          </form>
        )}
      </QueryState>
    </div>
  );
}
