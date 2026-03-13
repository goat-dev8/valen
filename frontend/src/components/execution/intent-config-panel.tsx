'use client';

import { ArrowRight } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { SelectedAssetBalance } from '@/components/app/selected-asset-balance';
import type { KnownAsset } from '@/lib/known-assets';

type IntentConfigPanelProps = {
  chainId: number;
  amount: string;
  amountSymbol: string;
  targetAddress: string;
  assetAddress: string;
  chainAssets: KnownAsset[];
  settlementNote: string;
  connectedWallet?: string;
  resolvedAsset: string;
  balanceWarning?: { ok: boolean; message?: string };
  onAmountChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onAssetChange: (value: string) => void;
  assetSelectValue: string;
  onBack: () => void;
  onContinue: () => void;
};

export function IntentConfigPanel({
  chainId,
  amount,
  amountSymbol,
  targetAddress,
  chainAssets,
  settlementNote,
  connectedWallet,
  resolvedAsset,
  balanceWarning,
  onAmountChange,
  onTargetChange,
  onAssetChange,
  assetSelectValue,
  onBack,
  onContinue,
}: IntentConfigPanelProps) {
  return (
    <div className="intent-config-panel">
      <div className="intent-step-intro">
        <p className="intent-step-eyebrow">Step 3</p>
        <h2 className="intent-step-title">Configure settlement</h2>
        <p className="intent-step-desc">Set the amount, asset, and recipient. Defaults come from the template.</p>
      </div>

      <div className="intent-config-fields">
        <div className="intent-config-field intent-config-field--highlight">
          <label htmlFor="amount">Amount ({amountSymbol})</label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="intent-config-amount"
            placeholder="0.00"
          />
          <SelectedAssetBalance walletAddress={connectedWallet} chainId={chainId} assetValue={resolvedAsset} />
          {balanceWarning && !balanceWarning.ok && balanceWarning.message && (
            <p className="intent-hint intent-hint--warn">{balanceWarning.message}</p>
          )}
        </div>

        <div className="intent-config-row">
          <div className="intent-config-field">
            <label>Network</label>
            <div className="intent-config-readonly">
              <ChainBadge chainId={chainId} />
            </div>
          </div>
          <div className="intent-config-field">
            <label htmlFor="assetAddress">Asset</label>
            <select
              id="assetAddress"
              className="app-input"
              value={assetSelectValue}
              onChange={(e) => {
                if (e.target.value !== 'custom') onAssetChange(e.target.value);
              }}
            >
              {chainAssets.map((asset) => (
                <option key={asset.id} value={asset.mandateValue}>
                  {asset.label}
                </option>
              ))}
              <option value="custom">Custom address</option>
            </select>
          </div>
        </div>

        <div className="intent-config-field">
          <label htmlFor="target">Recipient address</label>
          <input
            id="target"
            name="targetAddress"
            type="text"
            value={targetAddress}
            onChange={(e) => onTargetChange(e.target.value)}
            className="app-input font-mono text-sm"
            required
          />
          <p className="intent-hint">{settlementNote}</p>
        </div>
      </div>

      <div className="intent-step-actions">
        <button type="button" className="app-btn app-btn-outline" onClick={onBack}>
          Back
        </button>
        <button type="button" className="app-btn app-btn-primary" onClick={onContinue}>
          Review intent
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
