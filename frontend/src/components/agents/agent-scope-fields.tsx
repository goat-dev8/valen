'use client';

import {
  AGENT_ACTION_OPTIONS,
  AGENT_ASSET_OPTIONS,
  AGENT_NETWORKS,
  allSupportedAssetSymbols,
} from '@/lib/agent-scope';

type AgentScopeFieldsProps = {
  supportedNetworks: number[];
  onSupportedNetworksChange: (chains: number[]) => void;
  supportedAssets: string[];
  onSupportedAssetsChange: (assets: string[]) => void;
  supportedActions: string[];
  onSupportedActionsChange: (actions: string[]) => void;
  allAssets: boolean;
  onAllAssetsChange: (value: boolean) => void;
};

export function AgentScopeFields(props: AgentScopeFieldsProps) {
  const {
    supportedNetworks,
    onSupportedNetworksChange,
    supportedAssets,
    onSupportedAssetsChange,
    supportedActions,
    onSupportedActionsChange,
    allAssets,
    onAllAssetsChange,
  } = props;

  const toggleNetwork = (chainId: number) => {
    onSupportedNetworksChange(
      supportedNetworks.includes(chainId)
        ? supportedNetworks.filter((id) => id !== chainId)
        : [...supportedNetworks, chainId],
    );
  };

  const toggleAsset = (symbol: string) => {
    onAllAssetsChange(false);
    onSupportedAssetsChange(
      supportedAssets.includes(symbol)
        ? supportedAssets.filter((s) => s !== symbol)
        : [...supportedAssets, symbol],
    );
  };

  const toggleAction = (action: string) => {
    onSupportedActionsChange(
      supportedActions.includes(action)
        ? supportedActions.filter((a) => a !== action)
        : [...supportedActions, action],
    );
  };

  return (
    <div className="space-y-4">
      <div className="app-form-group">
        <span className="mb-2 block text-sm font-medium">Supported networks</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {AGENT_NETWORKS.map((network) => (
            <label
              key={network.chainId}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={supportedNetworks.includes(network.chainId)}
                onChange={() => toggleNetwork(network.chainId)}
              />
              {network.label}
            </label>
          ))}
        </div>
      </div>

      <div className="app-form-group">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">Supported assets</span>
          <button
            type="button"
            className="text-xs font-semibold text-[#0066FF] hover:underline"
            onClick={() => {
              onAllAssetsChange(true);
              onSupportedAssetsChange(allSupportedAssetSymbols());
            }}
          >
            All supported assets
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {AGENT_ASSET_OPTIONS.filter((a) => a.symbol !== 'x402').map((asset) => (
            <label
              key={asset.symbol}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={allAssets || supportedAssets.includes(asset.symbol)}
                onChange={() => toggleAsset(asset.symbol)}
              />
              {asset.symbol}
            </label>
          ))}
        </div>
      </div>

      <div className="app-form-group">
        <span className="mb-2 block text-sm font-medium">Supported actions</span>
        <div className="flex flex-wrap gap-2">
          {AGENT_ACTION_OPTIONS.map((action) => (
            <label
              key={action.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={supportedActions.includes(action.value)}
                onChange={() => toggleAction(action.value)}
              />
              {action.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
