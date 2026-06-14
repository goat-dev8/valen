import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const outputDir = path.join(frontendRoot, 'src', 'data', 'manifests');

const NETWORKS = ['arbitrum-sepolia', 'robinhood-testnet'];
const FORCE = process.env.FORCE_MANIFEST_SYNC === '1';

function copyManifest(network, fileName) {
  const sourceDir = fileName === 'deployment.json' ? 'contracts' : 'stylus';
  const sourceSubdir = 'deployments';
  const sourceFile = fileName === 'deployment.json' ? 'deployment.json' : 'engines.json';

  const sourcePath = path.join(repoRoot, sourceDir, sourceSubdir, network, sourceFile);
  const targetPath = path.join(outputDir, network, sourceFile);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`[sync-manifests] missing source: ${sourcePath}`);
    return;
  }

  if (!FORCE && fs.existsSync(targetPath)) {
    const srcMtime = fs.statSync(sourcePath).mtimeMs;
    const dstMtime = fs.statSync(targetPath).mtimeMs;
    if (dstMtime >= srcMtime) {
      return;
    }
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`[sync-manifests] copied ${network}/${sourceFile}`);
}

if (FORCE || !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let copied = 0;
for (const network of NETWORKS) {
  for (const fileName of ['deployment.json', 'engines.json']) {
    const sourceDir = fileName === 'deployment.json' ? 'contracts' : 'stylus';
    const sourcePath = path.join(repoRoot, sourceDir, 'deployments', network, fileName);
    const targetPath = path.join(outputDir, network, fileName);
    const before = fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
    copyManifest(network, fileName);
    if (fs.existsSync(targetPath)) {
      const after = fs.readFileSync(targetPath);
      if (!before || !before.equals(after)) copied += 1;
    }
  }
}

if (copied === 0) {
  console.log('[sync-manifests] up to date (FORCE_MANIFEST_SYNC=1 to force)');
} else {
  console.log(`[sync-manifests] synced ${copied} file(s)`);
}
