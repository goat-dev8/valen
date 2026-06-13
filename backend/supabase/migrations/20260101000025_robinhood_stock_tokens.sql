-- VALEN migration 025: promote Robinhood stock tokens to demo-ready ERC-20 assets
-- Verified on Robinhood Chain Testnet 2026-06-13 (on-chain symbol/decimals/code checks).

UPDATE assets SET
  address = '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
  decimals = 18,
  support_level = 'demo-ready',
  settlement_modes = ARRAY['erc20_transfer'],
  metadata = jsonb_build_object(
    'phase', 'D',
    'headline', true,
    'settlementReady', true,
    'supportReason', 'Robinhood Chain testnet ERC-20 verified on-chain; settlement enabled via ValenTokenSettlementAdapter.',
    'safeDemoAmount', '10',
    'refusedDemoAmount', '250'
  ),
  source = 'Robinhood Chain testnet faucet + on-chain verification',
  source_url = 'https://docs.robinhood.com/chain/contracts/',
  verified_at = now(),
  updated_at = now()
WHERE chain_id = 46630 AND symbol = 'TSLA';

UPDATE assets SET
  address = '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02',
  decimals = 18,
  support_level = 'demo-ready',
  settlement_modes = ARRAY['erc20_transfer'],
  metadata = jsonb_build_object(
    'phase', 'D',
    'headline', true,
    'settlementReady', true,
    'supportReason', 'Robinhood Chain testnet ERC-20 verified on-chain; settlement enabled via ValenTokenSettlementAdapter.',
    'safeDemoAmount', '10',
    'refusedDemoAmount', '250'
  ),
  source = 'Robinhood Chain testnet faucet + on-chain verification',
  source_url = 'https://docs.robinhood.com/chain/contracts/',
  verified_at = now(),
  updated_at = now()
WHERE chain_id = 46630 AND symbol = 'AMZN';

UPDATE assets SET
  address = '0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0',
  decimals = 18,
  support_level = 'demo-ready',
  settlement_modes = ARRAY['erc20_transfer'],
  metadata = jsonb_build_object(
    'phase', 'D',
    'headline', true,
    'settlementReady', true,
    'supportReason', 'Robinhood Chain testnet ERC-20 verified on-chain; settlement enabled via ValenTokenSettlementAdapter.',
    'safeDemoAmount', '10',
    'refusedDemoAmount', '250'
  ),
  source = 'Robinhood Chain testnet faucet + on-chain verification',
  source_url = 'https://docs.robinhood.com/chain/contracts/',
  verified_at = now(),
  updated_at = now()
WHERE chain_id = 46630 AND symbol = 'PLTR';

UPDATE assets SET
  address = '0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93',
  decimals = 18,
  support_level = 'demo-ready',
  settlement_modes = ARRAY['erc20_transfer'],
  metadata = jsonb_build_object(
    'phase', 'D',
    'headline', true,
    'settlementReady', true,
    'supportReason', 'Robinhood Chain testnet ERC-20 verified on-chain; settlement enabled via ValenTokenSettlementAdapter.',
    'safeDemoAmount', '10',
    'refusedDemoAmount', '250'
  ),
  source = 'Robinhood Chain testnet faucet + on-chain verification',
  source_url = 'https://docs.robinhood.com/chain/contracts/',
  verified_at = now(),
  updated_at = now()
WHERE chain_id = 46630 AND symbol = 'NFLX';

UPDATE assets SET
  address = '0x71178BAc73cBeb415514eB542a8995b82669778d',
  decimals = 18,
  support_level = 'demo-ready',
  settlement_modes = ARRAY['erc20_transfer'],
  metadata = jsonb_build_object(
    'phase', 'D',
    'headline', true,
    'settlementReady', true,
    'supportReason', 'Robinhood Chain testnet ERC-20 verified on-chain; settlement enabled via ValenTokenSettlementAdapter.',
    'safeDemoAmount', '10',
    'refusedDemoAmount', '250'
  ),
  source = 'Robinhood Chain testnet faucet + on-chain verification',
  source_url = 'https://docs.robinhood.com/chain/contracts/',
  verified_at = now(),
  updated_at = now()
WHERE chain_id = 46630 AND symbol = 'AMD';
