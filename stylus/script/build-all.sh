#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Building VALEN Stylus engines (wasm32-unknown-unknown, release)..."
rustup target add wasm32-unknown-unknown >/dev/null 2>&1 || true

ENGINES=(
  compliance-engine
  risk-engine
  eligibility-engine
  policy-engine
)

for engine in "${ENGINES[@]}"; do
  echo "==> $engine"
  cargo build --release --target wasm32-unknown-unknown -p "$engine"
done

echo "All engines built successfully."
