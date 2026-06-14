'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { explorerAddressUrl, explorerTxUrl } from '@/lib/explorer';

type ContractRow = {
  name: string;
  type: 'Solidity' | 'Stylus';
  address: string;
  implementation: string | null;
  version: string;
  status: string;
  health: string;
  deploymentTx?: string | null;
  package?: string | null;
};

type ContractNetwork = {
  key: string;
  label: string;
  chainId: number;
  manifestTimestamp: string | null;
  contracts: ContractRow[];
};

type ContractsResponse = {
  source: string;
  generatedAt: string;
  networks: ContractNetwork[];
};

const REQUIRED_BY_NETWORK: Record<number, string[]> = {
  421614: [
    'ValenRegistry',
    'ValenSettlement',
    'ValenGovernance',
    'ValenTreasury',
    'ComplianceEngine',
    'RiskEngine',
    'EligibilityEngine',
    'PolicyEngine',
  ],
  46630: [
    'ValenRegistry',
    'ValenSettlement',
    'ComplianceEngine',
    'RiskEngine',
    'EligibilityEngine',
    'PolicyEngine',
  ],
};

function shortAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function statusTone(status: string) {
  if (status.includes('activated') || status.includes('deployed')) return 'wallet-status-ok';
  return 'wallet-status-warn';
}

export default function ContractsPage() {
  const contractsQuery = useQuery({
    queryKey: ['contracts-manifests'],
    queryFn: async () => {
      const response = await fetch('/api/contracts', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Contracts manifest request failed (${response.status})`);
      return (await response.json()) as ContractsResponse;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts Center"
        description="Deployment-manifest sourced contract addresses for Arbitrum Sepolia and Robinhood Testnet."
      />

      <QueryState
        isLoading={contractsQuery.isLoading}
        error={contractsQuery.error}
        isEmpty={!(contractsQuery.data?.networks?.length ?? 0)}
      >
        <div className="space-y-6">
          {contractsQuery.data?.networks.map((network) => {
            const required = REQUIRED_BY_NETWORK[network.chainId] ?? [];
            const missing = required.filter((name) => !network.contracts.some((contract) => contract.name === name));

            return (
              <div key={network.key} className="app-card">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="app-card-title">{network.label}</h3>
                      <ChainBadge chainId={network.chainId} />
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">
                      Source: deployment manifests · Updated {network.manifestTimestamp ? new Date(network.manifestTimestamp).toLocaleString() : 'unknown'}
                    </p>
                  </div>
                  <span className={`wallet-status ${missing.length ? 'wallet-status-error' : 'wallet-status-ok'}`}>
                    {missing.length ? `${missing.length} missing` : 'Complete'}
                  </span>
                </div>

                {missing.length > 0 && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Missing required contracts from manifest: {missing.join(', ')}
                  </div>
                )}

                <div className="app-table-wrap">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Contract</th>
                        <th>Type</th>
                        <th>Address</th>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Health</th>
                        <th>Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {network.contracts.map((contract) => (
                        <tr key={`${network.key}-${contract.name}`}>
                          <td>
                            <div className="font-semibold text-[#012b54]">{contract.name}</div>
                            {contract.package && <div className="text-xs text-[#64748b]">{contract.package}</div>}
                          </td>
                          <td>{contract.type}</td>
                          <td>
                            <code className="font-mono text-xs">{shortAddress(contract.address)}</code>
                          </td>
                          <td>{contract.version}</td>
                          <td>
                            <span className={`wallet-status ${statusTone(contract.status)}`}>{contract.status}</span>
                          </td>
                          <td className="text-xs text-[#64748b]">{contract.health}</td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={explorerAddressUrl(network.chainId, contract.address)}
                                target="_blank"
                                rel="noreferrer"
                                className="app-link inline-flex items-center gap-1"
                              >
                                Address <ExternalLink className="h-3 w-3" />
                              </a>
                              {contract.deploymentTx && (
                                <a
                                  href={explorerTxUrl(network.chainId, contract.deploymentTx)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="app-link inline-flex items-center gap-1"
                                >
                                  Deploy tx <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
