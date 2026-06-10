/**
 * Phase 5.3 governance proof: register → queue → verify queued state.
 * Execute requires timelock minDelay 86400s on deployed testnet.
 */
import 'dotenv/config';
import { keccak256, stringToHex } from 'viem';
import { readFileSync } from 'fs';
import { join } from 'path';

const API = process.env.PROVE_API_URL ?? 'http://127.0.0.1:3000';
const CHAIN_ID = 421614;
const deployment = JSON.parse(
  readFileSync(
    join(process.cwd(), '..', 'contracts', 'deployments', 'arbitrum-sepolia', 'deployment.json'),
    'utf8',
  ),
) as { contracts: { ValenGovernance: { address: string } } };
const GOVERNANCE_TARGET = deployment.contracts.ValenGovernance.address;

async function main() {
  const operatorKey = process.env.OPERATOR_DASHBOARD_SECRET;
  if (!operatorKey) throw new Error('OPERATOR_DASHBOARD_SECRET required');

  const headers = {
    'content-type': 'application/json',
    'x-operator-key': operatorKey,
  };

  const proposalHash = keccak256(stringToHex(`phase53-proposal-${Date.now()}`));
  const metadataHash = keccak256(stringToHex(`phase53-metadata-${Date.now()}`));

  const registerRes = await fetch(`${API}/v1/operator/governance/proposal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ chainId: CHAIN_ID, proposalHash, metadataHash }),
  });
  const register = await registerRes.json();
  console.log('REGISTER', registerRes.status, JSON.stringify(register));
  if (!registerRes.ok) process.exit(1);

  const salt = keccak256(stringToHex(`phase53-salt-${Date.now()}`));
  const queueRes = await fetch(`${API}/v1/operator/governance/queue`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chainId: CHAIN_ID,
      target: GOVERNANCE_TARGET,
      valueWei: '0',
      data: '0x',
      predecessor: `0x${'0'.repeat(64)}`,
      salt,
      delay: 86400,
    }),
  });
  const queue = await queueRes.json();
  console.log('QUEUE', queueRes.status, JSON.stringify(queue));

  const statusRes = await fetch(`${API}/v1/operator/governance/status?chainId=${CHAIN_ID}`, {
    headers: { 'x-operator-key': operatorKey },
  });
  console.log('STATUS', statusRes.status, await statusRes.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
