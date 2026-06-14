'use client';

import { useEffect, useState } from 'react';
import { chainName } from '@/lib/constants';
import { mandateDefaultsFromPolicyId } from '@/lib/policy-mandate-config';
import type { AgentDto, PolicyDto } from '@/types/api';

type AuthorityMandateFormProps = {
  agents: AgentDto[];
  policies: PolicyDto[];
  authorityChainId: number;
  verified: boolean;
  walletNeedsChainSwitch: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  defaultPolicyId?: string | null;
};

export function AuthorityMandateForm({
  agents,
  policies,
  authorityChainId,
  verified,
  walletNeedsChainSwitch,
  isSubmitting,
  onSubmit,
  defaultPolicyId,
}: AuthorityMandateFormProps) {
  const activeAgents = agents.filter((agent) => agent.status === 'active');
  const [selectedPolicyId, setSelectedPolicyId] = useState(defaultPolicyId ?? '');
  const [allowedActions, setAllowedActions] = useState('transfer');
  const [allowedAssets, setAllowedAssets] = useState('USDC');
  const [allowedTargets, setAllowedTargets] = useState('*');
  const [maxPerTransaction, setMaxPerTransaction] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState('');
  const [validDays, setValidDays] = useState(30);

  const applyPolicyDefaults = (policyId: string) => {
    const defaults = mandateDefaultsFromPolicyId(policies, policyId);
    if (!defaults) return;
    setAllowedActions(defaults.allowedActions.join(','));
    setAllowedAssets(defaults.allowedAssets.join(','));
    setAllowedTargets(defaults.allowedTargets.join(','));
    setMaxPerTransaction(defaults.maxPerTransaction);
    setMaxTotal(defaults.maxTotal);
    setApprovalThreshold(defaults.approvalThreshold);
    setValidDays(defaults.expiresInDays);
  };

  useEffect(() => {
    if (defaultPolicyId) {
      setSelectedPolicyId(defaultPolicyId);
      applyPolicyDefaults(defaultPolicyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once from default policy
  }, [defaultPolicyId, policies]);

  return (
    <form onSubmit={onSubmit} className="authority-mandate-form space-y-4">
      <div className="app-form-group">
        <label htmlFor="agentId">Active agent</label>
        <select id="agentId" name="agentId" className="app-input" required disabled={!activeAgents.length}>
          <option value="">Select agent</option>
          {activeAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="app-form-group">
        <label htmlFor="policyId">Policy</label>
        <select
          id="policyId"
          name="policyId"
          className="app-input"
          value={selectedPolicyId}
          onChange={(e) => {
            const policyId = e.target.value;
            setSelectedPolicyId(policyId);
            if (policyId) applyPolicyDefaults(policyId);
          }}
        >
          <option value="">Agent default policy</option>
          {policies.map((policy) => (
            <option key={policy.id} value={policy.id}>
              {policy.name}
            </option>
          ))}
        </select>
      </div>

      <div className="app-form-group">
        <label htmlFor="validDays">Valid for (days)</label>
        <input
          id="validDays"
          name="validDays"
          className="app-input"
          type="number"
          min={1}
          value={validDays}
          onChange={(e) => setValidDays(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>

      <details className="authority-mandate-form__advanced">
        <summary>Advanced scope</summary>
        <div className="authority-mandate-form__advanced-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="app-form-group">
              <label htmlFor="allowedActions">Allowed actions</label>
              <input
                id="allowedActions"
                name="allowedActions"
                className="app-input"
                value={allowedActions}
                onChange={(e) => setAllowedActions(e.target.value)}
              />
            </div>
            <div className="app-form-group">
              <label htmlFor="allowedAssets">Allowed assets</label>
              <input
                id="allowedAssets"
                name="allowedAssets"
                className="app-input"
                value={allowedAssets}
                onChange={(e) => setAllowedAssets(e.target.value)}
              />
            </div>
          </div>
          <div className="app-form-group">
            <label htmlFor="allowedTargets">Allowed targets</label>
            <input
              id="allowedTargets"
              name="allowedTargets"
              className="app-input"
              value={allowedTargets}
              onChange={(e) => setAllowedTargets(e.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="app-form-group">
              <label htmlFor="maxPerTransaction">Max per transaction</label>
              <input
                id="maxPerTransaction"
                name="maxPerTransaction"
                className="app-input"
                value={maxPerTransaction}
                onChange={(e) => setMaxPerTransaction(e.target.value)}
              />
            </div>
            <div className="app-form-group">
              <label htmlFor="maxTotal">Max total</label>
              <input
                id="maxTotal"
                name="maxTotal"
                className="app-input"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
              />
            </div>
          </div>
          <div className="app-form-group">
            <label htmlFor="approvalThreshold">Approval threshold</label>
            <input
              id="approvalThreshold"
              name="approvalThreshold"
              className="app-input"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
            />
          </div>
        </div>
      </details>

      <button
        type="submit"
        className="app-btn app-btn-primary"
        disabled={!verified || !activeAgents.length || isSubmitting}
      >
        {isSubmitting ? 'Signing…' : `Sign mandate on ${chainName(authorityChainId)}`}
      </button>

      {!verified && (
        <p className="authority-hint">Verify your wallet on the selected chain before signing a mandate.</p>
      )}
      {verified && walletNeedsChainSwitch && (
        <p className="authority-hint">
          Switch your wallet to {chainName(authorityChainId)} using the banner above, then sign.
        </p>
      )}
    </form>
  );
}
