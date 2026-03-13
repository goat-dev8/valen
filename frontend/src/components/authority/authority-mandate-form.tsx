'use client';

import { chainName } from '@/lib/constants';
import type { AgentDto, PolicyDto } from '@/types/api';

type AuthorityMandateFormProps = {
  agents: AgentDto[];
  policies: PolicyDto[];
  authorityChainId: number;
  verified: boolean;
  walletNeedsChainSwitch: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function AuthorityMandateForm({
  agents,
  policies,
  authorityChainId,
  verified,
  walletNeedsChainSwitch,
  isSubmitting,
  onSubmit,
}: AuthorityMandateFormProps) {
  const activeAgents = agents.filter((agent) => agent.status === 'active');

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
        <select id="policyId" name="policyId" className="app-input">
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
        <input id="validDays" name="validDays" className="app-input" type="number" min={1} defaultValue={30} />
      </div>

      <details className="authority-mandate-form__advanced">
        <summary>Advanced scope</summary>
        <div className="authority-mandate-form__advanced-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="app-form-group">
              <label htmlFor="allowedActions">Allowed actions</label>
              <input id="allowedActions" name="allowedActions" className="app-input" defaultValue="transfer" />
            </div>
            <div className="app-form-group">
              <label htmlFor="allowedAssets">Allowed assets</label>
              <input id="allowedAssets" name="allowedAssets" className="app-input" defaultValue="native" />
            </div>
          </div>
          <div className="app-form-group">
            <label htmlFor="allowedTargets">Allowed targets</label>
            <input id="allowedTargets" name="allowedTargets" className="app-input" defaultValue="*" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="app-form-group">
              <label htmlFor="maxPerTransaction">Max per transaction</label>
              <input id="maxPerTransaction" name="maxPerTransaction" className="app-input" placeholder="0.1 ETH" />
            </div>
            <div className="app-form-group">
              <label htmlFor="maxTotal">Max total</label>
              <input id="maxTotal" name="maxTotal" className="app-input" placeholder="1 ETH" />
            </div>
          </div>
          <div className="app-form-group">
            <label htmlFor="approvalThreshold">Approval threshold</label>
            <input
              id="approvalThreshold"
              name="approvalThreshold"
              className="app-input"
              placeholder="risk_score >= 60"
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
