-- VALEN migration 020: Phase D Robinhood action type and scenario metadata.
-- Purpose: make Robinhood tokenized-stock actions first-class while keeping
-- stock-token settlement metadata-only until token contracts are verified.

ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'robinhood_token_transfer';

UPDATE assets
SET metadata = metadata || jsonb_build_object(
  'phase', 'D',
  'headline', true,
  'supportReason', 'Robinhood docs/faucet document this stock-token ticker; public contract address not published yet.',
  'safeDemoAmount', '10',
  'refusedDemoAmount', '250',
  'settlementRail', 'USDG'
),
updated_at = now()
WHERE chain_id = 46630
  AND symbol IN ('TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD');

UPDATE assets
SET metadata = metadata || jsonb_build_object(
  'phase', 'D',
  'headline', true,
  'supportReason', 'Robinhood Chain official contract table publishes USDG; Phase C E2E proved ERC-20 settlement.',
  'safeDemoAmount', '0.001',
  'refusedDemoAmount', '250',
  'settlementRail', 'USDG'
),
updated_at = now()
WHERE chain_id = 46630
  AND symbol = 'USDG';
