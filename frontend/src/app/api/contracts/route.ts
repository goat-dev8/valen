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

function repoPath(...parts: string[]) {
  return path.resolve(process.cwd(), '..', ...parts);
}

async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
}

export async function GET() {
  const networks = await Promise.all(
    NETWORKS.map(async (network) => {
      const solidity = await readJson<SolidityManifest>(
        repoPath('contracts', 'deployments', network.key, 'deployment.json'),
      );
      const stylus = await readJson<StylusManifest>(
        repoPath('stylus', 'deployments', network.key, 'engines.json'),
      );

      const solidityContracts = Object.entries(solidity.contracts).map(([name, contract]) => ({
        name,
        type: 'Solidity',
        address: contract.address,
        implementation: contract.implementation ?? null,
        version: contract.implementation ? 'proxy' : 'direct',
        status: 'deployed',
        health: 'manifest-present',
      }));

      const stylusContracts = Object.entries(stylus).map(([name, engine]) => ({
        name,
        type: 'Stylus',
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
}
