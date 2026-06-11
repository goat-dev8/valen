import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const NETWORKS = [
  { key: 'arbitrum-sepolia', label: 'Arbitrum Sepolia', chainId: 421614 },
  { key: 'robinhood-testnet', label: 'Robinhood Testnet', chainId: 46630 },
] as const;

type SolidityManifest = {
  timestamp?: string;
  contracts: Record<string, { address: string; implementation?: string }>;
};

type StylusManifest = Record<
  string,
  {
    address: string;
    version?: string;
    activated?: boolean;
    deploymentTx?: string;
    package?: string;
  }
>;

function manifestCandidates(network: string, fileName: 'deployment.json' | 'engines.json') {
  const subdir = fileName === 'deployment.json' ? 'contracts' : 'stylus';
  const repoFile = fileName === 'deployment.json' ? 'deployment.json' : 'engines.json';

  return [
    path.join(process.cwd(), 'src', 'data', 'manifests', network, fileName),
    path.resolve(process.cwd(), '..', subdir, 'deployments', network, repoFile),
    path.resolve(process.cwd(), '..', '..', subdir, 'deployments', network, repoFile),
  ];
}

async function readJsonFromCandidates<T>(candidates: string[]): Promise<T> {
  let lastError: unknown;

  for (const filePath of candidates) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Manifest not found. Checked: ${candidates.join(', ')}`);
}

export async function GET() {
  try {
    const networks = await Promise.all(
      NETWORKS.map(async (network) => {
        const solidity = await readJsonFromCandidates<SolidityManifest>(
          manifestCandidates(network.key, 'deployment.json'),
        );
        const stylus = await readJsonFromCandidates<StylusManifest>(
          manifestCandidates(network.key, 'engines.json'),
        );

        const solidityContracts = Object.entries(solidity.contracts).map(([name, contract]) => ({
          name,
          type: 'Solidity' as const,
          address: contract.address,
          implementation: contract.implementation ?? null,
          version: contract.implementation ? 'proxy' : 'direct',
          status: 'deployed',
          health: 'manifest-present',
        }));

        const stylusContracts = Object.entries(stylus).map(([name, engine]) => ({
          name,
          type: 'Stylus' as const,
          address: engine.address,
          implementation: null,
          version: engine.version ?? 'unknown',
          status: engine.activated ? 'activated' : 'not-activated',
          health: engine.activated ? 'manifest-activated' : 'manifest-warning',
          deploymentTx: engine.deploymentTx ?? null,
          package: engine.package ?? null,
        }));

        return {
          ...network,
          manifestTimestamp: solidity.timestamp ?? null,
          contracts: [...solidityContracts, ...stylusContracts],
        };
      }),
    );

    return NextResponse.json({
      source: 'deployment-manifests',
      generatedAt: new Date().toISOString(),
      networks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        code: 'MANIFESTS_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Failed to load deployment manifests',
      },
      { status: 500 },
    );
  }
}
