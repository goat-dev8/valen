# VALEN Proof Pack

Generated: 2026-06-13

This is the Phase A proof pack. It is a baseline artifact, not the final Phase I public Proof Pack product. Phase I must replace this with public-safe API-backed proofs and a verifier CLI.

## Current Proof Sources

- DB execution/settlement snapshot: `docs/proofs/phase-a-db-baseline.json`
- Schema snapshot: `docs/proofs/baseline-schema.sql`
- Chain bytecode verification: `docs/proofs/phase-a-chain-verification.json`
- Arbitrum Sepolia E2E contract report: `contracts/reports/e2e-arbitrum-sepolia.json`
- Robinhood Testnet E2E contract report: `contracts/reports/e2e-robinhood-testnet.json`
- Arbitrum Sepolia deployment manifest: `contracts/deployments/arbitrum-sepolia/deployment.json`
- Robinhood Testnet deployment manifest: `contracts/deployments/robinhood-testnet/deployment.json`
- Arbitrum Sepolia Stylus engines: `stylus/deployments/arbitrum-sepolia/engines.json`
- Robinhood Testnet Stylus engines: `stylus/deployments/robinhood-testnet/engines.json`

## Baseline Successful Executions

### Arbitrum Sepolia

- Chain ID: `421614`
- Execution ID: `d872b0a7-e7de-4a86-887b-b6ac682c7173`
- Agent ID: `64f56184-eacf-4eef-bc84-f3b863d3894f`
- Mandate ID: `6ef127ee-c1f2-494a-ba3a-fee940623242`
- Status: `executed`
- Settlement status: `confirmed`
- Settlement contract: `0x993622D55Ea095aB71165Caf191B21E6e3A71D4A`
- Settlement tx: `0x02eaa3d90a289a1bc9a63a2a96b8d9beb18f2c2a07625261fdb7975a16b81bed`
- Block: `276595222`
- Asset: native legacy settlement (`asset_address = null`)
- Amount: `1000000000000000` wei
- Explorer: `https://sepolia.arbiscan.io/tx/0x02eaa3d90a289a1bc9a63a2a96b8d9beb18f2c2a07625261fdb7975a16b81bed`

### Robinhood Testnet

- Chain ID: `46630`
- Execution ID: `7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c`
- Agent ID: `64f56184-eacf-4eef-bc84-f3b863d3894f`
- Mandate ID: `aab33461-c700-4df7-bbc2-742019d49354`
- Status: `executed`
- Settlement status: `confirmed`
- Settlement contract: `0x91CdD9a481C732bEB09Ce039da23DC11e83547a4`
- Settlement tx: `0x200a90a225d6ddb73705174b2367afca9357831c5e70a604ef38e9265b5c1f30`
- Block: `74414881`
- Policy asset label: `TSLA`
- Settlement mode: native legacy until Robinhood token adapter ships.
- Amount: `1000000000000000` wei
- Explorer: `https://explorer.testnet.chain.robinhood.com/tx/0x200a90a225d6ddb73705174b2367afca9357831c5e70a604ef38e9265b5c1f30`

## Contract Verification Summary

The Phase A bytecode verification uses `viem getCode` through the backend RPC configuration. Secrets are not written to this proof pack.

Result:

- Arbitrum Sepolia: bytecode present for every deployed contract/proxy/implementation in `deployment.json`; bytecode present for all 4 Stylus engines.
- Robinhood Testnet: bytecode present for every deployed contract/proxy/implementation in `deployment.json`; bytecode present for all 4 Stylus engines.

Full artifact: `docs/proofs/phase-a-chain-verification.json`.

## Current Public Proof API Status

Public Proof API is not yet shipped.

Observed production responses:

- `GET https://valen-api-m3g4.onrender.com/api/v1/proofs/executions/d872b0a7-e7de-4a86-887b-b6ac682c7173` -> `404`
- `GET https://valen-api-m3g4.onrender.com/api/v1/proofs/executions/7cfa54c3-7cea-4cf3-bb6d-b207b3045b4c` -> `404`
- `GET https://valen-api-m3g4.onrender.com/api/v1/proofs/pack` -> `404`

This is expected in Phase A and becomes active implementation in Phase I.

## Render Health

Actual production health endpoints:

- `GET /health/live` -> `200`
- `GET /health/ready` -> `200` with database and Redis OK
- `GET /health/deep` -> `200` with database and Redis OK

## Historical Failures

Any previous failed/stuck execution visible in the UI or docs must be labelled:

> Historical pre-fix run: kept for audit continuity, not representative of current baseline.

## Phase I Upgrade Target

The final public Proof Pack must add:

- `GET /api/v1/public/proofs/executions/:id`
- `GET /api/v1/public/proofs/refusals/:id`
- `GET /api/v1/public/proofs/payments/:id`
- `GET /api/v1/public/proofs/pack`
- verifier CLI
- schema lock tests
- privacy tests
- refusal receipts
- x402 payment proofs
- ERC-8004 identity evidence

