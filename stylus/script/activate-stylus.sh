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

if ! cargo stylus --version >/dev/null 2>&1; then
  echo "cargo-stylus is required" >&2
  exit 1
fi

mkdir -p "deployments/${NETWORK}"
OUT="deployments/${NETWORK}/engines.json"

declare -A ENGINE_PACKAGES=(
  [ComplianceEngine]=compliance-engine
  [RiskEngine]=risk-engine
  [EligibilityEngine]=eligibility-engine
  [PolicyEngine]=policy-engine
)

echo "{" > "$OUT"
first=1

for name in ComplianceEngine RiskEngine EligibilityEngine PolicyEngine; do
  pkg="${ENGINE_PACKAGES[$name]}"
  echo "Checking ${name} (${pkg})"
  cargo stylus check --contract "$pkg" -e "$RPC_URL"

  echo "Deploying ${name} (${pkg})"
  output="$(cargo stylus deploy --no-verify --contract "$pkg" -e "$RPC_URL" --private-key "$PRIVATE_KEY" --max-fee-per-gas-gwei 1 2>&1)"
  echo "$output"
  clean_output="$(echo "$output" | sed -r 's/\x1B\[[0-9;]*[a-zA-Z]//g')"
  address="$(echo "$clean_output" | sed -nE 's/.*deployed code at address: (0x[0-9a-fA-F]{40}).*/\1/p' | tail -n1)"
  tx_hash="$(echo "$clean_output" | sed -nE 's/.*deployment tx hash: (0x[0-9a-fA-F]{64}).*/\1/p' | tail -n1)"
  if [[ -z "$address" ]]; then
    echo "Could not parse deployed address for ${name}" >&2
    exit 1
  fi

  if [[ "$first" -eq 1 ]]; then
    first=0
  else
    echo "," >> "$OUT"
  fi
  printf '  "%s": { "address": "%s", "version": "1.0.0", "activated": true, "deploymentTx": "%s", "package": "%s" }' \
    "$name" "$address" "${tx_hash:-}" "$pkg" >> "$OUT"
done

echo "" >> "$OUT"
echo "}" >> "$OUT"

echo "Stylus engines deployed to ${OUT}"
