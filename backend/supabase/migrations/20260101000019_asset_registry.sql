-- VALEN migration 019: Phase C asset registry and token settlement statuses
-- Purpose: make USDC and Robinhood assets first-class metadata across backend and UI.

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id integer NOT NULL REFERENCES chain_networks (chain_id),
  symbol text NOT NULL,
  name text NOT NULL,
  address text,
  decimals integer NOT NULL,
  category text NOT NULL,
  support_level text NOT NULL,
  settlement_modes text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  source text NOT NULL,
  source_url text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assets_chain_symbol_unique UNIQUE (chain_id, symbol),
  CONSTRAINT assets_address_or_metadata CHECK (address IS NULL OR address ~* '^0x[0-9a-f]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_assets_chain_support
  ON assets (chain_id, support_level);

CREATE INDEX IF NOT EXISTS idx_assets_chain_address
  ON assets (chain_id, address)
  WHERE address IS NOT NULL;

ALTER TYPE settlement_status ADD VALUE IF NOT EXISTS 'erc20_pending';
ALTER TYPE settlement_status ADD VALUE IF NOT EXISTS 'erc20_settled';

INSERT INTO assets (
  chain_id,
  symbol,
  name,
  address,
  decimals,
  category,
  support_level,
  settlement_modes,
  metadata,
  source,
  source_url,
  verified_at
) VALUES
  (
    421614,
    'USDC',
    'USD Coin',
    '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    6,
    'stablecoin',
    'demo-ready',
    ARRAY['native_legacy', 'erc20_transfer', 'x402_payment'],
    '{"default": true, "faucet": "https://faucet.circle.com", "phase": "C"}'::jsonb,
    'Circle testnet USDC / Arbitrum Sepolia',
    'https://faucet.circle.com',
    now()
  ),
  (
    421614,
    'ETH',
    'Native ETH',
    NULL,
    18,
    'gas',
    'legacy',
    ARRAY['native_legacy'],
    '{"default": false, "purpose": "gas and legacy settlement"}'::jsonb,
    'Arbitrum Sepolia native asset',
    'https://docs.arbitrum.io',
    now()
  ),
  (
    46630,
    'ETH',
    'Native ETH',
    NULL,
    18,
    'gas',
    'legacy',
    ARRAY['native_legacy'],
    '{"default": false, "purpose": "gas and legacy settlement"}'::jsonb,
    'Robinhood Chain Testnet native asset',
    'https://docs.robinhood.com/chain/connecting/',
    now()
  ),
  (
    46630,
    'TSLA',
    'Tesla Tokenized Stock (Testnet)',
    NULL,
    18,
    'rwa-stock-token',
    'metadata-only',
    ARRAY['native_legacy'],
    '{"documentedByFaucet": true, "settlementReady": false}'::jsonb,
    'Robinhood Chain testnet faucet / announcement',
    'https://blog.arbitrum.io/robinhood-chain-testnet/',
    NULL
  ),
  (
    46630,
    'AMZN',
    'Amazon Tokenized Stock (Testnet)',
    NULL,
    18,
    'rwa-stock-token',
    'metadata-only',
    ARRAY['native_legacy'],
    '{"documentedByFaucet": true, "settlementReady": false}'::jsonb,
    'Robinhood Chain testnet faucet / announcement',
    'https://blog.arbitrum.io/robinhood-chain-testnet/',
    NULL
  ),
  (
    46630,
    'PLTR',
    'Palantir Tokenized Stock (Testnet)',
    NULL,
    18,
    'rwa-stock-token',
    'metadata-only',
    ARRAY['native_legacy'],
    '{"documentedByFaucet": true, "settlementReady": false}'::jsonb,
    'Robinhood Chain testnet faucet / announcement',
    'https://blog.arbitrum.io/robinhood-chain-testnet/',
    NULL
  ),
  (
    46630,
    'NFLX',
    'Netflix Tokenized Stock (Testnet)',
    NULL,
    18,
    'rwa-stock-token',
    'metadata-only',
    ARRAY['native_legacy'],
    '{"documentedByFaucet": true, "settlementReady": false}'::jsonb,
    'Robinhood Chain testnet faucet / announcement',
    'https://blog.arbitrum.io/robinhood-chain-testnet/',
    NULL
  ),
  (
    46630,
    'AMD',
    'AMD Tokenized Stock (Testnet)',
    NULL,
    18,
    'rwa-stock-token',
    'metadata-only',
    ARRAY['native_legacy'],
    '{"documentedByFaucet": true, "settlementReady": false}'::jsonb,
    'Robinhood Chain testnet faucet / announcement',
    'https://blog.arbitrum.io/robinhood-chain-testnet/',
    NULL
  ),
  (
    46630,
    'USDG',
    'USDG',
    '0x7E955252E15c84f5768B83c41a71F9eba181802F',
    6,
    'stablecoin',
    'demo-ready',
    ARRAY['native_legacy', 'erc20_transfer'],
    '{"default": false, "faucet": "Paxos faucet via Robinhood Chain docs", "phase": "C"}'::jsonb,
    'Robinhood Chain official token contracts',
    'https://docs.robinhood.com/chain/contracts/',
    now()
  )
ON CONFLICT (chain_id, symbol) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  decimals = EXCLUDED.decimals,
  category = EXCLUDED.category,
  support_level = EXCLUDED.support_level,
  settlement_modes = EXCLUDED.settlement_modes,
  metadata = EXCLUDED.metadata,
  source = EXCLUDED.source,
  source_url = EXCLUDED.source_url,
  verified_at = EXCLUDED.verified_at,
  updated_at = now();
