-- VALEN dev seed: supported chain networks
-- Authority: VALEN_PHASE4_PRODUCTION_SPECIFICATIONS.md Section 5
-- Runs in local/dev only via supabase db reset

INSERT INTO chain_networks (
  chain_id,
  name,
  environment,
  rpc_url_ref,
  explorer_url,
  native_symbol,
  is_supported,
  supports_stylus,
  supports_erc4337
)
VALUES
  (
    421614,
    'Arbitrum Sepolia',
    'testnet',
    'env:ARBITRUM_SEPOLIA_RPC_URL',
    'https://sepolia.arbiscan.io',
    'ETH',
    true,
    true,
    true
  ),
  (
    46630,
    'Robinhood Testnet',
    'testnet',
    'env:ROBINHOOD_TESTNET_RPC_URL',
    'https://explorer.testnet.chain.robinhood.com',
    'ETH',
    true,
    true,
    true
  )
ON CONFLICT (chain_id) DO UPDATE SET
  name = EXCLUDED.name,
  environment = EXCLUDED.environment,
  rpc_url_ref = EXCLUDED.rpc_url_ref,
  explorer_url = EXCLUDED.explorer_url,
  native_symbol = EXCLUDED.native_symbol,
  is_supported = EXCLUDED.is_supported,
  supports_stylus = EXCLUDED.supports_stylus,
  supports_erc4337 = EXCLUDED.supports_erc4337;
