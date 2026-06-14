'use client';

import {
  AGENT_ASSET_OPTIONS,
  AGENT_NETWORKS,
  allSupportedAssetSymbols,
} from '@/lib/agent-scope';
import { MANDATE_ACTION_OPTIONS } from '@/lib/policy-mandate-config';

type MandateScopeFieldsProps = {
  allowedChains: number[];
  onAllowedChainsChange: (chains: number[]) => void;
  allowedAssets: string[];
  onAllowedAssetsChange: (assets: string[]) => void;
  allowedActions: string[];
  onAllowedActionsChange: (actions: string[]) => void;
  allAssets: boolean;
  onAllAssetsChange: (value: boolean) => void;
  actionOptions?: ReadonlyArray<{ value: string; label: string }>;
};

export function MandateScopeFields({
  allowedChains,
  onAllowedChainsChange,
  allowedAssets,
  onAllowedAssetsChange,
  allowedActions,
  onAllowedActionsChange,
  allAssets,
  onAllAssetsChange,
  actionOptions = MANDATE_ACTION_OPTIONS,
}: MandateScopeFieldsProps) {
  const toggleChain = (chainId: number) => {
    onAllowedChainsChange(
      allowedChains.includes(chainId)
        ? allowedChains.filter((id) => id !== chainId)
        : [...allowedChains, chainId],
    );
  };

  const toggleAsset = (symbol: string) => {
    onAllAssetsChange(false);
    onAllowedAssetsChange(
      allowedAssets.includes(symbol)
        ? allowedAssets.filter((s) => s !== symbol)
        : [...allowedAssets, symbol],
    );
  };

  const toggleAction = (action: string) => {
    onAllowedActionsChange(
      allowedActions.includes(action)
        ? allowedActions.filter((a) => a !== action)
        : [...allowedActions, action],
    );
  };

  const selectAllAssets = () => {
    onAllAssetsChange(true);
    onAllowedAssetsChange(allSupportedAssetSymbols());
  };

  return (
    <div className="space-y-4">
      <div className="app-form-group">
        <span className="mb-2 block text-sm font-medium">Allowed chains</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {AGENT_NETWORKS.map((network) => (
            <label
              key={network.chainId}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8ECF0] bg-white px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={allowedChains.includes(network.chainId)}
                onChange={() => toggleChain(network.chainId)}
              />
              {network.label}
            </label>
          ))}
        </div>
      </div>

      <div className="app-form-group">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">Allowed assets</span>
          <button type="button" className="text-xs font-semibold text-[#0066FF] hover:underline" onClick={selectAllAssets}>
            All supported assets
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {AGENT_ASSET_OPTIONS.filter((a) => a.symbol !== 'x402').map((asset) => (
            <label
              key={asset.symbol}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8ECF0] bg-white px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={allAssets || allowedAssets.includes(asset.symbol)}
                onChange={() => toggleAsset(asset.symbol)}
              />
              {asset.symbol}
            </label>
          ))}
        </div>
      </div>

      <div className="app-form-group">
        <span className="mb-2 block text-sm font-medium">Allowed actions</span>
        <div className="flex flex-wrap gap-2">
          {actionOptions.map((action) => (
            <label
              key={action.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8ECF0] bg-white px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={allowedActions.includes(action.value)}
                onChange={() => toggleAction(action.value)}
              />
              {action.label}
            </label>
          ))}
        </div>
      </div>

      {allowedChains.map((chainId) => (
        <input key={`chain-${chainId}`} type="hidden" name="allowedChains" value={chainId} />
      ))}
      {(allAssets ? allSupportedAssetSymbols() : allowedAssets).map((symbol) => (
        <input key={`asset-${symbol}`} type="hidden" name="allowedAssets" value={symbol} />
      ))}
      {allowedActions.map((action) => (
        <input key={`action-${action}`} type="hidden" name="allowedActions" value={action} />
      ))}
    </div>
  );
}
