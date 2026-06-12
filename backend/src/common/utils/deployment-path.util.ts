import { existsSync } from 'fs';
import { join } from 'path';

const DEPLOYMENT_MARKERS = [
  ['stylus', 'deployments', 'arbitrum-sepolia', 'engines.json'],
  ['contracts', 'deployments', 'arbitrum-sepolia', 'deployment.json'],
] as const;

export function resolveDeploymentRoot(): string {
  const candidates = [join(process.cwd(), '..'), process.cwd(), '/'];

  for (const root of candidates) {
    if (
      DEPLOYMENT_MARKERS.every((parts) => existsSync(join(root, ...parts)))
    ) {
      return root;
    }
  }

  return join(process.cwd(), '..');
}
