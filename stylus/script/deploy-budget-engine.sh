#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NETWORK="${1:-arbitrum-sepolia}"
RPC_URL="${2:-}"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

case "$NETWORK" in
  arbitrum-sepolia) RPC_URL="${RPC_URL:-${ARB_SEPOLIA_RPC:-}}" ;;
  robinhood-testnet) RPC_URL="${RPC_URL:-${ROBINHOOD_TESTNET_RPC:-}}" ;;
  *)
    echo "Unsupported network: $NETWORK" >&2
    exit 1
    ;;
esac

if [[ -z "$RPC_URL" || -z "${PRIVATE_KEY:-}" ]]; then
  echo "RPC_URL and PRIVATE_KEY are required" >&2
  exit 1
fi

OUT="deployments/${NETWORK}/engines.json"
mkdir -p "deployments/${NETWORK}"

echo "Checking BudgetEngine"
cargo stylus check --contract budget-engine -e "$RPC_URL"

echo "Deploying BudgetEngine"
output="$(cargo stylus deploy --no-verify --contract budget-engine -e "$RPC_URL" --private-key "$PRIVATE_KEY" --max-fee-per-gas-gwei 1 2>&1)"
echo "$output"
clean_output="$(echo "$output" | sed -r 's/\x1B\[[0-9;]*[a-zA-Z]//g')"
address="$(echo "$clean_output" | sed -nE 's/.*deployed code at address: (0x[0-9a-fA-F]{40}).*/\1/p' | tail -n1)"
tx_hash="$(echo "$clean_output" | sed -nE 's/.*deployment tx hash: (0x[0-9a-fA-F]{64}).*/\1/p' | tail -n1)"

if [[ -z "$address" ]]; then
  echo "Could not parse deployed address for BudgetEngine" >&2
  exit 1
fi

node <<NODE
const fs = require('fs');
const path = require('path');
const outPath = path.join('$OUT');
const current = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
current.BudgetEngine = {
  address: '$address',
  version: '1.0.0',
  activated: true,
  deploymentTx: '${tx_hash:-}',
  package: 'budget-engine',
};
fs.writeFileSync(outPath, JSON.stringify(current, null, 2) + '\n');
console.log(JSON.stringify(current.BudgetEngine, null, 2));
NODE

echo "BudgetEngine merged into ${OUT}"
