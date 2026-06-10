-- Phase 5.3: persist full on-chain settlement proof on settlements rows

ALTER TABLE settlements
  ADD COLUMN IF NOT EXISTS on_chain_settlement_id text,
  ADD COLUMN IF NOT EXISTS submit_tx_hash text,
  ADD COLUMN IF NOT EXISTS approve_tx_hash text;

CREATE INDEX IF NOT EXISTS idx_settlements_on_chain_settlement_id
  ON settlements (on_chain_settlement_id)
  WHERE on_chain_settlement_id IS NOT NULL;
