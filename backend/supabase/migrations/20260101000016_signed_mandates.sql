-- VALEN migration 016: signed mandate authority fields
-- Extends the existing mandates table for off-chain user-signed authority records.

ALTER TABLE mandates
  ADD COLUMN IF NOT EXISTS policy_id uuid,
  ADD COLUMN IF NOT EXISTS signer_address text,
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS typed_data_hash text,
  ADD COLUMN IF NOT EXISTS typed_data jsonb,
  ADD COLUMN IF NOT EXISTS allowed_chains integer[] NOT NULL DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS allowed_actions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS allowed_assets text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS allowed_targets text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS approval_threshold text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE mandates
  ADD CONSTRAINT mandates_policy_id_fkey
    FOREIGN KEY (policy_id) REFERENCES policies (id);

CREATE INDEX IF NOT EXISTS idx_mandates_policy_id ON mandates (policy_id);
CREATE INDEX IF NOT EXISTS idx_mandates_signer_address ON mandates (signer_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandates_typed_data_hash_unique
  ON mandates (typed_data_hash)
  WHERE typed_data_hash IS NOT NULL;
