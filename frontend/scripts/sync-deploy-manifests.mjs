import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const outputDir = path.join(frontendRoot, 'src', 'data', 'manifests');

const NETWORKS = ['arbitrum-sepolia', 'robinhood-testnet'];

function copyManifest(network, fileName) {
  const sourceDir = fileName === 'deployment.json' ? 'contracts' : 'stylus';
  const sourceSubdir = fileName === 'deployment.json' ? 'deployments' : 'deployments';
  const sourceFile = fileName === 'deployment.json' ? 'deployment.json' : 'engines.json';

  const sourcePath = path.join(repoRoot, sourceDir, sourceSubdir, network, sourceFile);
  const targetPath = path.join(outputDir, network, sourceFile);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`[sync-manifests] missing source: ${sourcePath}`);
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`[sync-manifests] copied ${network}/${sourceFile}`);
}

fs.mkdirSync(outputDir, { recursive: true });

for (const network of NETWORKS) {
  copyManifest(network, 'deployment.json');
  copyManifest(network, 'engines.json');
}
