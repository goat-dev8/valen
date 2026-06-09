#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ABI_DIR="$ROOT/abi"
mkdir -p "$ABI_DIR"

ENGINES=(
  compliance-engine
  risk-engine
  eligibility-engine
  policy-engine
)

for engine in "${ENGINES[@]}"; do
  echo "==> export-abi $engine"
  cargo stylus export-abi --contract "$engine" --output "$ABI_DIR/${engine}.sol"
done

echo "ABI artifacts written to $ABI_DIR"
