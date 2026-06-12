-- VALEN migration 017: mandate-bound API keys

ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS mandate_id uuid;

ALTER TABLE api_keys
  ADD CONSTRAINT api_keys_mandate_id_fkey
    FOREIGN KEY (mandate_id) REFERENCES mandates (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_api_keys_mandate_id ON api_keys (mandate_id);
